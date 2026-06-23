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

from app.core.security import get_current_user
from app.schemas.auth import CurrentUser
from fastapi import HTTPException

@router.post("/bulk", response_model=ProgramacionCFZonaResponse)
def bulk_create_or_update(
    bulk_data: ProgramacionCFZonaBulkCreate, 
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    if current_user.rol == 'gerencia':
        raise HTTPException(status_code=403, detail="No tiene permisos para modificar la programación")
    return servicio.bulk_create_or_update_programacion(db, bulk_data)
