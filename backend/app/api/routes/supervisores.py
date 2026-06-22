from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.cyr_models import ControlSupervisores, ControlSupervisorComunasZonas, ControlSupervisorUsuariosSAP
from app.schemas.supervisor import Supervisor, SupervisorComunaZona, SupervisorUsuarioSAP
from app.schemas.supervisor_bitacora import BitacoraResumenPreviewReq, BitacoraResumenPreviewRes
from app.services.supervisor_bitacora_service import calcular_resumen_preview
from app.core.security import get_current_user, require_roles, require_supervisor_user
from app.schemas.auth import CurrentUser

router = APIRouter()

@router.get("/", response_model=List[Supervisor])
def get_supervisores(db: Session = Depends(get_db), current_user: CurrentUser = Depends(require_roles(['admin', 'superadmin', 'torre_control']))):
    """Obtiene los supervisores activos, sin duplicados por nombre"""
    todos = db.query(ControlSupervisores).filter(
        ControlSupervisores.activo == True
    ).order_by(ControlSupervisores.nombre, ControlSupervisores.id).all()
    # Deduplicar por nombre, conservando el primer registro (menor id)
    vistos: set[str] = set()
    unicos = []
    for s in todos:
        if s.nombre not in vistos:
            vistos.add(s.nombre)
            unicos.append(s)
    return unicos

@router.get("/me/comunas-zonas", response_model=List[SupervisorComunaZona])
def get_me_comunas_zonas(current_user: CurrentUser = Depends(require_supervisor_user), db: Session = Depends(get_db)):
    """Obtiene las comunas asignadas y sus zonas principales para el supervisor autenticado"""
        
    return db.query(ControlSupervisorComunasZonas).filter(
        ControlSupervisorComunasZonas.supervisor_id == current_user.supervisor_id,
        ControlSupervisorComunasZonas.activo == True
    ).order_by(ControlSupervisorComunasZonas.comuna).all()

@router.get("/me/usuarios-sap", response_model=List[SupervisorUsuarioSAP])
def get_me_usuarios_sap(current_user: CurrentUser = Depends(require_supervisor_user), db: Session = Depends(get_db)):
    """Obtiene los usuarios SAP asignados al supervisor autenticado"""
        
    usuarios = db.query(
        ControlSupervisorUsuariosSAP,
        ControlSupervisorComunasZonas.zona_principal
    ).outerjoin(
        ControlSupervisorComunasZonas,
        (ControlSupervisorUsuariosSAP.comuna_habitual == ControlSupervisorComunasZonas.comuna) &
        (ControlSupervisorComunasZonas.supervisor_id == current_user.supervisor_id) &
        (ControlSupervisorComunasZonas.activo == True)
    ).filter(
        ControlSupervisorUsuariosSAP.supervisor_id == current_user.supervisor_id,
        ControlSupervisorUsuariosSAP.activo == True
    ).order_by(ControlSupervisorUsuariosSAP.cuenta).all()
    
    result = []
    for u, zona in usuarios:
        u_dict = u.__dict__.copy()
        u_dict['zona_principal'] = zona
        result.append(u_dict)
        
    return result

@router.post("/me/bitacora/resumen-preview", response_model=BitacoraResumenPreviewRes)
def post_me_resumen_preview(req: BitacoraResumenPreviewReq, current_user: CurrentUser = Depends(require_supervisor_user), db: Session = Depends(get_db)):
    """Calcula y devuelve un preview del resumen de la bitacora del supervisor autenticado"""
        
    try:
        res = calcular_resumen_preview(db, current_user.supervisor_id, req)
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{id}/comunas-zonas", response_model=List[SupervisorComunaZona])
def get_comunas_zonas(id: int, db: Session = Depends(get_db), current_user: CurrentUser = Depends(require_roles(['admin', 'superadmin', 'torre_control']))):
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
def get_usuarios_sap(id: int, db: Session = Depends(get_db), current_user: CurrentUser = Depends(require_roles(['admin', 'superadmin', 'torre_control']))):
    """Obtiene los usuarios SAP asignados a un supervisor, con su zona principal"""
    sup = db.query(ControlSupervisores).filter(ControlSupervisores.id == id).first()
    if not sup:
        raise HTTPException(status_code=404, detail="Supervisor no encontrado")
        
    usuarios = db.query(
        ControlSupervisorUsuariosSAP,
        ControlSupervisorComunasZonas.zona_principal
    ).outerjoin(
        ControlSupervisorComunasZonas,
        (ControlSupervisorUsuariosSAP.comuna_habitual == ControlSupervisorComunasZonas.comuna) &
        (ControlSupervisorComunasZonas.supervisor_id == id) &
        (ControlSupervisorComunasZonas.activo == True)
    ).filter(
        ControlSupervisorUsuariosSAP.supervisor_id == id,
        ControlSupervisorUsuariosSAP.activo == True
    ).order_by(ControlSupervisorUsuariosSAP.cuenta).all()
    
    result = []
    for u, zona in usuarios:
        u_dict = u.__dict__.copy()
        u_dict['zona_principal'] = zona
        result.append(u_dict)
        
    return result
@router.get("/usuarios-sap/todos", response_model=List[SupervisorUsuarioSAP])
def get_todos_usuarios_sap(db: Session = Depends(get_db), current_user: CurrentUser = Depends(require_roles(['admin', 'superadmin', 'torre_control']))):
    """Obtiene todos los usuarios SAP activos"""
    return db.query(ControlSupervisorUsuariosSAP).filter(
        ControlSupervisorUsuariosSAP.activo == True
    ).order_by(ControlSupervisorUsuariosSAP.cuenta).all()

@router.post("/{id}/bitacora/resumen-preview", response_model=BitacoraResumenPreviewRes)
def post_resumen_preview(id: int, req: BitacoraResumenPreviewReq, db: Session = Depends(get_db), current_user: CurrentUser = Depends(require_roles(['admin', 'superadmin', 'torre_control']))):
    """Calcula y devuelve un preview del resumen de la bitacora de un supervisor por zonas"""
    try:
        res = calcular_resumen_preview(db, id, req)
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
