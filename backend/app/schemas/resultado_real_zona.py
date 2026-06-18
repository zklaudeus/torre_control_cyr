from pydantic import BaseModel
from datetime import date, time
from typing import List, Optional


class ResultadoRealZonaCalculado(BaseModel):
    """Schema de solo lectura — calculado desde control_brigadas_diario."""
    zona: str
    fecha_operacional: date
    total_reconexiones_ejecutadas: int
    total_cortes: int
    corte_en_poste: int
    corte_en_empalme: int
    corte_fuera_de_rango: int
    visita_fallida: int
    primer_corte: Optional[time] = None
    ultimo_corte: Optional[time] = None
    acum_09: Optional[int] = None
    acum_10: Optional[int] = None
    acum_11: Optional[int] = None
    acum_12: Optional[int] = None
    acum_13: Optional[int] = None
    acum_14: Optional[int] = None
    tiene_brigadas: bool = True

    class Config:
        from_attributes = True


class ResultadosRealesZonaResponse(BaseModel):
    fecha_operacional: str
    zonas: List[ResultadoRealZonaCalculado]
    alertas: List[str]


# ─── Legacy schemas (kept for backward compat, not used in main flow) ─────────
class ResultadoRealZonaBase(BaseModel):
    zona: str
    total_reconexiones_ejecutadas: int = 0
    total_cortes: int = 0
    corte_en_poste: int = 0
    corte_en_empalme: int = 0
    visita_fallida: int = 0


class ResultadoRealZonaBulkCreate(BaseModel):
    fecha_operacional: date
    items: List[ResultadoRealZonaBase]


class ResultadoRealZona(ResultadoRealZonaBase):
    id: Optional[int] = None
    fecha_operacional: date

    class Config:
        from_attributes = True
