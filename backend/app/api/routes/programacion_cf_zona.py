from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date

from app.core.database import get_db
from app.schemas.programacion_cf_zona import ProgramacionCFZonaResponse, ProgramacionCFZonaBulkCreate
from app.services.cf_service import CFService

router = APIRouter()
servicio = CFService()

@router.get("/", response_model=ProgramacionCFZonaResponse)
def get_programacion(fecha: date, db: Session = Depends(get_db)):
    return servicio.get_programacion_por_fecha(db, fecha)

@router.post("/bulk", response_model=ProgramacionCFZonaResponse)
def bulk_create_or_update(bulk_data: ProgramacionCFZonaBulkCreate, db: Session = Depends(get_db)):
    return servicio.bulk_create_or_update_programacion(db, bulk_data)
