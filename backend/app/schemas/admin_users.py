from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


VALID_ROLES = {"admin", "superadmin", "torre_control", "supervisor", "gerencia"}


class UserBase(BaseModel):
    nombre: str
    usuario: str
    email: Optional[str] = None
    rol: str
    activo: bool = True
    zonas_asignadas: list[str] = Field(default_factory=list)

    @field_validator("nombre", "usuario", "rol")
    @classmethod
    def not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Campo obligatorio")
        return value

    @field_validator("email")
    @classmethod
    def email_blank_to_none(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        value = value.strip()
        return value or None

    @field_validator("rol")
    @classmethod
    def valid_role(cls, value: str) -> str:
        if value not in VALID_ROLES:
            raise ValueError("Rol invalido")
        return value

    @field_validator("zonas_asignadas")
    @classmethod
    def clean_zones(cls, value: list[str]) -> list[str]:
        return sorted({zona.strip() for zona in value if zona and zona.strip()})

    @model_validator(mode="after")
    def supervisor_requires_zone(self):
        if self.rol == "supervisor" and not self.zonas_asignadas:
            raise ValueError("El rol supervisor debe tener al menos una zona asignada")
        return self


class UserCreate(UserBase):
    password_temporal: str

    @field_validator("password_temporal")
    @classmethod
    def password_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("La contrasena temporal es obligatoria")
        if len(value) < 6:
            raise ValueError("La contrasena temporal debe tener al menos 6 caracteres")
        return value


class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    usuario: Optional[str] = None
    email: Optional[str] = None
    rol: Optional[str] = None
    activo: Optional[bool] = None
    zonas_asignadas: Optional[list[str]] = None
    password_temporal: Optional[str] = None

    @field_validator("nombre", "usuario", "rol")
    @classmethod
    def optional_not_blank(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("Campo no puede quedar vacio")
        return value

    @field_validator("email")
    @classmethod
    def optional_email_blank_to_none(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        value = value.strip()
        return value or None

    @field_validator("rol")
    @classmethod
    def optional_valid_role(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value not in VALID_ROLES:
            raise ValueError("Rol invalido")
        return value

    @field_validator("zonas_asignadas")
    @classmethod
    def optional_clean_zones(cls, value: Optional[list[str]]) -> Optional[list[str]]:
        if value is None:
            return None
        return sorted({zona.strip() for zona in value if zona and zona.strip()})

    @field_validator("password_temporal")
    @classmethod
    def optional_password_valid(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        value = value.strip()
        if len(value) < 6:
            raise ValueError("La contrasena temporal debe tener al menos 6 caracteres")
        return value


class UserStatusUpdate(BaseModel):
    activo: bool


class UserZonesUpdate(BaseModel):
    zonas_asignadas: list[str]

    @field_validator("zonas_asignadas")
    @classmethod
    def clean_zones(cls, value: list[str]) -> list[str]:
        return sorted({zona.strip() for zona in value if zona and zona.strip()})


class UserResponse(BaseModel):
    id: int
    nombre: str
    usuario: str
    email: Optional[str] = None
    rol: str
    activo: bool
    supervisor_id: Optional[int] = None
    zonas_asignadas: list[str]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
