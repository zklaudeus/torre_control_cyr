from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date
from typing import List

from app.core.database import get_db
from app.schemas.resultado_real_zona import ResultadosRealesZonaResponse
from app.services.resultado_real_zona_service import ResultadoRealZonaService

router = APIRouter()
servicio = ResultadoRealZonaService()


@router.get("/", response_model=ResultadosRealesZonaResponse)
def get_resultados(fecha: date, db: Session = Depends(get_db)):
    """
    Calcula y devuelve los resultados reales por zona para una fecha,
    aggregando desde control_brigadas_diario.
    No guarda nada — es solo lectura calculada.
    """
    return servicio.calcular_por_fecha(db, fecha)
