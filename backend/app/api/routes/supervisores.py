from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, List, Optional
from datetime import date
import unicodedata

from app.core.database import get_db
from app.models.cyr_models import (
    ControlSupervisores, ControlSupervisorComunasZonas, ControlSupervisorUsuariosSAP,
    ControlBrigadasDiario, BitacoraSupervisorDiaria
)
from app.schemas.supervisor import Supervisor, SupervisorComunaZona, SupervisorUsuarioSAP
from app.schemas.supervisor_bitacora import BitacoraResumenPreviewReq, BitacoraResumenPreviewRes
from app.services.supervisor_bitacora_service import calcular_resumen_preview
from app.core.security import get_current_user, require_roles, require_supervisor_user
from app.schemas.auth import CurrentUser

router = APIRouter()

def _normalizar_texto(valor: Optional[str]) -> str:
    """Normaliza texto para comparar sin distinguir mayusculas, espacios ni acentos."""
    texto = (valor or "").strip()
    texto = unicodedata.normalize("NFKD", texto)
    texto = "".join(char for char in texto if not unicodedata.combining(char))
    return texto.casefold()


def _puntaje_presentacion_comuna_zona(item: ControlSupervisorComunasZonas) -> tuple[int, int]:
    """Prefiere el texto con mejor presentacion cuando hay duplicados equivalentes."""
    texto = f"{item.comuna or ''} {item.zona_principal or ''}".strip()
    caracteres_con_acento = sum(1 for char in texto if ord(char) > 127)
    return (caracteres_con_acento, len(texto))


def _deduplicar_comunas_zonas(
    comunas_zonas: List[ControlSupervisorComunasZonas],
) -> List[ControlSupervisorComunasZonas]:
    """Elimina duplicados como Concepcion/Concepción para evitar opciones repetidas."""
    unicas: Dict[tuple[str, str], ControlSupervisorComunasZonas] = {}

    for item in comunas_zonas:
        clave = (_normalizar_texto(item.comuna), _normalizar_texto(item.zona_principal))
        actual = unicas.get(clave)
        if actual is None or _puntaje_presentacion_comuna_zona(item) > _puntaje_presentacion_comuna_zona(actual):
            unicas[clave] = item

    return sorted(
        unicas.values(),
        key=lambda item: (
            _normalizar_texto(item.comuna),
            _normalizar_texto(item.zona_principal),
            getattr(item, "id", 0) or 0,
        ),
    )


def _obtener_comunas_zonas_supervisor(
    db: Session,
    supervisor_id: int,
) -> List[ControlSupervisorComunasZonas]:
    comunas_zonas = db.query(ControlSupervisorComunasZonas).filter(
        ControlSupervisorComunasZonas.supervisor_id == supervisor_id,
        ControlSupervisorComunasZonas.activo == True
    ).order_by(ControlSupervisorComunasZonas.comuna).all()

    return _deduplicar_comunas_zonas(comunas_zonas)


def _mapa_zonas_por_comuna(comunas_zonas: List[ControlSupervisorComunasZonas]) -> Dict[str, str]:
    zonas_por_comuna: Dict[str, str] = {}
    for item in comunas_zonas:
        clave = _normalizar_texto(item.comuna)
        if clave and clave not in zonas_por_comuna:
            zonas_por_comuna[clave] = item.zona_principal
    return zonas_por_comuna


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

    return _obtener_comunas_zonas_supervisor(db, current_user.supervisor_id)

@router.get("/me/usuarios-sap", response_model=List[SupervisorUsuarioSAP])
def get_me_usuarios_sap(current_user: CurrentUser = Depends(require_supervisor_user), db: Session = Depends(get_db)):
    """Obtiene los usuarios SAP asignados al supervisor autenticado"""

    zonas_por_comuna = _mapa_zonas_por_comuna(
        _obtener_comunas_zonas_supervisor(db, current_user.supervisor_id)
    )
    usuarios = db.query(ControlSupervisorUsuariosSAP).filter(
        ControlSupervisorUsuariosSAP.supervisor_id == current_user.supervisor_id,
        ControlSupervisorUsuariosSAP.activo == True
    ).order_by(ControlSupervisorUsuariosSAP.cuenta).all()

    result = []
    for u in usuarios:
        u_dict = u.__dict__.copy()
        u_dict['zona_principal'] = zonas_por_comuna.get(_normalizar_texto(u.comuna_habitual))
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
        
    return _obtener_comunas_zonas_supervisor(db, id)

@router.get("/{id}/usuarios-sap", response_model=List[SupervisorUsuarioSAP])
def get_usuarios_sap(id: int, db: Session = Depends(get_db), current_user: CurrentUser = Depends(require_roles(['admin', 'superadmin', 'torre_control']))):
    """Obtiene los usuarios SAP asignados a un supervisor, con su zona principal"""
    sup = db.query(ControlSupervisores).filter(ControlSupervisores.id == id).first()
    if not sup:
        raise HTTPException(status_code=404, detail="Supervisor no encontrado")
        
    zonas_por_comuna = _mapa_zonas_por_comuna(_obtener_comunas_zonas_supervisor(db, id))
    usuarios = db.query(ControlSupervisorUsuariosSAP).filter(
        ControlSupervisorUsuariosSAP.supervisor_id == id,
        ControlSupervisorUsuariosSAP.activo == True
    ).order_by(ControlSupervisorUsuariosSAP.cuenta).all()

    result = []
    for u in usuarios:
        u_dict = u.__dict__.copy()
        u_dict['zona_principal'] = zonas_por_comuna.get(_normalizar_texto(u.comuna_habitual))
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
