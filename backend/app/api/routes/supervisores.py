from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.cyr_models import ControlSupervisores, ControlSupervisorComunasZonas, ControlSupervisorUsuariosSAP
from app.schemas.supervisor import Supervisor, SupervisorComunaZona, SupervisorUsuarioSAP

router = APIRouter()

@router.get("/", response_model=List[Supervisor])
def get_supervisores(db: Session = Depends(get_db)):
    """Obtiene los supervisores activos"""
    return db.query(ControlSupervisores).filter(ControlSupervisores.activo == True).order_by(ControlSupervisores.nombre).all()

@router.get("/{id}/comunas-zonas", response_model=List[SupervisorComunaZona])
def get_comunas_zonas(id: int, db: Session = Depends(get_db)):
    """Obtiene las comunas asignadas y sus zonas principales para un supervisor"""
    # Verificar que el supervisor existe
    sup = db.query(ControlSupervisores).filter(ControlSupervisores.id == id).first()
    if not sup:
        raise HTTPException(status_code=404, detail="Supervisor no encontrado")
        
    return db.query(ControlSupervisorComunasZonas).filter(
        ControlSupervisorComunasZonas.supervisor_id == id,
        ControlSupervisorComunasZonas.activo == True
    ).order_by(ControlSupervisorComunasZonas.comuna).all()

@router.get("/{id}/usuarios-sap", response_model=List[SupervisorUsuarioSAP])
def get_usuarios_sap(id: int, db: Session = Depends(get_db)):
    """Obtiene los usuarios SAP asignados a un supervisor"""
    sup = db.query(ControlSupervisores).filter(ControlSupervisores.id == id).first()
    if not sup:
        raise HTTPException(status_code=404, detail="Supervisor no encontrado")
        
    return db.query(ControlSupervisorUsuariosSAP).filter(
        ControlSupervisorUsuariosSAP.supervisor_id == id,
        ControlSupervisorUsuariosSAP.activo == True
    ).order_by(ControlSupervisorUsuariosSAP.cuenta).all()

@router.get("/usuarios-sap/todos", response_model=List[SupervisorUsuarioSAP])
def get_todos_usuarios_sap(db: Session = Depends(get_db)):
    """Obtiene todos los usuarios SAP activos"""
    return db.query(ControlSupervisorUsuariosSAP).filter(
        ControlSupervisorUsuariosSAP.activo == True
    ).order_by(ControlSupervisorUsuariosSAP.cuenta).all()
