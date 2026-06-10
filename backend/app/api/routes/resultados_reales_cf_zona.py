from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date

from app.core.database import get_db
from app.schemas.resultados_reales_cf import ResultadosRealesCFZonaResponse
from app.services.cf_service import CFService

router = APIRouter()
servicio = CFService()

@router.get("/", response_model=ResultadosRealesCFZonaResponse)
def get_resultados_cf(fecha: date, db: Session = Depends(get_db)):
    """
    Calcula y devuelve los resultados reales por zona para CF,
    aggregando desde control_brigadas_diario filtrando tipo_brigada = 'CF'.
    """
    return servicio.calcular_resultados_reales_cf(db, fecha)
