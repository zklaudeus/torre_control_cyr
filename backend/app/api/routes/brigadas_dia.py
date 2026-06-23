from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from app.core.database import get_db
from app.schemas.brigada_diaria import BrigadaDiaria, BrigadaDiariaCreate, BrigadaDiariaUpdate, ResumenBrigadasZona
from app.services.brigada_diaria_service import BrigadaDiariaService
from app.core.security import get_current_user, puede_operar_zona
from app.schemas.auth import CurrentUser

router = APIRouter()
servicio = BrigadaDiariaService()

@router.get("/", response_model=List[BrigadaDiaria])
def get_brigadas(fecha: date, db: Session = Depends(get_db)):
    """Obtiene las brigadas de una fecha"""
    return servicio.get_by_fecha(db, fecha)

@router.get("/resumen", response_model=List[ResumenBrigadasZona])
def get_resumen(fecha: date, db: Session = Depends(get_db)):
    """Obtiene un resumen básico de las brigadas por zona para una fecha"""
    return servicio.get_resumen_by_fecha(db, fecha)

@router.post("/", response_model=BrigadaDiaria)
def create_brigada(item: BrigadaDiariaCreate, db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    """Crea una nueva brigada para una fecha"""
    if not puede_operar_zona(current_user, item.zona, db):
        raise HTTPException(status_code=403, detail="No tiene permisos para operar en esta zona")
    return servicio.create(db, item)

@router.put("/{id}", response_model=BrigadaDiaria)
def update_brigada(id: int, item: BrigadaDiariaUpdate, db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    """Actualiza una brigada existente"""
    db_item = servicio.repo.get_by_id(db, id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Brigada no encontrada")
        
    if not puede_operar_zona(current_user, db_item.zona, db):
        raise HTTPException(status_code=403, detail="No tiene permisos para operar la zona original de esta brigada")
        
    if item.zona and not puede_operar_zona(current_user, item.zona, db):
        raise HTTPException(status_code=403, detail="No tiene permisos para mover la brigada a esta nueva zona")

    result = servicio.update(db, id, item)
    return result

@router.delete("/{id}")
def delete_brigada(id: int, db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    """Elimina una brigada"""
    db_item = servicio.repo.get_by_id(db, id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Brigada no encontrada")
        
    if not puede_operar_zona(current_user, db_item.zona, db):
        raise HTTPException(status_code=403, detail="No tiene permisos para operar la zona de esta brigada")
        
    success = servicio.delete(db, id)
    return {"message": "Brigada eliminada correctamente"}
