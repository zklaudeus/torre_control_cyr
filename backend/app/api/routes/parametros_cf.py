from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.parametros_cf import ParametrosCFResponse
from app.services.cf_service import CFService

router = APIRouter()
servicio = CFService()

@router.get("/", response_model=ParametrosCFResponse)
def get_parametros(db: Session = Depends(get_db)):
    """Obtiene los parámetros generales y por zona de CF."""
    return servicio.get_parametros(db)
