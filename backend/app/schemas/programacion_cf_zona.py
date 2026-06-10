from pydantic import BaseModel
from datetime import date
from typing import List, Optional

class ProgramacionCFZonaBase(BaseModel):
    zona: str
    reconexiones_programadas: int = 0
    total_reconexiones_ejecutadas: int = 0
    cortes_programados: int = 0

class ProgramacionCFZonaBulkCreate(BaseModel):
    fecha_operacional: date
    items: List[ProgramacionCFZonaBase]

class ProgramacionCFZona(ProgramacionCFZonaBase):
    id: Optional[int] = None
    fecha_operacional: date

    class Config:
        from_attributes = True

class ProgramacionCFZonaResponse(BaseModel):
    fecha_operacional: str
    zonas: List[ProgramacionCFZona]
