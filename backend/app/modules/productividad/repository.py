"""
Repositorio del módulo de productividad.
Acceso a datos de rendimiento técnico desde esquema legacy + dominio.
"""
from datetime import date, timedelta
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, text

from app.models.cyr_models import (
    ControlBrigadasDiario,
    RendimientoTecnicoDiario,
    RendimientoTecnicoActual,
    RendimientoTecnicoHistorial,
    RendimientoTecnicoAdvertencia,
    ControlSupervisores,
    ControlParametrosGenerales,
)
from app.models.domain_models import DimSap, DimZona


class ProductividadRepository:

    def listar_tecnicos(
        self, db: Session, activo: Optional[bool] = None, zonas: Optional[List[str]] = None
    ) -> List[dict]:
        q = (
            db.query(
                DimSap.codigo_sap,
                DimSap.cuenta,
                DimSap.tipo_brigada,
                DimSap.activo,
                DimSap.validado,
                RendimientoTecnicoActual.fase_actual,
                RendimientoTecnicoActual.estado_productivo_actual,
                RendimientoTecnicoActual.dias_consecutivos_bajo_50,
                RendimientoTecnicoActual.dias_consecutivos_alto_desempeno,
                RendimientoTecnicoActual.advertencias_fase2,
            )
            .outerjoin(
                RendimientoTecnicoActual,
                RendimientoTecnicoActual.codigo_sap == DimSap.codigo_sap,
            )
        )
        if activo is not None:
            q = q.filter(DimSap.activo == activo)
        if zonas:
            q = q.filter(DimSap.codigo_sap.in_(
                db.query(ControlBrigadasDiario.codigo_sap)
                .filter(
                    ControlBrigadasDiario.zona.in_(zonas),
                    ControlBrigadasDiario.codigo_sap.isnot(None),
                    ControlBrigadasDiario.codigo_sap != "",
                )
                .distinct()
            ))
        rows = q.all()
        # Obtener última zona conocida de cada técnico desde control_brigadas_diario
        codigos = [r.codigo_sap for r in rows]
        zona_map = {}
        if codigos:
            zona_subq = (
                db.query(
                    ControlBrigadasDiario.codigo_sap,
                    ControlBrigadasDiario.zona,
                    func.row_number().over(
                        partition_by=ControlBrigadasDiario.codigo_sap,
                        order_by=desc(ControlBrigadasDiario.fecha_operacional),
                    ).label("rn"),
                )
                .filter(
                    ControlBrigadasDiario.codigo_sap.in_(codigos),
                    ControlBrigadasDiario.zona.isnot(None),
                    ControlBrigadasDiario.zona != "",
                )
                .subquery()
            )
            zona_rows = (
                db.query(zona_subq.c.codigo_sap, zona_subq.c.zona)
                .filter(zona_subq.c.rn == 1)
                .all()
            )
            zona_map = {r.codigo_sap: r.zona for r in zona_rows}
        return [
            {
                "codigo_sap": r.codigo_sap,
                "cuenta": r.cuenta,
                "tipo_brigada": r.tipo_brigada,
                "activo": r.activo,
                "validado": r.validado,
                "zona": zona_map.get(r.codigo_sap),
                "fase_actual": r.fase_actual or 1,
                "estado_productivo_actual": r.estado_productivo_actual or "SIN_EVALUACION",
                "dias_consecutivos_bajo_50": r.dias_consecutivos_bajo_50 or 0,
                "dias_consecutivos_alto_desempeno": r.dias_consecutivos_alto_desempeno or 0,
                "advertencias_fase2": r.advertencias_fase2 or 0,
            }
            for r in rows
        ]

    def obtener_rendimiento_diario(
        self,
        db: Session,
        fecha_desde: Optional[date] = None,
        fecha_hasta: Optional[date] = None,
        codigo_sap: Optional[str] = None,
        zona: Optional[str] = None,
        supervisor_id: Optional[int] = None,
        estado_diario: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[RendimientoTecnicoDiario]:
        q = db.query(RendimientoTecnicoDiario)
        if fecha_desde:
            q = q.filter(RendimientoTecnicoDiario.fecha_operacional >= fecha_desde)
        if fecha_hasta:
            q = q.filter(RendimientoTecnicoDiario.fecha_operacional <= fecha_hasta)
        if codigo_sap:
            q = q.filter(RendimientoTecnicoDiario.codigo_sap == codigo_sap)
        if zona:
            q = q.filter(RendimientoTecnicoDiario.zona == zona)
        if supervisor_id:
            q = q.filter(RendimientoTecnicoDiario.supervisor_id == supervisor_id)
        if estado_diario:
            q = q.filter(RendimientoTecnicoDiario.estado_diario == estado_diario)
        return q.order_by(
            desc(RendimientoTecnicoDiario.fecha_operacional),
            RendimientoTecnicoDiario.codigo_sap,
        ).offset(offset).limit(limit).all()

    def resumen_por_zona(
        self, db: Session, fecha: date, zona: Optional[str] = None, supervisor_id: Optional[int] = None
    ) -> List[dict]:
        q = db.query(
            RendimientoTecnicoDiario.zona,
            func.count(RendimientoTecnicoDiario.id).label("total_tecnicos"),
            func.sum(
                func.cast(RendimientoTecnicoDiario.es_evaluable, func.Integer())
            ).label("tecnicos_evaluables"),
            func.avg(RendimientoTecnicoDiario.cumplimiento_pct).label("promedio_cumplimiento"),
            func.coalesce(func.sum(RendimientoTecnicoDiario.corte_en_poste), 0).label("corte_en_poste_sum"),
            func.coalesce(func.sum(RendimientoTecnicoDiario.corte_en_empalme), 0).label("corte_en_empalme_sum"),
            func.coalesce(func.sum(RendimientoTecnicoDiario.corte_fuera_de_rango), 0).label("corte_fuera_de_rango_sum"),
            func.coalesce(func.sum(RendimientoTecnicoDiario.visita_fallida), 0).label("visita_fallida_sum"),
            func.coalesce(func.sum(RendimientoTecnicoDiario.reconexiones), 0).label("reconexiones_sum"),
        ).filter(RendimientoTecnicoDiario.fecha_operacional == fecha)
        if zona:
            q = q.filter(RendimientoTecnicoDiario.zona == zona)
        if supervisor_id:
            q = q.filter(RendimientoTecnicoDiario.supervisor_id == supervisor_id)
        q = q.group_by(RendimientoTecnicoDiario.zona)
        rows = q.all()

        result = []
        for r in rows:
            estados = self._contar_estados(db, fecha, zona=r.zona, supervisor_id=supervisor_id)
            result.append({
                "zona": r.zona,
                "fecha_operacional": fecha,
                "total_tecnicos": r.total_tecnicos,
                "tecnicos_evaluables": r.tecnicos_evaluables or 0,
                "tecnicos_no_evaluables": r.total_tecnicos - (r.tecnicos_evaluables or 0),
                "promedio_cumplimiento": round(r.promedio_cumplimiento or 0, 2),
                "corte_en_poste_sum": r.corte_en_poste_sum,
                "corte_en_empalme_sum": r.corte_en_empalme_sum,
                "corte_fuera_de_rango_sum": r.corte_fuera_de_rango_sum,
                "visita_fallida_sum": r.visita_fallida_sum,
                "reconexiones_sum": r.reconexiones_sum,
                **estados,
            })
        return result

    def _contar_estados(
        self, db: Session, fecha: date, zona: Optional[str] = None, supervisor_id: Optional[int] = None
    ) -> dict:
        q = db.query(
            RendimientoTecnicoDiario.estado_diario,
            func.count(RendimientoTecnicoDiario.id).label("cnt"),
        ).filter(
            RendimientoTecnicoDiario.fecha_operacional == fecha,
            RendimientoTecnicoDiario.es_evaluable == True,
        )
        if zona:
            q = q.filter(RendimientoTecnicoDiario.zona == zona)
        if supervisor_id:
            q = q.filter(RendimientoTecnicoDiario.supervisor_id == supervisor_id)
        q = q.group_by(RendimientoTecnicoDiario.estado_diario)
        rows = q.all()
        counts = {"criticos": 0, "recuperacion": 0, "estables": 0, "alto_desempeno": 0}
        label_map = {
            "CRITICO": "criticos",
            "RECUPERACION": "recuperacion",
            "ESTABLE": "estables",
            "ALTO_DESEMPENO": "alto_desempeno",
        }
        for r in rows:
            key = label_map.get(r.estado_diario)
            if key:
                counts[key] = r.cnt
        return counts

    def ranking(
        self,
        db: Session,
        fecha_hasta: Optional[date] = None,
        zona: Optional[str] = None,
        supervisor_id: Optional[int] = None,
        limit: int = 50,
    ) -> List[dict]:
        if fecha_hasta is None:
            fecha_hasta = date.today()
        fecha_desde = fecha_hasta - timedelta(days=30)

        q = db.query(
            RendimientoTecnicoDiario.codigo_sap,
            func.avg(RendimientoTecnicoDiario.cumplimiento_pct).label("promedio"),
            func.count(RendimientoTecnicoDiario.id).label("dias_evaluados"),
        ).filter(
            RendimientoTecnicoDiario.fecha_operacional.between(fecha_desde, fecha_hasta),
            RendimientoTecnicoDiario.es_evaluable == True,
        )
        if zona:
            q = q.filter(RendimientoTecnicoDiario.zona == zona)
        if supervisor_id:
            q = q.filter(RendimientoTecnicoDiario.supervisor_id == supervisor_id)
        q = q.group_by(RendimientoTecnicoDiario.codigo_sap).order_by(desc("promedio")).limit(limit)
        rows = q.all()

        codigos = [r.codigo_sap for r in rows]
        sap_map = {}
        if codigos:
            saps = db.query(DimSap).filter(DimSap.codigo_sap.in_(codigos)).all()
            sap_map = {s.codigo_sap: s for s in saps}
        actual_map = {}
        actuals = db.query(RendimientoTecnicoActual).filter(
            RendimientoTecnicoActual.codigo_sap.in_(codigos)
        ).all()
        actual_map = {a.codigo_sap: a for a in actuals}

        result = []
        for r in rows:
            sap = sap_map.get(r.codigo_sap)
            act = actual_map.get(r.codigo_sap)
            result.append({
                "codigo_sap": r.codigo_sap,
                "cuenta": sap.cuenta if sap else r.codigo_sap,
                "zona": None,
                "promedio_cumplimiento_30d": round(r.promedio or 0, 2),
                "dias_evaluados_30d": r.dias_evaluados or 0,
                "tendencia": self._calcular_tendencia(db, r.codigo_sap, fecha_desde, fecha_hasta),
                "fase_actual": act.fase_actual if act else 1,
                "estado_productivo_actual": act.estado_productivo_actual if act else "SIN_EVALUACION",
            })
        return result

    def _calcular_tendencia(
        self, db: Session, codigo_sap: str, fecha_desde: date, fecha_hasta: date
    ) -> str:
        mitad = fecha_desde + (fecha_hasta - fecha_desde) / 2
        q1 = db.query(func.avg(RendimientoTecnicoDiario.cumplimiento_pct)).filter(
            RendimientoTecnicoDiario.codigo_sap == codigo_sap,
            RendimientoTecnicoDiario.fecha_operacional.between(fecha_desde, mitad),
            RendimientoTecnicoDiario.es_evaluable == True,
        ).scalar() or 0
        q2 = db.query(func.avg(RendimientoTecnicoDiario.cumplimiento_pct)).filter(
            RendimientoTecnicoDiario.codigo_sap == codigo_sap,
            RendimientoTecnicoDiario.fecha_operacional.between(mitad + timedelta(days=1), fecha_hasta),
            RendimientoTecnicoDiario.es_evaluable == True,
        ).scalar() or 0
        diff = float(q2) - float(q1)
        if diff > 5:
            return "MEJORANDO"
        if diff < -5:
            return "EMPEORANDO"
        return "ESTABLE"

    def historial(
        self,
        db: Session,
        codigo_sap: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[RendimientoTecnicoHistorial]:
        q = db.query(RendimientoTecnicoHistorial)
        if codigo_sap:
            q = q.filter(RendimientoTecnicoHistorial.codigo_sap == codigo_sap)
        return q.order_by(
            desc(RendimientoTecnicoHistorial.fecha_cambio)
        ).offset(offset).limit(limit).all()

    def alertas(
        self,
        db: Session,
        estado: Optional[str] = None,
        codigo_sap: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[RendimientoTecnicoAdvertencia]:
        q = db.query(RendimientoTecnicoAdvertencia)
        if estado:
            q = q.filter(RendimientoTecnicoAdvertencia.estado == estado)
        if codigo_sap:
            q = q.filter(RendimientoTecnicoAdvertencia.codigo_sap == codigo_sap)
        return q.order_by(
            desc(RendimientoTecnicoAdvertencia.fecha_registro)
        ).offset(offset).limit(limit).all()

    def obtener_meta_diaria(self, db: Session) -> int:
        pg = db.query(ControlParametrosGenerales).filter(
            ControlParametrosGenerales.activo == True
        ).first()
        if pg:
            return pg.meta_diaria_cortes_brigada or 30
        return 30
