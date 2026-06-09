from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from app.core.database import get_db
from app.schemas.programacion_zona import ProgramacionZona, ProgramacionZonaBulkCreate, ProgramacionZonaBase
from app.services.programacion_zona_service import ProgramacionZonaService

router = APIRouter()
servicio = ProgramacionZonaService()

@router.get("/", response_model=List[ProgramacionZona])
def get_programacion(fecha: date, db: Session = Depends(get_db)):
    """
    Obtiene la programación para una fecha dada.
    Si no existe, retorna las zonas activas con valores en cero.
    """
    return servicio.get_programacion_por_fecha(db, fecha)

@router.post("/bulk", response_model=List[ProgramacionZona])
def bulk_create_or_update(bulk_data: ProgramacionZonaBulkCreate, db: Session = Depends(get_db)):
    """
    Guarda o actualiza múltiples zonas para una fecha.
    """
    return servicio.bulk_create_or_update(db, bulk_data)

@router.put("/{id}", response_model=ProgramacionZona)
def update_programacion(id: int, item: ProgramacionZonaBase, db: Session = Depends(get_db)):
    """
    Actualizar individual (opcional)
    """
    # En esta beta, la actualización bulk cubre todo el flujo,
    # pero el endpoint queda expuesto si el cliente lo prefiere.
    from app.repositories.programacion_zona_repository import ProgramacionZonaRepository
    repo = ProgramacionZonaRepository()
    from fastapi import HTTPException
    from app.models.cyr_models import ControlProgramacionZona
    
    existing = db.query(ControlProgramacionZona).filter(ControlProgramacionZona.id == id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
        
    db_item = repo.create_or_update(db, existing.fecha_operacional, item)
    return ProgramacionZona.model_validate(db_item)
