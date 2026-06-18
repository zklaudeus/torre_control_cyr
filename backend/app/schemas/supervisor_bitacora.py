from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class BitacoraFilaIn(BaseModel):
    codigo_sap: str
    cuenta: str
    patente: str
    brigada: str
    pareja: Optional[str] = ""
    comuna: str
    tipo_brigada: str
    carga: Optional[float] = 0.0
    reconexiones: Optional[float] = 0.0
    estado_brigada: str
    observacion: Optional[str] = ""

class BitacoraResumenPreviewReq(BaseModel):
    fecha_operacional: str
    filas: List[BitacoraFilaIn]
    total_en_bandeja_por_zona: Optional[Dict[str, int]] = Field(default_factory=dict)

class ZonaResumenOut(BaseModel):
    zona: str
    tipo_brigada: str
    total_brigadas: int
    corte_programado: float
    reconexiones_programadas: float
    total_en_bandeja: int

class BitacoraResumenPreviewRes(BaseModel):
    fecha_operacional: str
    supervisor_id: int
    total_brigadas: int
    total_corte_programado: float
    total_reconexiones_programadas: float
    zonas: List[ZonaResumenOut]
    errores: List[str]
    advertencias: List[str]
