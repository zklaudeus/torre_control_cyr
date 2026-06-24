"""
Políticas de autorización del módulo de productividad.
"""
from fastapi import Depends, HTTPException, status

from app.core.security import get_current_user
from app.models.cyr_models import ControlUsuarios


ROLES_PRODUCTIVIDAD_LECTURA = ["admin", "superadmin", "torre_control", "gerencia", "supervisor"]
ROLES_PRODUCTIVIDAD_ALERTAS = ["admin", "superadmin", "torre_control"]


def require_acceso_productividad(
    current_user: ControlUsuarios = Depends(get_current_user),
):
    if current_user.rol not in ROLES_PRODUCTIVIDAD_LECTURA:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: no tiene permisos para ver productividad",
        )
    return current_user


def require_gestion_alertas(
    current_user: ControlUsuarios = Depends(get_current_user),
):
    if current_user.rol not in ROLES_PRODUCTIVIDAD_ALERTAS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: solo torre_control y admin pueden gestionar alertas",
        )
    return current_user
