"""
Endpoints del módulo de productividad.

KPIs documentados:
  cumplimiento_pct = (cortes_productivos / meta_aplicada) * 100
    → cortes_productivos = corte_en_poste + corte_en_empalme + corte_fuera_de_rango

  fase_actual:
    1 = Normal (sin advertencias)
    2 = Advertencia (bajo rendimiento sostenido)
    3 = Medición (evaluación formal)

  tendencia (ranking):
    MEJORANDO  = diferencia > +5pp entre Q1 y Q2 de ventana 30d
    EMPEORANDO = diferencia < -5pp
    ESTABLE    = diferencia entre -5pp y +5pp

  estado_productivo_actual (basado en cortes_productivos del último día evaluable):
    Si no hay día evaluable → no cambia.
    PXQ: 0-12=CRITICO, 13-24=RECUPERACION, >=25=ESTABLE,
         >=25 por 3 días evaluables consecutivos=ALTO_DESEMPENO.
    CF:   0-2=CRITICO, 3-5=RECUPERACION, >=6=ESTABLE,
         >=6 por 3 días evaluables consecutivos=ALTO_DESEMPENO.
"""
from datetime import date
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.productividad.service import ProductividadService
from app.modules.productividad.schemas import (
    TecnicoResumen,
    RendimientoDiarioItem,
    ResumenDiarioZona,
    ResumenDiarioSupervisor,
    RankingItem,
    HistorialItem,
    AlertaItem,
    ProductividadFilterParams,
    SeguimientoTecnicoResponse,
    AdvertenciaRequest,
    AdvertenciaResponse,
    CambioFaseRequest,
    CambioFaseResponse,
    AnularAdvertenciaRequest,
    AnularAdvertenciaResponse,
    ZonaResumenPanel,
    ResumenKpiTecnico,
    SemaforoManualResponse,
    SemaforoManualUpdate,
)
from app.modules.productividad.policies import (
    require_acceso_productividad,
    require_gestion_alertas,
    require_gestion_recomendaciones,
)

router = APIRouter()
servicio = ProductividadService()


@router.get("/tecnicos", response_model=List[TecnicoResumen])
def listar_tecnicos(
    activo: Optional[bool] = Query(None, description="Filtrar por activo/inactivo"),
    db: Session = Depends(get_db),
    current_user = Depends(require_acceso_productividad),
):
    """Lista técnicos (SAP) con estado productivo actual, filtrados por zonas del usuario."""
    return servicio.listar_tecnicos(db, current_user=current_user, activo=activo)


@router.get("/rendimiento", response_model=List[RendimientoDiarioItem])
def obtener_rendimiento_diario(
    fecha_desde: Optional[date] = Query(None),
    fecha_hasta: Optional[date] = Query(None),
    codigo_sap: Optional[str] = Query(None),
    zona: Optional[str] = Query(None),
    supervisor_id: Optional[int] = Query(None),
    estado_diario: Optional[str] = Query(None, description="CRITICO|RECUPERACION|ESTABLE|ALTO_DESEMPENO"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _=Depends(require_acceso_productividad),
):
    """Rendimiento diario de técnicos con filtros."""
    filtros = ProductividadFilterParams(
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        codigo_sap=codigo_sap,
        zona=zona,
        supervisor_id=supervisor_id,
        estado_diario=estado_diario,
        limit=limit,
        offset=offset,
    )
    return servicio.obtener_rendimiento_diario(db, filtros)


@router.get("/tecnicos/{codigo_sap}/resumen", response_model=ResumenKpiTecnico)
def obtener_resumen_kpis_tecnico(
    codigo_sap: str,
    fecha_hasta: date = Query(..., description="Fecha operacional de corte"),
    db: Session = Depends(get_db),
    _=Depends(require_acceso_productividad),
):
    """KPIs diarios y acumulados mensuales del técnico."""
    return servicio.obtener_resumen_kpis(db, codigo_sap, fecha_hasta)


@router.get("/resumen/zona", response_model=List[ResumenDiarioZona])
def resumen_por_zona(
    fecha: date = Query(..., description="Fecha operacional"),
    zona: Optional[str] = Query(None),
    supervisor_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(require_acceso_productividad),
):
    """Resumen agregado por zona para una fecha."""
    return servicio.resumen_por_zona(db, fecha, zona=zona, supervisor_id=supervisor_id)


@router.get("/zonas/resumen", response_model=List[ZonaResumenPanel])
def panel_zonas(
    db: Session = Depends(get_db),
    current_user = Depends(require_acceso_productividad),
):
    """Panel de resumen por zonas: contadores de estado, fase y advertencias."""
    return servicio.resumen_panel_zonas(db, current_user)


@router.get("/resumen/supervisor", response_model=List[ResumenDiarioSupervisor])
def resumen_por_supervisor(
    fecha: date = Query(..., description="Fecha operacional"),
    supervisor_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(require_acceso_productividad),
):
    """Resumen agregado por supervisor para una fecha."""
    return servicio.resumen_por_supervisor(db, fecha, supervisor_id=supervisor_id)


@router.get("/ranking", response_model=List[RankingItem])
def ranking(
    fecha_hasta: Optional[date] = Query(None, description="Fin ventana (default: hoy)"),
    zona: Optional[str] = Query(None),
    supervisor_id: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _=Depends(require_acceso_productividad),
):
    """Ranking de técnicos por cumplimiento promedio en ventana de 30 días."""
    return servicio.ranking(db, fecha_hasta=fecha_hasta, zona=zona, supervisor_id=supervisor_id, limit=limit)


@router.get("/historial", response_model=List[HistorialItem])
def historial(
    codigo_sap: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _=Depends(require_acceso_productividad),
):
    """Historial de cambios de fase y estado de los técnicos."""
    return servicio.historial(db, codigo_sap=codigo_sap, limit=limit, offset=offset)


@router.get("/alertas", response_model=List[AlertaItem])
def alertas(
    estado: Optional[str] = Query(None, description="ACTIVA|ANULADA"),
    codigo_sap: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _=Depends(require_acceso_productividad),
):
    """Alertas/advertencias de rendimiento de técnicos."""
    return servicio.alertas(db, estado=estado, codigo_sap=codigo_sap, limit=limit, offset=offset)


@router.get("/tecnicos/{codigo_sap}/seguimiento", response_model=SeguimientoTecnicoResponse)
def obtener_seguimiento_tecnico(
    codigo_sap: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_acceso_productividad),
):
    """Seguimiento completo de un técnico: fase, estado, advertencias activas e historial reciente."""
    result = servicio.obtener_seguimiento(db, codigo_sap)
    if not result:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Técnico {codigo_sap} no encontrado")
    return result


@router.post("/tecnicos/{codigo_sap}/advertencias", response_model=AdvertenciaResponse)
def registrar_advertencia(
    codigo_sap: str,
    body: AdvertenciaRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_gestion_alertas),
):
    """Registrar advertencia para un técnico. Solo torre_control y admin.

    Si el técnico está en Fase 2 y alcanza 3 advertencias activas,
    se activa automáticamente la Fase 3.
    """
    return servicio.registrar_advertencia(
        db, codigo_sap, body.fecha_operacional, body.motivo, current_user
    )


@router.put("/tecnicos/{codigo_sap}/fase", response_model=CambioFaseResponse)
def cambiar_fase_tecnico(
    codigo_sap: str,
    body: CambioFaseRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_gestion_alertas),
):
    """Cambiar manualmente la fase de un técnico. Solo torre_control y admin."""
    return servicio.cambiar_fase_manual(
        db, codigo_sap, body.fase_nueva, body.motivo, current_user
    )


@router.put("/tecnicos/advertencias/{advertencia_id}/anular", response_model=AnularAdvertenciaResponse)
def anular_advertencia(
    advertencia_id: int,
    body: AnularAdvertenciaRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_gestion_alertas),
):
    """Anular una advertencia activa. Solo torre_control y admin.
    Si el técnico estaba en Fase 3 y quedan < 3 advertencias activas, vuelve a Fase 2.
    """
    return servicio.anular_advertencia(
        db, advertencia_id, body.motivo_anulacion, current_user
    )


@router.post("/tecnicos/{codigo_sap}/recalcular-estado")
def recalcular_estado_tecnico(
    codigo_sap: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_gestion_alertas),
):
    """Recalcula el estado productivo de un técnico según sus cortes_productivos y tipo_brigada."""
    return servicio.actualizar_estado_tecnico(db, codigo_sap)


@router.delete("/tecnicos/advertencias/{advertencia_id}")
def eliminar_advertencia(
    advertencia_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_gestion_alertas),
):
    """Elimina definitivamente una advertencia activa (útil para errores de ingreso). Solo torre_control y admin."""
    return servicio.eliminar_advertencia(db, advertencia_id)


@router.get("/tecnicos/{codigo_sap}/semaforos", response_model=List[SemaforoManualResponse])
def obtener_semaforos_tecnico(
    codigo_sap: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_acceso_productividad),
):
    """Obtiene los 6 semáforos operacionales de un técnico."""
    return servicio.obtener_semaforos_tecnico(db, codigo_sap)


@router.put("/tecnicos/{codigo_sap}/semaforos/{categoria}", response_model=SemaforoManualResponse)
def actualizar_semaforo_tecnico(
    codigo_sap: str,
    categoria: str,
    body: SemaforoManualUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_gestion_alertas),
):
    """Actualiza o crea un semáforo operacional manual (requiere permisos torre_control/admin)."""
    return servicio.upsert_semaforo_tecnico(
        db, codigo_sap, categoria, body.estado, body.descripcion, current_user
    )


# ─── Recomendaciones del Supervisor ──────────────────────────────────────────

from app.modules.productividad.schemas import (
    RecomendacionCreate,
    RecomendacionUpdate,
    RecomendacionResponse,
)


@router.get("/tecnicos/{codigo_sap}/recomendaciones", response_model=List[RecomendacionResponse])
def listar_recomendaciones(
    codigo_sap: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_acceso_productividad),
):
    """Lista todas las recomendaciones/comentarios de un técnico, ordenadas por más reciente."""
    return servicio.listar_recomendaciones(db, codigo_sap)


@router.post("/tecnicos/{codigo_sap}/recomendaciones", response_model=RecomendacionResponse, status_code=201)
def crear_recomendacion(
    codigo_sap: str,
    body: RecomendacionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_gestion_recomendaciones),
):
    """Crea una nueva recomendación/comentario para un técnico (supervisor, torre_control, admin)."""
    return servicio.crear_recomendacion(db, codigo_sap, body, current_user)


@router.put("/tecnicos/recomendaciones/{recomendacion_id}", response_model=RecomendacionResponse)
def actualizar_recomendacion(
    recomendacion_id: int,
    body: RecomendacionUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_gestion_recomendaciones),
):
    """Edita el comentario, prioridad o estado de una recomendación existente."""
    return servicio.actualizar_recomendacion(db, recomendacion_id, body, current_user)


@router.delete("/tecnicos/recomendaciones/{recomendacion_id}")
def eliminar_recomendacion(
    recomendacion_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_gestion_recomendaciones),
):
    """Elimina definitivamente una recomendación (solo el autor o admin/torre_control)."""
    return servicio.eliminar_recomendacion(db, recomendacion_id, current_user)
