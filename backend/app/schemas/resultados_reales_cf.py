from pydantic import BaseModel
from datetime import date, time
from typing import List, Optional

class ResultadoRealCFZonaCalculado(BaseModel):
    """Schema de solo lectura — calculado desde control_brigadas_diario filtrando tipo_brigada = 'CF'."""
    zona: str
    fecha_operacional: date
    total_cortes_cf: int
    corte_en_poste_cf: int
    corte_en_empalme_cf: int
    corte_fuera_de_rango_cf: int
    visita_fallida_cf: int
    primer_corte_cf: Optional[time] = None
    ultimo_corte_cf: Optional[time] = None
    acum_09: int
    acum_10: int
    acum_11: int
    acum_12: int
    acum_13: int
    acum_14: int
    tiene_brigadas_cf: bool = True

    class Config:
        from_attributes = True

class ResultadosRealesCFZonaResponse(BaseModel):
    fecha_operacional: str
    zonas: List[ResultadoRealCFZonaCalculado]
    alertas: List[str]
