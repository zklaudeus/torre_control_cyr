from pydantic import BaseModel
from typing import List, Optional

class ZonaGerencialData(BaseModel):
    zona: str
    brigadas_operativas: int
    total_brigadas: int
    reconexiones_programadas: float
    reconexiones_ejecutadas: float
    promedio_reconexiones: float
    corte_programado: float
    cortes_ejecutados: float
    promedio_cortes: float
    promedio_actividad: float
    corte_en_poste: float
    corte_en_empalme: float
    corte_fuera_de_rango: float
    visitas_fallidas: float
    cumplimiento_meta_pct: float
    cumplimiento_corte_pct: float

class ReporteGerencialData(BaseModel):
    fecha_operacional: str
    zonas: List[ZonaGerencialData]
    total: ZonaGerencialData
