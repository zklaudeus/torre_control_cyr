"""
Servicio del módulo de productividad.
Lógica de KPIs, transformación y orquestación.
"""
from datetime import date, timedelta
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.core.security import get_zonas_permitidas_supervisor
from app.models.cyr_models import (
    ControlUsuarios,
    ControlBrigadasDiario,
    RendimientoTecnicoDiario,
    RendimientoTecnicoActual,
    RendimientoTecnicoAdvertencia,
    RendimientoTecnicoCausaFallida,
    ControlSupervisores,
)
from app.core.brigadas import (
    condicion_rendimiento_con_brigada_contabilizable,
    es_brigada_contabilizable,
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
    KpiDiaTecnicoItem,
    ResumenKpiTecnico,
)


class ProductividadService:

    def __init__(self):
        self.repo = ProductividadRepository()

    # ─── Panel de zonas ────────────────────────────────────────────

    def resumen_panel_zonas(
        self, db: Session, current_user: ControlUsuarios,
    ) -> list:
        from app.modules.productividad.schemas import ZonaResumenPanel
        zonas = self._resolver_zonas_usuario(db, current_user)
        rows = self.repo.resumen_panel_zonas(db, zonas_permitidas=zonas)
        return [ZonaResumenPanel(**r) for r in rows]

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

        # Compatibilidad histórica: antes de la sincronización automática,
        # Resumen general ya tenía brigadas que nunca generaron un snapshot.
        if (
            not rows
            and filtros.codigo_sap
            and filtros.fecha_desde
            and filtros.fecha_desde == filtros.fecha_hasta
        ):
            brigada = self.repo.obtener_brigada_fuente(
                db, filtros.codigo_sap, filtros.fecha_desde
            )
            if brigada:
                causas = self.repo.obtener_causas_fallidas(
                    db, filtros.codigo_sap, filtros.fecha_desde
                )
                return [self._to_rendimiento_desde_brigada(brigada, causas)]

        def key(r: RendimientoTecnicoDiario) -> tuple:
            return (r.codigo_sap, r.fecha_operacional)

        causa_map: dict[tuple, list[dict]] = {}
        if rows:
            fechas = list({r.fecha_operacional for r in rows})
            codigos = list({r.codigo_sap for r in rows})
            causas = (
                db.query(RendimientoTecnicoCausaFallida)
                .filter(
                    RendimientoTecnicoCausaFallida.codigo_sap.in_(codigos),
                    RendimientoTecnicoCausaFallida.fecha_operacional.in_(fechas),
                )
                .order_by(
                    RendimientoTecnicoCausaFallida.cantidad.desc(),
                    RendimientoTecnicoCausaFallida.causa_fallida,
                )
                .all()
            )
            for c in causas:
                k = (c.codigo_sap, c.fecha_operacional)
                if k not in causa_map:
                    causa_map[k] = []
                causa_map[k].append({"causa_fallida": c.causa_fallida, "cantidad": c.cantidad, "observacion": c.observacion})

        return [self._to_rendimiento_item(r, causa_map.get(key(r), [])) for r in rows]

    def _to_rendimiento_item(self, r: RendimientoTecnicoDiario, causas: list[dict] | None = None) -> RendimientoDiarioItem:
        from app.modules.productividad.schemas import CausaFallidaItem
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
            causas_fallidas=[CausaFallidaItem(**c) for c in (causas or [])],
        )

    def _to_rendimiento_desde_brigada(self, brigada, causas) -> RendimientoDiarioItem:
        from app.modules.productividad.schemas import CausaFallidaItem
        from app.modules.productividad.sync import calcular_metricas_brigada

        metricas = calcular_metricas_brigada(brigada)
        return RendimientoDiarioItem(
            fecha_operacional=brigada.fecha_operacional,
            codigo_sap=brigada.codigo_sap,
            usuario=brigada.usuario or brigada.codigo_sap,
            zona=brigada.zona,
            tipo_brigada=brigada.tipo_brigada,
            corte_en_poste=metricas["corte_en_poste"],
            corte_en_empalme=metricas["corte_en_empalme"],
            corte_fuera_de_rango=metricas["corte_fuera_de_rango"],
            visita_fallida=metricas["visita_fallida"],
            reconexiones=metricas["reconexiones"],
            cortes_productivos=metricas["cortes_productivos"],
            meta_aplicada=metricas["meta_aplicada"],
            cumplimiento_pct=metricas["cumplimiento_pct"],
            es_evaluable=False,
            estado_diario=None,
            motivo_no_evaluable="FUENTE_RESUMEN_GENERAL",
            causas_fallidas=[
                CausaFallidaItem(
                    causa_fallida=c.causa_fallida,
                    cantidad=c.cantidad,
                    observacion=c.observacion,
                )
                for c in causas
            ],
        )

    def obtener_resumen_kpis(
        self, db: Session, codigo_sap: str, fecha_hasta: date
    ) -> ResumenKpiTecnico:
        """Calcula KPIs reales del mes operacional hasta la fecha seleccionada."""
        from decimal import Decimal, ROUND_HALF_UP
        from app.modules.productividad.sync import calcular_metricas_brigada

        fecha_desde = fecha_hasta.replace(day=1)
        fecha_consulta_desde = min(fecha_desde, fecha_hasta - timedelta(days=13))
        brigadas = self.repo.obtener_brigadas_periodo(
            db, codigo_sap, fecha_consulta_desde, fecha_hasta
        )

        # La fila más reciente prevalece ante duplicados históricos SAP/fecha.
        por_fecha = {b.fecha_operacional: b for b in brigadas}
        filas = [por_fecha[f] for f in sorted(por_fecha)]
        # Brigadas inactivas son invisibles para indicadores:
        # el registro queda en la bitácora pero no aporta a KPIs ni al período.
        filas_operativas = [
            b for b in filas
            if es_brigada_contabilizable(b)
        ]
        periodo = [
            b for b in filas_operativas
            if b.fecha_operacional >= fecha_desde and b.fecha_operacional.weekday() < 5
        ]
        metricas_periodo = [
            (b, calcular_metricas_brigada(b)) for b in periodo
        ]

        filas_operativas_por_fecha = {
            b.fecha_operacional: b for b in filas_operativas
        }
        fila_dia = filas_operativas_por_fecha.get(fecha_hasta)
        metrica_dia = calcular_metricas_brigada(fila_dia) if fila_dia else None
        total_cortes = sum(m["cortes_productivos"] for _, m in metricas_periodo)
        total_meta = sum(m["meta_aplicada"] for _, m in metricas_periodo)
        dias_con_datos = len(metricas_periodo)

        promedio = None
        cumplimiento_acumulado = None
        mejor = None
        if dias_con_datos:
            promedio = (Decimal(total_cortes) / Decimal(dias_con_datos)).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            cumplimiento_acumulado = (
                Decimal(total_cortes * 100) / Decimal(total_meta)
            ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            mejor = max(
                metricas_periodo,
                key=lambda item: (item[1]["cortes_productivos"], item[0].fecha_operacional),
            )

        fallidas_mes = sum(
            int(b.visita_fallida or 0)
            for b in filas_operativas
            if b.fecha_operacional >= fecha_desde
        )
        fallidas_7 = sum(
            int(b.visita_fallida or 0)
            for b in filas_operativas
            if b.fecha_operacional >= fecha_hasta - timedelta(days=6)
        )
        fallidas_14 = sum(
            int(b.visita_fallida or 0)
            for b in filas_operativas
            if b.fecha_operacional >= fecha_hasta - timedelta(days=13)
        )

        variacion_abs = None
        variacion_pct = None
        if metrica_dia is not None:
            anterior = self.repo.obtener_brigada_anterior(db, codigo_sap, fecha_hasta)
            if anterior:
                fallidas_anteriores = int(anterior.visita_fallida or 0)
                variacion_abs = metrica_dia["visita_fallida"] - fallidas_anteriores
                if fallidas_anteriores > 0:
                    variacion_pct = (
                        Decimal(variacion_abs * 100) / Decimal(fallidas_anteriores)
                    ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        dias = [
            KpiDiaTecnicoItem(
                fecha_operacional=b.fecha_operacional,
                cortes_productivos=m["cortes_productivos"],
                meta_aplicada=m["meta_aplicada"],
                cumplimiento_pct=m["cumplimiento_pct"],
                visita_fallida=m["visita_fallida"],
            )
            for b, m in metricas_periodo
        ]

        return ResumenKpiTecnico(
            codigo_sap=codigo_sap,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            dias_con_datos=dias_con_datos,
            productividad_diaria=metrica_dia["cortes_productivos"] if metrica_dia else None,
            meta_diaria=metrica_dia["meta_aplicada"] if metrica_dia else None,
            cumplimiento_diario_pct=metrica_dia["cumplimiento_pct"] if metrica_dia else None,
            productividad_promedio=promedio,
            mejor_productividad=mejor[1]["cortes_productivos"] if mejor else None,
            fecha_mejor_productividad=mejor[0].fecha_operacional if mejor else None,
            cumplimiento_acumulado_pct=cumplimiento_acumulado,
            total_cortes_acumulados=total_cortes,
            total_meta_acumulada=total_meta,
            corte_en_poste_acumulado=sum(m["corte_en_poste"] for _, m in metricas_periodo),
            corte_en_empalme_acumulado=sum(m["corte_en_empalme"] for _, m in metricas_periodo),
            corte_fuera_de_rango_acumulado=sum(m["corte_fuera_de_rango"] for _, m in metricas_periodo),
            dias_bajo_meta=sum(
                1 for _, m in metricas_periodo
                if m["cortes_productivos"] < m["meta_aplicada"]
            ),
            dias_criticos=sum(
                1 for _, m in metricas_periodo if m["cumplimiento_pct"] < 50
            ),
            fallidas_dia=metrica_dia["visita_fallida"] if metrica_dia else 0,
            fallidas_acumuladas=fallidas_mes,
            fallidas_ultimos_7_dias=fallidas_7,
            fallidas_ultimos_14_dias=fallidas_14,
            fallidas_variacion_abs=variacion_abs,
            fallidas_variacion_pct=variacion_pct,
            dias=dias,
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
            .filter(
                RendimientoTecnicoDiario.fecha_operacional == fecha,
                condicion_rendimiento_con_brigada_contabilizable(
                    RendimientoTecnicoDiario,
                    ControlBrigadasDiario,
                ),
            )
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

    # ─── Seguimiento Técnico ─────────────────────────────────────

    def obtener_seguimiento(
        self, db: Session, codigo_sap: str
    ) -> Optional[dict]:
        from app.modules.productividad.schemas import SeguimientoTecnicoResponse
        data = self.repo.obtener_seguimiento_tecnico(db, codigo_sap)
        if not data:
            return None
        # Convertir modelos ORM a schemas
        data["advertencias_activas"] = [
            AlertaItem.model_validate(a) for a in data["advertencias_activas"]
        ]
        data["historial_reciente"] = [
            HistorialItem.model_validate(h) for h in data["historial_reciente"]
        ]
        return SeguimientoTecnicoResponse(**data)

    def cambiar_fase_manual(
        self, db: Session, codigo_sap: str, fase_nueva: int, motivo: str, current_user
    ) -> dict:
        from app.modules.productividad.schemas import CambioFaseResponse

        result = self.repo.cambiar_fase_manual(
            db, codigo_sap, fase_nueva, motivo, current_user.id
        )

        if not result["cambiado"]:
            return CambioFaseResponse(
                success=False,
                mensaje=f"El técnico {codigo_sap} ya está en Fase {fase_nueva}.",
                codigo_sap=codigo_sap,
                fase_anterior=result["fase_anterior"],
                fase_nueva=result["fase_nueva"],
            )

        return CambioFaseResponse(
            success=True,
            mensaje=f"Fase cambiada de {result['fase_anterior']} a {result['fase_nueva']} para {codigo_sap}.",
            codigo_sap=codigo_sap,
            fase_anterior=result["fase_anterior"],
            fase_nueva=result["fase_nueva"],
        )

    def anular_advertencia(
        self, db: Session, advertencia_id: int, motivo_anulacion: str, current_user
    ) -> dict:
        from app.modules.productividad.schemas import AnularAdvertenciaResponse, AlertaItem

        result = self.repo.anular_advertencia(
            db, advertencia_id, motivo_anulacion, current_user.id
        )

        if not result["encontrado"]:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail=result["mensaje"])

        if result.get("ya_anulada"):
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail=result["mensaje"])

        adv_schema = AlertaItem.model_validate(result["advertencia"])

        # Contar advertencias activas restantes
        advs_restantes = db.query(func.count(RendimientoTecnicoAdvertencia.id)).filter(
            and_(
                RendimientoTecnicoAdvertencia.codigo_sap == result["codigo_sap"],
                RendimientoTecnicoAdvertencia.estado == 'ACTIVA',
            )
        ).scalar() or 0

        return AnularAdvertenciaResponse(
            success=True,
            mensaje="Advertencia anulada correctamente.",
            advertencia=adv_schema,
            fase_anterior=result["fase_anterior"],
            fase_nueva=result["fase_nueva"],
            advertencias_activas_restantes=advs_restantes,
        )

    def eliminar_advertencia(
        self, db: Session, advertencia_id: int
    ) -> dict:
        from app.modules.productividad.schemas import AdvertenciaResponse

        result = self.repo.eliminar_advertencia(db, advertencia_id)

        if not result["encontrado"]:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail=result["mensaje"])

        mensaje = "Advertencia eliminada permanentemente."
        if result["fase_nueva"]:
            mensaje += f" El técnico {result['codigo_sap']} volvió a Fase 2."

        return {
            "success": True,
            "mensaje": mensaje,
            "codigo_sap": result["codigo_sap"],
            "fase_anterior": result["fase_anterior"],
            "fase_nueva": result["fase_nueva"],
        }

    def actualizar_estado_tecnico(
        self, db: Session, codigo_sap: str
    ) -> dict:
        """Calcula y actualiza el estado productivo de un técnico según cortes_productivos."""
        return self.repo.actualizar_estado_tecnico(db, codigo_sap)

    def registrar_advertencia(
        self, db: Session, codigo_sap: str, fecha_operacional: date, motivo: str, current_user
    ) -> dict:
        from app.modules.productividad.schemas import AdvertenciaResponse, AlertaItem

        result = self.repo.registrar_advertencia(
            db, codigo_sap, fecha_operacional, motivo, current_user.id
        )

        advertencia_schema = AlertaItem.model_validate(result["advertencia"])

        mensaje = "Advertencia registrada correctamente."
        if result["paso_a_fase_3"]:
            mensaje = (
                f"El técnico {codigo_sap} pasó a Fase 3 por acumular "
                f"{result['advertencias_activas_count']} advertencias activas en Fase 2."
            )

        return AdvertenciaResponse(
            success=True,
            mensaje=mensaje,
            advertencia=advertencia_schema,
            fase_anterior=result["fase_anterior"],
            fase_nueva=result["fase_nueva"],
            advertencias_activas_count=result["advertencias_activas_count"],
        )

    def obtener_semaforos_tecnico(self, db: Session, codigo_sap: str) -> List[dict]:
        """Obtiene los 6 semáforos del técnico, inyectando los faltantes como SIN_EVALUACION."""
        categorias_fijas = [
            'SEGURIDAD', 'CALIDAD_CORTE', 'CUMPLIMIENTO_PROTOCOLOS',
            'COMUNICACION_CLIENTE', 'DISCIPLINA_OPERACIONAL', 'ATENCION_CLIENTE'
        ]
        db_semaforos = self.repo.obtener_semaforos_por_tecnico(db, codigo_sap)
        db_map = {s.categoria: s for s in db_semaforos}

        result = []
        for cat in categorias_fijas:
            if cat in db_map:
                s = db_map[cat]
                result.append({
                    "categoria": s.categoria,
                    "estado": s.estado,
                    "descripcion": s.descripcion,
                    "updated_at": s.updated_at,
                    "usuario_actualiza_id": s.usuario_actualiza_id,
                })
            else:
                result.append({
                    "categoria": cat,
                    "estado": "SIN_EVALUACION",
                    "descripcion": None,
                    "updated_at": None,
                    "usuario_actualiza_id": None,
                })
        return result

    def upsert_semaforo_tecnico(
        self, db: Session, codigo_sap: str, categoria: str, estado: str, descripcion: Optional[str], current_user
    ) -> dict:
        """Valida roles y actualiza el semáforo."""
        # Validar permisos
        if current_user.rol not in ["admin", "superadmin", "torre_control"]:
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="No tiene permisos para editar semáforos operacionales.")

        categorias_fijas = [
            'SEGURIDAD', 'CALIDAD_CORTE', 'CUMPLIMIENTO_PROTOCOLOS',
            'COMUNICACION_CLIENTE', 'DISCIPLINA_OPERACIONAL', 'ATENCION_CLIENTE'
        ]
        cat_upper = categoria.upper()
        if cat_upper not in categorias_fijas:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail=f"Categoría inválida. Debe ser una de: {', '.join(categorias_fijas)}")

        estados_validos = ['SIN_EVALUACION', 'CRITICO', 'ESTABLE', 'ALTO_DESEMPENO']
        est_upper = estado.upper()
        if est_upper not in estados_validos:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail=f"Estado inválido. Debe ser uno de: {', '.join(estados_validos)}")

        s = self.repo.upsert_semaforo_tecnico(db, codigo_sap, cat_upper, est_upper, descripcion, current_user.id)
        return {
            "categoria": s.categoria,
            "estado": s.estado,
            "descripcion": s.descripcion,
            "updated_at": s.updated_at,
            "usuario_actualiza_id": s.usuario_actualiza_id,
        }
