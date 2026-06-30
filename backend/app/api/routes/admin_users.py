from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_password_hash, require_roles
from app.models.cyr_models import ControlParametrosZona, ControlUsuarios, UserZoneAccess
from app.schemas.admin_users import (
    UserCreate,
    UserResponse,
    UserStatusUpdate,
    UserUpdate,
    UserZonesUpdate,
)


router = APIRouter()
require_admin = require_roles(["admin", "superadmin"])
GLOBAL_ZONE_ROLES = {"admin", "superadmin", "torre_control", "gerencia"}


def _available_zones(db: Session) -> list[str]:
    rows = db.query(ControlParametrosZona.zona).filter(
        ControlParametrosZona.activo == True
    ).distinct().order_by(ControlParametrosZona.zona).all()
    return [row[0] for row in rows if row[0]]


def _user_zones(db: Session, user_id: int) -> list[str]:
    rows = db.query(UserZoneAccess.zona).filter(
        UserZoneAccess.user_id == user_id
    ).order_by(UserZoneAccess.zona).all()
    return [row[0] for row in rows if row[0]]


def _validate_zones(db: Session, zonas: list[str]) -> list[str]:
    clean = sorted({zona.strip() for zona in zonas if zona and zona.strip()})
    available = set(_available_zones(db))
    invalid = [zona for zona in clean if zona not in available]
    if invalid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Zonas no configuradas: {', '.join(invalid)}",
        )
    return clean


def _validate_role_zones(rol: str, zonas: list[str]) -> None:
    if rol == "supervisor" and not zonas:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El rol supervisor debe tener al menos una zona asignada",
        )


def _sync_zones(db: Session, user_id: int, zonas: list[str]) -> None:
    db.query(UserZoneAccess).filter(UserZoneAccess.user_id == user_id).delete()
    for zona in zonas:
        db.add(UserZoneAccess(user_id=user_id, zona=zona))


def _to_response(db: Session, user: ControlUsuarios) -> UserResponse:
    zonas = _user_zones(db, user.id)
    if user.rol in GLOBAL_ZONE_ROLES and not zonas:
        zonas = ["TODAS"]
    return UserResponse(
        id=user.id,
        nombre=user.nombre or user.usuario,
        usuario=user.usuario,
        email=user.email,
        rol=user.rol,
        activo=user.activo,
        supervisor_id=user.supervisor_id,
        zonas_asignadas=zonas,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


def _get_user_or_404(db: Session, user_id: int) -> ControlUsuarios:
    user = db.query(ControlUsuarios).filter(ControlUsuarios.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


@router.get("/zones", response_model=list[str])
def list_zones(
    db: Session = Depends(get_db),
    _current_user: ControlUsuarios = Depends(require_admin),
):
    return _available_zones(db)


@router.get("/users", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    _current_user: ControlUsuarios = Depends(require_admin),
):
    users = db.query(ControlUsuarios).order_by(ControlUsuarios.usuario).all()
    return [_to_response(db, user) for user in users]


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    body: UserCreate,
    db: Session = Depends(get_db),
    _current_user: ControlUsuarios = Depends(require_admin),
):
    zonas = _validate_zones(db, body.zonas_asignadas)
    _validate_role_zones(body.rol, zonas)

    user = ControlUsuarios(
        nombre=body.nombre,
        usuario=body.usuario,
        email=body.email,
        password_hash=get_password_hash(body.password_temporal),
        rol=body.rol,
        activo=body.activo,
    )
    db.add(user)
    try:
        db.flush()
        _sync_zones(db, user.id, zonas)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un usuario o email con esos datos",
        )
    db.refresh(user)
    return _to_response(db, user)


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    body: UserUpdate,
    db: Session = Depends(get_db),
    _current_user: ControlUsuarios = Depends(require_admin),
):
    user = _get_user_or_404(db, user_id)
    current_zones = _user_zones(db, user.id)
    new_role = body.rol if body.rol is not None else user.rol
    new_zones = (
        _validate_zones(db, body.zonas_asignadas)
        if body.zonas_asignadas is not None
        else current_zones
    )
    _validate_role_zones(new_role, new_zones)

    if body.nombre is not None:
        user.nombre = body.nombre
    if body.usuario is not None:
        user.usuario = body.usuario
    if body.email is not None:
        user.email = body.email
    if body.rol is not None:
        user.rol = body.rol
    if body.activo is not None:
        user.activo = body.activo
    if body.password_temporal:
        user.password_hash = get_password_hash(body.password_temporal)

    try:
        if body.zonas_asignadas is not None:
            _sync_zones(db, user.id, new_zones)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un usuario o email con esos datos",
        )
    db.refresh(user)
    return _to_response(db, user)


@router.patch("/users/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: int,
    body: UserStatusUpdate,
    db: Session = Depends(get_db),
    _current_user: ControlUsuarios = Depends(require_admin),
):
    user = _get_user_or_404(db, user_id)
    user.activo = body.activo
    db.commit()
    db.refresh(user)
    return _to_response(db, user)


@router.get("/users/{user_id}/zones", response_model=list[str])
def get_user_zones(
    user_id: int,
    db: Session = Depends(get_db),
    _current_user: ControlUsuarios = Depends(require_admin),
):
    _get_user_or_404(db, user_id)
    return _user_zones(db, user_id)


@router.put("/users/{user_id}/zones", response_model=UserResponse)
def update_user_zones(
    user_id: int,
    body: UserZonesUpdate,
    db: Session = Depends(get_db),
    _current_user: ControlUsuarios = Depends(require_admin),
):
    user = _get_user_or_404(db, user_id)
    zonas = _validate_zones(db, body.zonas_asignadas)
    _validate_role_zones(user.rol, zonas)
    _sync_zones(db, user.id, zonas)
    db.commit()
    db.refresh(user)
    return _to_response(db, user)
