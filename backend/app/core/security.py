from datetime import datetime, timedelta
from typing import Optional
import jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.cyr_models import ControlUsuarios, ControlSupervisorComunasZonas, UserZoneAccess

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.InvalidTokenError:
        raise credentials_exception
        
    user = db.query(ControlUsuarios).filter(ControlUsuarios.usuario == username).first()
    if user is None:
        raise credentials_exception
        
    if not user.activo:
        raise HTTPException(status_code=400, detail="Usuario inactivo")
        
    return user

def require_roles(allowed_roles: list[str]):
    def role_checker(current_user = Depends(get_current_user)):
        if current_user.rol not in allowed_roles:
            raise HTTPException(status_code=403, detail="Acceso denegado: rol insuficiente")
        return current_user
    return role_checker

def require_supervisor_user(current_user = Depends(get_current_user)):
    if current_user.rol != 'supervisor' or not current_user.supervisor_id:
        raise HTTPException(status_code=403, detail="Acceso denegado: rol supervisor requerido")
    return current_user

ROLES_ZONA_GLOBAL = {"admin", "superadmin", "torre_control", "gerencia"}
ROLES_OPERACION_GLOBAL = {"admin", "superadmin", "torre_control"}


def get_zonas_asignadas_usuario(db: Session, user_id: int) -> set[str]:
    zonas = db.query(UserZoneAccess.zona).filter(
        UserZoneAccess.user_id == user_id
    ).all()
    return {z[0] for z in zonas if z[0]}


def get_zonas_permitidas_supervisor(db: Session, supervisor_id: int) -> set[str]:
    zonas = db.query(ControlSupervisorComunasZonas.zona_principal).filter(
        ControlSupervisorComunasZonas.supervisor_id == supervisor_id,
        ControlSupervisorComunasZonas.activo == True
    ).all()
    return {z[0] for z in zonas if z[0]}

def get_zonas_permitidas_usuario(current_user: ControlUsuarios, db: Session) -> set[str] | None:
    """Retorna None para acceso global o un set de zonas permitidas."""
    if current_user.rol in ROLES_ZONA_GLOBAL:
        return None

    zonas_usuario = get_zonas_asignadas_usuario(db, current_user.id)
    if zonas_usuario:
        return zonas_usuario

    if current_user.rol == 'supervisor' and current_user.supervisor_id:
        return get_zonas_permitidas_supervisor(db, current_user.supervisor_id)

    return set()


def tiene_acceso_zona(current_user: ControlUsuarios, zona: str, db: Session) -> bool:
    zonas_permitidas = get_zonas_permitidas_usuario(current_user, db)
    if zonas_permitidas is None:
        return True
    return zona in zonas_permitidas


def puede_operar_zona(current_user: ControlUsuarios, zona: str, db: Session) -> bool:
    if current_user.rol in ROLES_OPERACION_GLOBAL:
        return True
    if current_user.rol == 'supervisor':
        return tiene_acceso_zona(current_user, zona, db)
    return False
