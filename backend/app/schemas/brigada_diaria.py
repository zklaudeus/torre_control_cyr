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