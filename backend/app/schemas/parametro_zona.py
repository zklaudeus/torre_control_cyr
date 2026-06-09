from pydantic import BaseModel
from typing import Optional

class ParametroZonaBase(BaseModel):
    zona: str
    brigadas_contrato: int
    activo: bool

class ParametroZona(ParametroZonaBase):
    id: int

    class Config:
        from_attributes = True
