from pydantic import BaseModel
from typing import List, Optional

class SupervisorBase(BaseModel):
    nombre: str
    activo: bool = True

class Supervisor(SupervisorBase):
    id: int

    class Config:
        from_attributes = True

class SupervisorComunaZonaBase(BaseModel):
    supervisor_id: int
    comuna: str
    zona_principal: str
    activo: bool = True

class SupervisorComunaZona(SupervisorComunaZonaBase):
    id: int

    class Config:
        from_attributes = True

class SupervisorUsuarioSAPBase(BaseModel):
    supervisor_id: int
    codigo_sap: str
    cuenta: str
    tipo_brigada: str = 'PXQ'
    patente_habitual: Optional[str] = None
    brigada: Optional[str] = None
    pareja: Optional[str] = None
    comuna_habitual: Optional[str] = None
    zona_principal: Optional[str] = None
    activo: bool = True

class SupervisorUsuarioSAP(SupervisorUsuarioSAPBase):
    id: int

    class Config:
        from_attributes = True
