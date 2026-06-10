from pydantic import BaseModel
from typing import List, Optional
from datetime import time

class ParametrosCFGeneralesBase(BaseModel):
    meta_diaria_cortes_brigada: int
    hora_inicio_jornada: time
    hora_cierre_jornada: time
    meta_acumulada_09: int
    meta_acumulada_10: int
    meta_acumulada_11: int
    meta_acumulada_12: int
    meta_acumulada_13: int
    meta_acumulada_14: int
    umbral_semaforo_logrado: int
    umbral_semaforo_mejora: int
    activo: bool

class ParametrosCFGenerales(ParametrosCFGeneralesBase):
    id: int
    class Config:
        from_attributes = True

class ParametrosCFZonaBase(BaseModel):
    zona: str
    brigadas_cf_contrato: int
    activo: bool

class ParametrosCFZona(ParametrosCFZonaBase):
    id: int
    class Config:
        from_attributes = True

class ParametrosCFResponse(BaseModel):
    generales: Optional[ParametrosCFGenerales]
    zonas: List[ParametrosCFZona]
