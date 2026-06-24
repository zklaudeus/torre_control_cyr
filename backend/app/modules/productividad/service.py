"""
Servicio del módulo de productividad.
Lógica de KPIs, transformación y orquestación.
"""
from datetime import date, timedelta
from typing import Optional, List
from sqlalchemy.orm import Session

from app.core.security import get_zonas_permitidas_supervisor
from app.models.cyr_models import (
    ControlUsuarios,
    RendimientoTecnicoDiario,
    RendimientoTecnicoActual,
    ControlSupervisores,
)
from app.models.domain_models import DimSap
from app.modules.productividad.repository import ProductividadRepository
from app.modules.productividad.schemas import (
    TecnicoResumen,
    RendimientoDiarioItem,
    ResumenDiarioZona,
    ResumenDiarioSupervisor,
    RankingItem,
    HistorialItem,
    AlertaItem,
    ProductividadFilterParams,
)


class ProductividadService:

    def __init__(self):
        self.repo = ProductividadRepository()

    # ─── Técnicos ─────────────────────────────────────────────────

    def _resolver_zonas_usuario(self, db: Session, current_user: ControlUsuarios) -> Optional[List[str]]:
        """Retorna lista de zonas permitidas, o None si no hay restricción."""
        if current_user.rol in ("admin", "superadmin", "torre_control", "gerencia"):
            return None
        if current_user.rol == "supervisor" and current_user.supervisor_id:
            zonas = get_zonas_permitidas_supervisor(db, current_user.supervisor_id)
            return list(zonas) if zonas else None
        return None

    def listar_tecnicos(
        self,
        db: Session,
        current_user: ControlUsuarios,
        activo: Optional[bool] = None,
    ) -> List[TecnicoResumen]:
        zonas = self._resolver_zonas_usuario(db, current_user)
        rows = self.repo.listar_tecnicos(db, activo=activo, zonas=zonas)

        codigos = [r["codigo_sap"] for r in rows]
        sup_map = self._mapear_supervisores(db, codigos)

        result = []
        for r in rows:
            r["supervisor_nombre"] = sup_map.get(r["codigo_sap"])
            result.append(TecnicoResumen(**r))
        return result

    def _mapear_supervisores(self, db: Session, codigos: List[str]) -> dict:
        if not codigos:
            return {}
        from sqlalchemy import text
        rows = db.execute(text("""
            SELECT DISTINCT csus.codigo_sap, cs.nombre
            FROM control_supervisor_usuarios_sap csus
            JOIN control_supervisores cs ON cs.id = csus.supervisor_id
            WHERE csus.codigo_sap = ANY(:codigos)
        """), {"codigos": codigos}).all()
        return {r[0]: r[1] for r in rows}

    # ─── Rendimiento diario ────────────────────────────────────────

    def obtener_rendimiento_diario(
        self, db: Session, filtros: ProductividadFilterParams
    ) -> List[RendimientoDiarioItem]:
        rows = self.repo.obtener_rendimiento_diario(
            db,
            fecha_desde=filtros.fecha_desde,
            fecha_hasta=filtros.fecha_hasta,
            codigo_sap=filtros.codigo_sap,
            zona=filtros.zona,
            supervisor_id=filtros.supervisor_id,
            estado_diario=filtros.estado_diario,
            limit=filtros.limit,
            offset=filtros.offset,
        )
        return [self._to_rendimiento_item(r) for r in rows]

    def _to_rendimiento_item(self, r: RendimientoTecnicoDiario) -> RendimientoDiarioItem:
        return RendimientoDiarioItem(
            fecha_operacional=r.fecha_operacional,
            codigo_sap=r.codigo_sap,
            usuario=r.usuario,
            zona=r.zona,
            tipo_brigada=r.tipo_brigada,
            corte_en_poste=r.corte_en_poste,
            corte_en_empalme=r.corte_en_empalme,
            corte_fuera_de_rango=r.corte_fuera_de_rango,
            visita_fallida=r.visita_fallida,
            reconexiones=r.reconexiones,
            cortes_productivos=r.cortes_productivos,
            meta_aplicada=r.meta_aplicada,
            cumplimiento_pct=r.cumplimiento_pct,
            es_evaluable=r.es_evaluable,
            estado_diario=r.estado_diario,
            motivo_no_evaluable=r.motivo_no_evaluable,
        )

    # ─── Resumen ───────────────────────────────────────────────────

    def resumen_por_zona(
        self,
        db: Session,
        fecha: date,
        zona: Optional[str] = None,
        supervisor_id: Optional[int] = None,
    ) -> List[ResumenDiarioZona]:
        rows = self.repo.resumen_por_zona(db, fecha, zona=zona, supervisor_id=supervisor_id)
        return [ResumenDiarioZona(**r) for r in rows]

    def resumen_por_supervisor(
        self,
        db: Session,
        fecha: date,
        supervisor_id: Optional[int] = None,
    ) -> List[ResumenDiarioSupervisor]:
        from sqlalchemy import func
        q = (
            db.query(
                RendimientoTecnicoDiario.supervisor_id,
                func.count(RendimientoTecnicoDiario.id).label("total_tecnicos"),
                func.sum(
                    func.cast(RendimientoTecnicoDiario.es_evaluable, func.Integer())
                ).label("tecnicos_evaluables"),
                func.avg(RendimientoTecnicoDiario.cumplimiento_pct).label("promedio_cumplimiento"),
            )
            .filter(RendimientoTecnicoDiario.fecha_operacional == fecha)
        )
        if supervisor_id:
            q = q.filter(RendimientoTecnicoDiario.supervisor_id == supervisor_id)
        q = q.group_by(RendimientoTecnicoDiario.supervisor_id)
        rows = q.all()

        sup_ids = [r.supervisor_id for r in rows if r.supervisor_id]
        supervisores = {}
        if sup_ids:
            for s in db.query(ControlSupervisores).filter(ControlSupervisores.id.in_(sup_ids)).all():
                supervisores[s.id] = s.nombre

        result = []
        for r in rows:
            if r.supervisor_id is None:
                continue
            estados = self.repo._contar_estados(
                db, fecha, supervisor_id=r.supervisor_id
            )
            result.append(ResumenDiarioSupervisor(
                supervisor_id=r.supervisor_id,
                supervisor_nombre=supervisores.get(r.supervisor_id, "Desconocido"),
                total_tecnicos=r.total_tecnicos,
                tecnicos_evaluables=r.tecnicos_evaluables or 0,
                promedio_cumplimiento=round(r.promedio_cumplimiento or 0, 2),
                **estados,
            ))
        return result

    # ─── Ranking ───────────────────────────────────────────────────

    def ranking(
        self,
        db: Session,
        fecha_hasta: Optional[date] = None,
        zona: Optional[str] = None,
        supervisor_id: Optional[int] = None,
        limit: int = 50,
    ) -> List[RankingItem]:
        rows = self.repo.ranking(
            db, fecha_hasta=fecha_hasta, zona=zona,
            supervisor_id=supervisor_id, limit=limit,
        )
        return [RankingItem(**r) for r in rows]

    # ─── Historial ─────────────────────────────────────────────────

    def historial(
        self,
        db: Session,
        codigo_sap: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[HistorialItem]:
        rows = self.repo.historial(
            db, codigo_sap=codigo_sap, limit=limit, offset=offset
        )
        return [HistorialItem.model_validate(r) for r in rows]

    # ─── Alertas ───────────────────────────────────────────────────

    def alertas(
        self,
        db: Session,
        estado: Optional[str] = None,
        codigo_sap: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[AlertaItem]:
        rows = self.repo.alertas(
            db, estado=estado, codigo_sap=codigo_sap, limit=limit, offset=offset
        )
        return [AlertaItem.model_validate(r) for r in rows]
