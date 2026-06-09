from pydantic import BaseModel, Field
from datetime import date
from typing import List, Optional

class ProgramacionZonaBase(BaseModel):
    zona: str
    reconexiones_programadas: int = Field(default=0, ge=0)
    asignacion_carga: int = Field(default=0, ge=0)
    corte_programado: int = Field(default=0, ge=0)

class ProgramacionZonaCreate(ProgramacionZonaBase):
    fecha_operacional: date

class ProgramacionZonaUpdate(ProgramacionZonaBase):
    pass

class ProgramacionZonaBulkCreate(BaseModel):
    fecha_operacional: date
    items: List[ProgramacionZonaBase]

class ProgramacionZona(ProgramacionZonaBase):
    id: Optional[int] = None
    fecha_operacional: date

    class Config:
        from_attributes = True
