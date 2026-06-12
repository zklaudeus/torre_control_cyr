from pydantic import BaseModel
from datetime import date, time
from typing import Optional


class BrigadaDiariaBase(BaseModel):
    zona: str
    codigo_sap: str
    patente: str
    usuario: str
    tipo_brigada: str
    estado_brigada: str
    hora_primer_movimiento: Optional[time] = None
    observacion_brigada: Optional[str] = None
    corte_programado: int = 0
    reconexiones_programadas: int = 0
    # Nuevos campos de resultados por brigada (Ajuste Fase 5.1)
    reconexiones_ejecutadas: int = 0
    primer_corte: Optional[time] = None
    ultimo_corte: Optional[time] = None
    acum_09: int = 0
    acum_10: int = 0
    acum_11: int = 0
    acum_12: int = 0
    acum_13: int = 0
    acum_14: int = 0
    corte_en_poste: int = 0
    corte_en_empalme: int = 0
    visita_fallida: int = 0


class BrigadaDiariaCreate(BrigadaDiariaBase):
    fecha_operacional: date


class BrigadaDiariaUpdate(BaseModel):
    zona: Optional[str] = None
    codigo_sap: Optional[str] = None
    patente: Optional[str] = None
    usuario: Optional[str] = None
    tipo_brigada: Optional[str] = None
    estado_brigada: Optional[str] = None
    hora_primer_movimiento: Optional[time] = None
    observacion_brigada: Optional[str] = None
    corte_programado: Optional[int] = None
    reconexiones_programadas: Optional[int] = None
    reconexiones_ejecutadas: Optional[int] = None
    primer_corte: Optional[time] = None
    ultimo_corte: Optional[time] = None
    acum_09: Optional[int] = None
    acum_10: Optional[int] = None
    acum_11: Optional[int] = None
    acum_12: Optional[int] = None
    acum_13: Optional[int] = None
    acum_14: Optional[int] = None
    corte_en_poste: Optional[int] = None
    corte_en_empalme: Optional[int] = None
    visita_fallida: Optional[int] = None


class BrigadaDiaria(BrigadaDiariaBase):
    id: int
    fecha_operacional: date

    class Config:
        from_attributes = True


class ResumenBrigadasZona(BaseModel):
    zona: str
    brigadas_pxq: int
    brigadas_cf: int
    brigadas_convenio: int
    total_brigadas_reportadas: int
    brigadas_operativas: int
    brigadas_inactivas: int
    observacion_automatica: str