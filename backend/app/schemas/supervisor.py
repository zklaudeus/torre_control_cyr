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
    activo: bool = True

class SupervisorUsuarioSAP(SupervisorUsuarioSAPBase):
    id: int

    class Config:
        from_attributes = True
