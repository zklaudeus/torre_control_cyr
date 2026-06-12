from pydantic import BaseModel
from typing import List, Optional


class ResumenZonaFila(BaseModel):
    zona: str
    tipo_brigada: str
    brigadas_reportadas: int
    brigadas_contrato: int
    porcentaje_brigadas_efectivas: float
    reconexiones_programadas: int
    total_reconexiones_ejecutadas: int
    promedio_reconexiones: float
    asignacion_carga: int
    corte_programado: int
    total_cortes: int
    cumplimiento_corte_porcentaje: float
    promedio_cortes: float
    total_actividades: int
    promedio_actividades: float
    cumplimiento_promedio_meta: float
    observacion: str


class ResumenZonaResponse(BaseModel):
    fecha_operacional: str
    zonas: List[ResumenZonaFila]
    totales: List[ResumenZonaFila]
    alertas: List[str]
