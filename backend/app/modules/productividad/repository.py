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
    RendimientoTecnicoCausaFallida,
    ControlSupervisores,
    ControlParametrosGenerales,
    RendimientoTecnicoSemaforoManual,
)
from app.models.domain_models import DimSap, DimZona
from sqlalchemy import and_
from app.core.brigadas import (
    condicion_brigada_contabilizable,
    condicion_rendimiento_con_brigada_contabilizable,
)


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
                    condicion_brigada_contabilizable(ControlBrigadasDiario),
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
                    condicion_brigada_contabilizable(ControlBrigadasDiario),
                )
                .subquery()
            )
            zona_rows = (
                db.query(zona_subq.c.codigo_sap, zona_subq.c.zona)
                .filter(zona_subq.c.rn == 1)
                .all()
            )
            zona_map = {r.codigo_sap: r.zona for r in zona_rows}
        result = []
        for r in rows:
            zona = zona_map.get(r.codigo_sap)
            if zonas and zona not in zonas:
                continue
            result.append({
                "codigo_sap": r.codigo_sap,
                "cuenta": r.cuenta,
                "tipo_brigada": r.tipo_brigada,
                "activo": r.activo,
                "validado": r.validado,
                "zona": zona,
                "fase_actual": r.fase_actual or 1,
                "estado_productivo_actual": r.estado_productivo_actual or "SIN_EVALUACION",
                "dias_consecutivos_bajo_50": r.dias_consecutivos_bajo_50 or 0,
                "dias_consecutivos_alto_desempeno": r.dias_consecutivos_alto_desempeno or 0,
                "advertencias_fase2": r.advertencias_fase2 or 0,
            })
        return result

    def resumen_panel_zonas(
        self, db: Session, zonas_permitidas: Optional[list[str]] = None
    ) -> list[dict]:
        """
        Agrega técnicos activos por zona con conteo de estado_productivo_actual,
        fase_actual y advertencias activas. Usa DimSap como fuente canónica
        y control_brigadas_diario para la última zona conocida.
        """
        from collections import defaultdict

        # Obtener técnicos activos con su última zona
        q = db.query(
            DimSap.codigo_sap,
            DimSap.cuenta,
            DimSap.tipo_brigada,
            RendimientoTecnicoActual.fase_actual,
            RendimientoTecnicoActual.estado_productivo_actual,
            RendimientoTecnicoActual.advertencias_fase2,
        ).outerjoin(
            RendimientoTecnicoActual,
            RendimientoTecnicoActual.codigo_sap == DimSap.codigo_sap,
        ).filter(DimSap.activo == True)

        if zonas_permitidas:
            q = q.filter(DimSap.codigo_sap.in_(
                db.query(ControlBrigadasDiario.codigo_sap)
                .filter(
                    ControlBrigadasDiario.zona.in_(zonas_permitidas),
                    ControlBrigadasDiario.codigo_sap.isnot(None),
                    ControlBrigadasDiario.codigo_sap != "",
                    condicion_brigada_contabilizable(ControlBrigadasDiario),
                )
                .distinct()
            ))

        rows = q.all()
        codigos = [r.codigo_sap for r in rows]

        # Última zona conocida por técnico
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
                    condicion_brigada_contabilizable(ControlBrigadasDiario),
                )
                .subquery()
            )
            zona_rows = (
                db.query(zona_subq.c.codigo_sap, zona_subq.c.zona)
                .filter(zona_subq.c.rn == 1)
                .all()
            )
            zona_map = {r.codigo_sap: r.zona for r in zona_rows}

        # Advertencias activas por técnico
        adv_count = defaultdict(int)
        if codigos:
            adv_rows = db.query(
                RendimientoTecnicoAdvertencia.codigo_sap,
                func.count(RendimientoTecnicoAdvertencia.id).label("cnt"),
            ).filter(
                and_(
                    RendimientoTecnicoAdvertencia.codigo_sap.in_(codigos),
                    RendimientoTecnicoAdvertencia.estado == 'ACTIVA',
                )
            ).group_by(RendimientoTecnicoAdvertencia.codigo_sap).all()
            for r in adv_rows:
                adv_count[r.codigo_sap] = r.cnt

        # Técnicos evaluables hoy
        hoy = date.today()
        evaluables_hoy = set()
        eval_rows = db.query(RendimientoTecnicoDiario.codigo_sap).filter(
            RendimientoTecnicoDiario.fecha_operacional == hoy,
            RendimientoTecnicoDiario.es_evaluable == True,
            condicion_rendimiento_con_brigada_contabilizable(
                RendimientoTecnicoDiario,
                ControlBrigadasDiario,
            ),
        ).all()
        evaluables_hoy = {r.codigo_sap for r in eval_rows}

        # Agrupar por zona
        zonas = defaultdict(lambda: {
            "total_tecnicos": 0,
            "tecnicos_evaluables_hoy": 0,
            "sin_evaluacion": 0,
            "criticos": 0,
            "recuperacion": 0,
            "estables": 0,
            "alto_desempeno": 0,
            "fase_1": 0,
            "fase_2": 0,
            "fase_3": 0,
            "advertencias_activas": 0,
        })

        for r in rows:
            zona = zona_map.get(r.codigo_sap)
            if not zona:
                continue
            if zonas_permitidas and zona not in zonas_permitidas:
                continue
            z = zonas[zona]
            z["total_tecnicos"] += 1
            if r.codigo_sap in evaluables_hoy:
                z["tecnicos_evaluables_hoy"] += 1

            estado = (r.estado_productivo_actual or "SIN_EVALUACION")
            estado_key = {
                "SIN_EVALUACION": "sin_evaluacion",
                "CRITICO": "criticos",
                "RECUPERACION": "recuperacion",
                "ESTABLE": "estables",
                "ALTO_DESEMPENO": "alto_desempeno",
            }.get(estado, "sin_evaluacion")
            z[estado_key] += 1

            fase = r.fase_actual or 1
            if fase == 1:
                z["fase_1"] += 1
            elif fase == 2:
                z["fase_2"] += 1
            else:
                z["fase_3"] += 1

            z["advertencias_activas"] += adv_count.get(r.codigo_sap, 0)

        # Calcular prioridad y construir resultado
        result = []
        for zona, data in sorted(zonas.items()):
            prioridad = self._calcular_prioridad_zona(data)
            result.append({
                "zona": zona,
                **data,
                "prioridad": prioridad,
            })

        return result

    def _calcular_prioridad_zona(self, data: dict) -> str:
        if data["fase_3"] > 0 or data["criticos"] > 0 or data["advertencias_activas"] >= 5:
            return "ALTA"
        if data["fase_2"] > 0 or data["recuperacion"] >= 3:
            return "MEDIA"
        return "NORMAL"

    def obtener_semaforos_por_tecnico(
        self, db: Session, codigo_sap: str
    ) -> List[RendimientoTecnicoSemaforoManual]:
        """Obtiene los semáforos manuales registrados para un técnico."""
        return (
            db.query(RendimientoTecnicoSemaforoManual)
            .filter(RendimientoTecnicoSemaforoManual.codigo_sap == codigo_sap)
            .all()
        )

    def upsert_semaforo_tecnico(
        self, db: Session, codigo_sap: str, categoria: str, estado: str, descripcion: Optional[str], usuario_id: int
    ) -> RendimientoTecnicoSemaforoManual:
        """Actualiza o crea el registro de semáforo manual."""
        semaforo = (
            db.query(RendimientoTecnicoSemaforoManual)
            .filter(
                RendimientoTecnicoSemaforoManual.codigo_sap == codigo_sap,
                RendimientoTecnicoSemaforoManual.categoria == categoria
            )
            .first()
        )

        if not semaforo:
            semaforo = RendimientoTecnicoSemaforoManual(
                codigo_sap=codigo_sap,
                categoria=categoria,
                estado=estado,
                descripcion=descripcion,
                usuario_actualiza_id=usuario_id,
            )
            db.add(semaforo)
        else:
            semaforo.estado = estado
            semaforo.descripcion = descripcion
            semaforo.usuario_actualiza_id = usuario_id

        db.commit()
        db.refresh(semaforo)
        return semaforo


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
        q = db.query(RendimientoTecnicoDiario).filter(
            condicion_rendimiento_con_brigada_contabilizable(
                RendimientoTecnicoDiario,
                ControlBrigadasDiario,
            )
        )
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

    def obtener_causas_fallidas(
        self, db: Session, codigo_sap: str, fecha: date
    ) -> List[RendimientoTecnicoCausaFallida]:
        return db.query(RendimientoTecnicoCausaFallida).filter(
            RendimientoTecnicoCausaFallida.codigo_sap == codigo_sap,
            RendimientoTecnicoCausaFallida.fecha_operacional == fecha,
        ).all()

    def obtener_brigada_fuente(
        self, db: Session, codigo_sap: str, fecha: date
    ) -> Optional[ControlBrigadasDiario]:
        """Obtiene la fila canónica de Resumen general para una fecha y SAP."""
        return db.query(ControlBrigadasDiario).filter(
            ControlBrigadasDiario.codigo_sap == codigo_sap,
            ControlBrigadasDiario.fecha_operacional == fecha,
            condicion_brigada_contabilizable(ControlBrigadasDiario),
        ).order_by(desc(ControlBrigadasDiario.id)).first()

    def obtener_brigadas_periodo(
        self, db: Session, codigo_sap: str, fecha_desde: date, fecha_hasta: date
    ) -> List[ControlBrigadasDiario]:
        return db.query(ControlBrigadasDiario).filter(
            ControlBrigadasDiario.codigo_sap == codigo_sap,
            ControlBrigadasDiario.fecha_operacional.between(fecha_desde, fecha_hasta),
            condicion_brigada_contabilizable(ControlBrigadasDiario),
        ).order_by(
            ControlBrigadasDiario.fecha_operacional,
            ControlBrigadasDiario.id,
        ).all()

    def obtener_brigada_anterior(
        self, db: Session, codigo_sap: str, fecha: date
    ) -> Optional[ControlBrigadasDiario]:
        return db.query(ControlBrigadasDiario).filter(
            ControlBrigadasDiario.codigo_sap == codigo_sap,
            ControlBrigadasDiario.fecha_operacional < fecha,
            condicion_brigada_contabilizable(ControlBrigadasDiario),
        ).order_by(
            desc(ControlBrigadasDiario.fecha_operacional),
            desc(ControlBrigadasDiario.id),
        ).first()

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
        ).filter(
            RendimientoTecnicoDiario.fecha_operacional == fecha,
            condicion_rendimiento_con_brigada_contabilizable(
                RendimientoTecnicoDiario,
                ControlBrigadasDiario,
            ),
        )
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
            condicion_rendimiento_con_brigada_contabilizable(
                RendimientoTecnicoDiario,
                ControlBrigadasDiario,
            ),
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
            condicion_rendimiento_con_brigada_contabilizable(
                RendimientoTecnicoDiario,
                ControlBrigadasDiario,
            ),
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
            condicion_rendimiento_con_brigada_contabilizable(
                RendimientoTecnicoDiario,
                ControlBrigadasDiario,
            ),
        ).scalar() or 0
        q2 = db.query(func.avg(RendimientoTecnicoDiario.cumplimiento_pct)).filter(
            RendimientoTecnicoDiario.codigo_sap == codigo_sap,
            RendimientoTecnicoDiario.fecha_operacional.between(mitad + timedelta(days=1), fecha_hasta),
            RendimientoTecnicoDiario.es_evaluable == True,
            condicion_rendimiento_con_brigada_contabilizable(
                RendimientoTecnicoDiario,
                ControlBrigadasDiario,
            ),
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

    def actualizar_estado_tecnico(
        self, db: Session, codigo_sap: str
    ) -> dict:
        """
        Calcula y actualiza el estado_productivo_actual de un técnico
        según su tipo_brigada y su último día evaluable.

        Reglas:
          Si el día no es evaluable → no cambia estado.
          PXQ: 0-12=CRITICO, 13-24=RECUPERACION, >=25=ESTABLE,
               >=25 por 3 días evaluables consecutivos=ALTO_DESEMPENO.
          CF:  0-2=CRITICO, 3-5=RECUPERACION, >=6=ESTABLE,
               >=6 por 3 días evaluables consecutivos=ALTO_DESEMPENO.
        """
        sap = db.query(DimSap).filter(DimSap.codigo_sap == codigo_sap).first()
        if not sap:
            return {"actualizado": False, "mensaje": "Técnico no encontrado en DimSap"}

        tipo = sap.tipo_brigada
        # Umbrales basados en cortes_productivos
        if tipo == "CF":
            umbral_critico = 2
            umbral_recuperacion = 3
            umbral_estable = 6
        else:  # PXQ (default)
            umbral_critico = 12
            umbral_recuperacion = 13
            umbral_estable = 25

        # Último registro evaluable
        ultimo = db.query(RendimientoTecnicoDiario).filter(
            and_(
                RendimientoTecnicoDiario.codigo_sap == codigo_sap,
                RendimientoTecnicoDiario.es_evaluable == True,
                condicion_rendimiento_con_brigada_contabilizable(
                    RendimientoTecnicoDiario,
                    ControlBrigadasDiario,
                ),
            )
        ).order_by(desc(RendimientoTecnicoDiario.fecha_operacional)).first()

        if not ultimo:
            return {"actualizado": False, "mensaje": "Sin registros evaluables, estado no cambia"}

        cortes = ultimo.cortes_productivos

        # Determinar estado base del día
        if cortes >= umbral_estable:
            estado = "ESTABLE"
        elif cortes >= umbral_recuperacion:
            estado = "RECUPERACION"
        else:
            estado = "CRITICO"

        # Verificar 3 días consecutivos evaluables ALTO_DESEMPENO
        if cortes >= umbral_estable:
            dias_previos = db.query(RendimientoTecnicoDiario).filter(
                and_(
                    RendimientoTecnicoDiario.codigo_sap == codigo_sap,
                    RendimientoTecnicoDiario.es_evaluable == True,
                    RendimientoTecnicoDiario.fecha_operacional < ultimo.fecha_operacional,
                    condicion_rendimiento_con_brigada_contabilizable(
                        RendimientoTecnicoDiario,
                        ControlBrigadasDiario,
                    ),
                )
            ).order_by(desc(RendimientoTecnicoDiario.fecha_operacional)).limit(2).all()

            # Si hay exactamente 2 días previos evaluables que también cumplen
            if len(dias_previos) == 2:
                todos_cumplen = all(
                    d.cortes_productivos >= umbral_estable for d in dias_previos
                )
                if todos_cumplen:
                    estado = "ALTO_DESEMPENO"

        # Actualizar o crear RendimientoTecnicoActual
        actual = db.query(RendimientoTecnicoActual).filter(
            RendimientoTecnicoActual.codigo_sap == codigo_sap
        ).first()

        estado_anterior = actual.estado_productivo_actual if actual else None

        # ── Calcular días acumulados del mes ──────────────────────────────
        # Obtener todos los días evaluables del mes en curso
        from datetime import date as date_type
        hoy = ultimo.fecha_operacional
        primer_dia_mes = hoy.replace(day=1)

        dias_del_mes = db.query(RendimientoTecnicoDiario).filter(
            and_(
                RendimientoTecnicoDiario.codigo_sap == codigo_sap,
                RendimientoTecnicoDiario.es_evaluable == True,
                RendimientoTecnicoDiario.fecha_operacional >= primer_dia_mes,
                RendimientoTecnicoDiario.fecha_operacional <= hoy,
                condicion_rendimiento_con_brigada_contabilizable(
                    RendimientoTecnicoDiario,
                    ControlBrigadasDiario,
                ),
            )
        ).all()

        # Total días del mes con cumplimiento < 50%
        racha_bajo_50 = sum(
            1 for d in dias_del_mes
            if d.cumplimiento_pct is not None and d.cumplimiento_pct < 50
        )

        # Total días del mes con cortes >= umbral de alto desempeño
        racha_alto = sum(
            1 for d in dias_del_mes
            if d.cortes_productivos is not None and d.cortes_productivos >= umbral_estable
        )

        if not actual:
            actual = RendimientoTecnicoActual(
                codigo_sap=codigo_sap,
                fase_actual=1,
                estado_productivo_actual=estado,
                dias_consecutivos_bajo_50=racha_bajo_50,
                dias_consecutivos_alto_desempeno=racha_alto,
            )
            db.add(actual)
        else:
            actual.estado_productivo_actual = estado
            actual.dias_consecutivos_bajo_50 = racha_bajo_50
            actual.dias_consecutivos_alto_desempeno = racha_alto

        db.flush()
        db.commit()

        return {
            "actualizado": True,
            "codigo_sap": codigo_sap,
            "tipo_brigada": tipo,
            "cortes_productivos": cortes,
            "estado_anterior": estado_anterior if estado_anterior and estado_anterior != estado else None,
            "estado_nuevo": estado,
            "dias_consecutivos_bajo_50": racha_bajo_50,
            "dias_consecutivos_alto_desempeno": racha_alto,
        }


    def cambiar_fase_manual(
        self, db: Session, codigo_sap: str, fase_nueva: int, motivo: str, usuario_id: int
    ) -> dict:
        actual = db.query(RendimientoTecnicoActual).filter(
            RendimientoTecnicoActual.codigo_sap == codigo_sap
        ).first()

        if not actual:
            actual = RendimientoTecnicoActual(
                codigo_sap=codigo_sap,
                fase_actual=1,
                estado_productivo_actual="SIN_EVALUACION",
            )
            db.add(actual)
            db.flush()

        fase_anterior = actual.fase_actual
        if fase_anterior == fase_nueva:
            return {"cambiado": False, "fase_anterior": fase_anterior, "fase_nueva": fase_nueva}

        actual.fase_actual = fase_nueva
        db.flush()

        historial = RendimientoTecnicoHistorial(
            codigo_sap=codigo_sap,
            tipo_cambio='FASE',
            fase_anterior=fase_anterior,
            fase_nueva=fase_nueva,
            motivo=motivo,
            regla_disparadora='CAMBIO_MANUAL_TORRE_CONTROL',
            usuario_id=usuario_id,
        )
        db.add(historial)
        db.flush()
        db.commit()

        return {"cambiado": True, "fase_anterior": fase_anterior, "fase_nueva": fase_nueva}

    def obtener_seguimiento_tecnico(
        self, db: Session, codigo_sap: str
    ) -> Optional[dict]:
        sap = db.query(DimSap).filter(DimSap.codigo_sap == codigo_sap).first()
        if not sap:
            return None
        actual = db.query(RendimientoTecnicoActual).filter(
            RendimientoTecnicoActual.codigo_sap == codigo_sap
        ).first()

        # Obtener supervisor
        sup_nombre = None
        sup_row = db.execute(text("""
            SELECT cs.nombre FROM control_supervisor_usuarios_sap csus
            JOIN control_supervisores cs ON cs.id = csus.supervisor_id
            WHERE csus.codigo_sap = :codigo_sap
            LIMIT 1
        """), {"codigo_sap": codigo_sap}).first()
        if sup_row:
            sup_nombre = sup_row[0]

        # Última zona desde control_brigadas_diario
        zona = None
        zona_row = db.execute(text("""
            SELECT zona FROM control_brigadas_diario
            WHERE codigo_sap = :codigo_sap
              AND zona IS NOT NULL AND zona != ''
              AND LOWER(TRIM(COALESCE(estado_brigada, ''))) != 'inactiva'
            ORDER BY fecha_operacional DESC LIMIT 1
        """), {"codigo_sap": codigo_sap}).first()
        if zona_row:
            zona = zona_row[0]

        # Advertencias activas
        advertencias = db.query(RendimientoTecnicoAdvertencia).filter(
            and_(
                RendimientoTecnicoAdvertencia.codigo_sap == codigo_sap,
                RendimientoTecnicoAdvertencia.estado == 'ACTIVA',
            )
        ).order_by(desc(RendimientoTecnicoAdvertencia.fecha_registro)).all()

        # Historial reciente (últimos 20)
        historial = db.query(RendimientoTecnicoHistorial).filter(
            RendimientoTecnicoHistorial.codigo_sap == codigo_sap
        ).order_by(desc(RendimientoTecnicoHistorial.fecha_cambio)).limit(20).all()

        return {
            "codigo_sap": codigo_sap,
            "usuario": sap.cuenta or codigo_sap,
            "zona": zona,
            "supervisor": sup_nombre,
            "fase_actual": actual.fase_actual if actual else 1,
            "estado_productivo_actual": actual.estado_productivo_actual if actual else "SIN_EVALUACION",
            "dias_consecutivos_bajo_50": actual.dias_consecutivos_bajo_50 if actual else 0,
            "dias_consecutivos_alto_desempeno": actual.dias_consecutivos_alto_desempeno if actual else 0,
            "advertencias_fase2": actual.advertencias_fase2 if actual else 0,
            "fecha_ultima_evaluacion": actual.fecha_ultima_evaluacion if actual else None,
            "advertencias_activas": advertencias,
            "historial_reciente": historial,
        }

    def registrar_advertencia(
        self, db: Session, codigo_sap: str, fecha_operacional: date, motivo: str, usuario_id: int
    ) -> dict:
        actual = db.query(RendimientoTecnicoActual).filter(
            RendimientoTecnicoActual.codigo_sap == codigo_sap
        ).first()

        if not actual:
            actual = RendimientoTecnicoActual(
                codigo_sap=codigo_sap,
                fase_actual=1,
                estado_productivo_actual="SIN_EVALUACION",
            )
            db.add(actual)
            db.flush()

        fase_al_momento = actual.fase_actual

        # Contar advertencias activas previas en Fase 2
        adv_activas_count = db.query(func.count(RendimientoTecnicoAdvertencia.id)).filter(
            and_(
                RendimientoTecnicoAdvertencia.codigo_sap == codigo_sap,
                RendimientoTecnicoAdvertencia.estado == 'ACTIVA',
                RendimientoTecnicoAdvertencia.fase_al_momento == 2,
            )
        ).scalar() or 0

        nuevo_numero = adv_activas_count + 1

        advertencia = RendimientoTecnicoAdvertencia(
            codigo_sap=codigo_sap,
            fecha_operacional=fecha_operacional,
            fase_al_momento=fase_al_momento,
            numero_advertencia=nuevo_numero if fase_al_momento == 2 else None,
            motivo=motivo,
            estado='ACTIVA',
            registrada_por_id=usuario_id,
        )
        db.add(advertencia)
        db.flush()

        # Actualizar contador en rendimiento_tecnico_actual
        if fase_al_momento == 2:
            actual.advertencias_fase2 = nuevo_numero
        else:
            actual.advertencias_fase2 = actual.advertencias_fase2 + 1 if actual.advertencias_fase2 else 1

        db.flush()

        fase_anterior = fase_al_momento
        fase_nueva = fase_al_momento
        paso_a_fase_3 = False

        # Regla: si fase_actual == 2 y hay 3+ advertencias activas en Fase 2
        if fase_al_momento == 2 and nuevo_numero >= 3:
            actual.fase_actual = 3
            fase_nueva = 3
            paso_a_fase_3 = True
            db.flush()

            historial = RendimientoTecnicoHistorial(
                codigo_sap=codigo_sap,
                tipo_cambio='FASE',
                fase_anterior=2,
                fase_nueva=3,
                motivo='Activación de Fase 3 por 3 advertencias activas en Fase 2',
                regla_disparadora='FASE_3_POR_3_ADVERTENCIAS_ACTIVAS',
                usuario_id=usuario_id,
            )
            db.add(historial)
        else:
            historial = RendimientoTecnicoHistorial(
                codigo_sap=codigo_sap,
                tipo_cambio='ADVERTENCIA',
                fase_anterior=fase_anterior,
                fase_nueva=fase_nueva,
                motivo=motivo,
                regla_disparadora='ADVERTENCIA_TORRE_CONTROL',
                usuario_id=usuario_id,
            )
            db.add(historial)

        db.flush()
        db.commit()

        return {
            "advertencia": advertencia,
            "fase_anterior": fase_anterior if paso_a_fase_3 else None,
            "fase_nueva": fase_nueva if paso_a_fase_3 else None,
            "advertencias_activas_count": nuevo_numero if fase_al_momento == 2 else 1,
            "paso_a_fase_3": paso_a_fase_3,
        }

    def anular_advertencia(
        self, db: Session, advertencia_id: int, motivo_anulacion: str, usuario_id: int
    ) -> dict:
        adv = db.query(RendimientoTecnicoAdvertencia).filter(
            RendimientoTecnicoAdvertencia.id == advertencia_id
        ).first()

        if not adv:
            return {"encontrado": False, "mensaje": f"Advertencia {advertencia_id} no encontrada"}

        if adv.estado != 'ACTIVA':
            return {"encontrado": True, "mensaje": f"La advertencia ya está {adv.estado.lower()}", "ya_anulada": True}

        codigo_sap = adv.codigo_sap
        adv.estado = 'ANULADA'
        adv.anulada_por_id = usuario_id
        adv.fecha_anulacion = func.now()
        adv.motivo_anulacion = motivo_anulacion
        db.flush()

        # Decrementar contador en rendimiento_tecnico_actual
        actual = db.query(RendimientoTecnicoActual).filter(
            RendimientoTecnicoActual.codigo_sap == codigo_sap
        ).first()

        fase_anterior = None
        fase_nueva = None

        if actual:
            fase_anterior = actual.fase_actual
            if actual.advertencias_fase2 > 0:
                actual.advertencias_fase2 -= 1

            # Si estaba en Fase 3 y ahora tiene < 3 advertencias activas, volver a Fase 2
            if actual.fase_actual == 3:
                advs_activas = db.query(func.count(RendimientoTecnicoAdvertencia.id)).filter(
                    and_(
                        RendimientoTecnicoAdvertencia.codigo_sap == codigo_sap,
                        RendimientoTecnicoAdvertencia.estado == 'ACTIVA',
                        RendimientoTecnicoAdvertencia.fase_al_momento == 2,
                    )
                ).scalar() or 0

                if advs_activas < 3:
                    actual.fase_actual = 2
                    fase_nueva = 2

                    historial = RendimientoTecnicoHistorial(
                        codigo_sap=codigo_sap,
                        tipo_cambio='FASE',
                        fase_anterior=3,
                        fase_nueva=2,
                        motivo=f'Retorno a Fase 2 por anulación de advertencia: {motivo_anulacion[:200]}',
                        regla_disparadora='RETORNO_FASE_2_POR_ANULACION',
                        usuario_id=usuario_id,
                    )
                    db.add(historial)
                    db.flush()

        db.commit()

        return {
            "encontrado": True,
            "codigo_sap": codigo_sap,
            "advertencia": adv,
            "fase_anterior": fase_anterior,
            "fase_nueva": fase_nueva,
        }

    def eliminar_advertencia(
        self, db: Session, advertencia_id: int
    ) -> dict:
        adv = db.query(RendimientoTecnicoAdvertencia).filter(
            RendimientoTecnicoAdvertencia.id == advertencia_id
        ).first()

        if not adv:
            return {"encontrado": False, "mensaje": f"Advertencia {advertencia_id} no encontrada"}

        codigo_sap = adv.codigo_sap
        db.delete(adv)

        # Recontar advertencias activas y ajustar fase si es necesario
        actual = db.query(RendimientoTecnicoActual).filter(
            RendimientoTecnicoActual.codigo_sap == codigo_sap
        ).first()

        fase_anterior = None
        fase_nueva = None

        if actual:
            fase_anterior = actual.fase_actual
            advs_activas = db.query(func.count(RendimientoTecnicoAdvertencia.id)).filter(
                and_(
                    RendimientoTecnicoAdvertencia.codigo_sap == codigo_sap,
                    RendimientoTecnicoAdvertencia.estado == 'ACTIVA',
                    RendimientoTecnicoAdvertencia.fase_al_momento == 2,
                )
            ).scalar() or 0

            actual.advertencias_fase2 = advs_activas

            if actual.fase_actual == 3 and advs_activas < 3:
                actual.fase_actual = 2
                fase_nueva = 2

                historial = RendimientoTecnicoHistorial(
                    codigo_sap=codigo_sap,
                    tipo_cambio='FASE',
                    fase_anterior=3,
                    fase_nueva=2,
                    motivo='Retorno a Fase 2 por eliminación de advertencia',
                    regla_disparadora='RETORNO_FASE_2_POR_ELIMINACION',
                    usuario_id=None,
                )
                db.add(historial)

        db.commit()

        return {
            "encontrado": True,
            "codigo_sap": codigo_sap,
            "fase_anterior": fase_anterior,
            "fase_nueva": fase_nueva,
        }
