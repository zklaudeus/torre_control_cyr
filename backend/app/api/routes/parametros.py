from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.parametro_zona import ParametroZona
from app.repositories.parametro_zona_repository import ParametroZonaRepository

router = APIRouter()
repo = ParametroZonaRepository()

@router.get("/zonas", response_model=List[ParametroZona])
def get_zonas_activas(db: Session = Depends(get_db)):
    """
    Obtiene el listado de zonas activas.
    """
    return repo.get_zonas_activas(db)
