from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.core.security import verify_password, create_access_token
from app.models.cyr_models import (
    ControlSupervisores,
    ControlSupervisorComunasZonas,
    ControlSupervisorUsuariosSAP,
    UserZoneAccess,
)
from app.repositories.usuario_repository import get_user_by_username
from app.schemas.auth import LoginRequest, TokenResponse


def _normalizar_tipo_brigada(tipo: str | None) -> str | None:
    tipo_normalizado = (tipo or "").strip().upper()
    if tipo_normalizado in {"PXQ", "CF"}:
        return tipo_normalizado
    return None


def _ordenar_tipos_brigada(tipos: set[str]) -> list[str]:
    orden = ("PXQ", "CF")
    return [tipo for tipo in orden if tipo in tipos]


def _build_user_payload(db: Session, user) -> dict:
    payload = {
        "id": user.id,
        "usuario": user.usuario,
        "nombre": getattr(user, "nombre", None) or user.usuario,
        "rol": user.rol,
        "supervisor_id": user.supervisor_id,
    }

    if user.rol in {"admin", "superadmin", "torre_control", "gerencia"}:
        payload["zonas_asignadas"] = ["TODAS"]
        payload["tipos_brigada_permitidos"] = ["PXQ", "CF"]
        return payload

    zonas_usuario = db.query(UserZoneAccess.zona).filter(
        UserZoneAccess.user_id == user.id
    ).distinct().all()

    if user.rol == "supervisor":
        supervisor = None
        if user.supervisor_id:
            supervisor = db.query(ControlSupervisores).filter(
                ControlSupervisores.id == user.supervisor_id
            ).first()

        if zonas_usuario:
            zonas = zonas_usuario
        elif user.supervisor_id:
            zonas = db.query(ControlSupervisorComunasZonas.zona_principal).filter(
                ControlSupervisorComunasZonas.supervisor_id == user.supervisor_id,
                ControlSupervisorComunasZonas.activo == True,
            ).distinct().all()
        else:
            zonas = []

        if user.supervisor_id:
            tipos_rows = db.query(ControlSupervisorUsuariosSAP.tipo_brigada).filter(
                ControlSupervisorUsuariosSAP.supervisor_id == user.supervisor_id,
                ControlSupervisorUsuariosSAP.activo == True,
            ).distinct().all()
        else:
            tipos_rows = []

        tipos = {
            tipo
            for row in tipos_rows
            for tipo in [_normalizar_tipo_brigada(row[0])]
            if tipo
        }
        tipos.add("PXQ")

        payload["nombre"] = supervisor.nombre if supervisor else payload["nombre"]
        payload["zonas_asignadas"] = sorted({z[0] for z in zonas if z[0]})
        payload["tipos_brigada_permitidos"] = _ordenar_tipos_brigada(tipos)

    elif zonas_usuario:
        payload["zonas_asignadas"] = sorted({z[0] for z in zonas_usuario if z[0]})

    return payload


def authenticate_user(db: Session, login_data: LoginRequest) -> TokenResponse:
    user = get_user_by_username(db, login_data.usuario)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inactivo"
        )
        
    access_token = create_access_token(
        data={
            "sub": user.usuario,
            "rol": user.rol,
            "supervisor_id": user.supervisor_id
        }
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=_build_user_payload(db, user)
    )
