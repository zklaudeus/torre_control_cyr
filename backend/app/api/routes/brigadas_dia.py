from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from app.core.database import get_db
from app.schemas.brigada_diaria import BrigadaDiaria, BrigadaDiariaCreate, BrigadaDiariaUpdate, ResumenBrigadasZona
from app.services.brigada_diaria_service import BrigadaDiariaService

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
def create_brigada(item: BrigadaDiariaCreate, db: Session = Depends(get_db)):
    """Crea una nueva brigada para una fecha"""
    return servicio.create(db, item)

@router.put("/{id}", response_model=BrigadaDiaria)
def update_brigada(id: int, item: BrigadaDiariaUpdate, db: Session = Depends(get_db)):
    """Actualiza una brigada existente"""
    result = servicio.update(db, id, item)
    if not result:
        raise HTTPException(status_code=404, detail="Brigada no encontrada")
    return result

@router.delete("/{id}")
def delete_brigada(id: int, db: Session = Depends(get_db)):
    """Elimina una brigada"""
    success = servicio.delete(db, id)
    if not success:
        raise HTTPException(status_code=404, detail="Brigada no encontrada")
    return {"message": "Brigada eliminada correctamente"}
