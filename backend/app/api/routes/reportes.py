from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from app.core.database import get_db
from app.schemas.reporte_cyr import ReporteCYR, ReporteCYRCreate
from app.schemas.reporte_gerencial_cyr import ReporteGerencialData
from app.services.reporte_cyr_service import ReporteCYRService
from app.services.reporte_gerencial_cyr_service import ReporteGerencialCYRService

router = APIRouter()
reporte_service = ReporteCYRService()
reporte_gerencial_service = ReporteGerencialCYRService()

@router.get("/gerencial/cyr", response_model=ReporteGerencialData)
def get_reporte_gerencial(
    fecha_operacional: date,
    filtro: str = "Todo",
    db: Session = Depends(get_db)
):
    """
    Obtiene los KPIs calculados para el reporte gerencial CYR.
    """
    return reporte_gerencial_service.calcular_reporte(db, fecha_operacional, filtro)

@router.post("/", response_model=ReporteCYR)
def create_or_get_reporte(reporte_in: ReporteCYRCreate, db: Session = Depends(get_db)):
    """
    Crea un nuevo reporte para la fecha dada, o devuelve el existente si ya fue creado.
    """
    return reporte_service.get_or_create_reporte(db, reporte_in.fecha_operacional)

@router.get("/", response_model=List[ReporteCYR])
def list_reportes(limit: int = 100, db: Session = Depends(get_db)):
    """
    Obtiene una lista de reportes recientes.
    """
    return reporte_service.get_all_reportes(db, limit)

@router.get("/{fecha_operacional}", response_model=ReporteCYR)
def get_reporte(fecha_operacional: date, db: Session = Depends(get_db)):
    """
    Obtiene un reporte existente por fecha. Retorna 404 si no existe.
    """
    reporte = reporte_service.get_reporte_by_fecha(db, fecha_operacional)
    if not reporte:
        raise HTTPException(status_code=404, detail="Reporte no encontrado para esta fecha")
    return reporte
