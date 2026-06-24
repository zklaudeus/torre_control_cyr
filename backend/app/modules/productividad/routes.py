"""
Endpoints del módulo de productividad.

KPIs documentados:
  cumplimiento_pct = (cortes_productivos / meta_aplicada) * 100
    → cortes_productivos = corte_en_poste + corte_en_empalme + corte_fuera_de_rango

  estado_diario:
    CRITICO        = cumplimiento < 50%
    RECUPERACION   = cumplimiento entre 50% y 79%
    ESTABLE        = cumplimiento entre 80% y 99%
    ALTO_DESEMPENO = cumplimiento >= 100%

  fase_actual:
    1 = Normal (sin advertencias)
    2 = Advertencia (bajo rendimiento sostenido)
    3 = Medición (evaluación formal)

  tendencia (ranking):
    MEJORANDO  = diferencia > +5pp entre Q1 y Q2 de ventana 30d
    EMPEORANDO = diferencia < -5pp
    ESTABLE    = diferencia entre -5pp y +5pp
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
)
from app.modules.productividad.policies import (
    require_acceso_productividad,
    require_gestion_alertas,
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
