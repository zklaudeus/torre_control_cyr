from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date

from app.core.database import get_db
from app.schemas.resumen_zona import ResumenZonaResponse
from app.services.resumen_zona_service import ResumenZonaService

router = APIRouter()
servicio = ResumenZonaService()


@router.get("/", response_model=ResumenZonaResponse)
def get_resumen_zona(fecha: date, db: Session = Depends(get_db)):
    """
    Calcula y devuelve el resumen por zona para una fecha operacional.
    No guarda nada — es calculado en tiempo real.
    """
    return servicio.calcular_resumen(db, fecha)
