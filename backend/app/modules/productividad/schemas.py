"""
Esquemas del módulo de productividad.

KPIs:
  cumplimiento_pct = (cortes_productivos / meta_aplicada) * 100
  cortes_productivos = corte_en_poste + corte_en_empalme + corte_fuera_de_rango
  estado_diario: CRITICO (<50%), RECUPERACION (50-79%), ESTABLE (80-99%), ALTO_DESEMPENO (>=100%)
  fase_actual: 1 (normal), 2 (advertencia), 3 (medición)
"""
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class TecnicoResumen(BaseModel):
    codigo_sap: str
    cuenta: str
    tipo_brigada: str
    supervisor_id: Optional[int] = None
    supervisor_nombre: Optional[str] = None
    zona: Optional[str] = None
    activo: bool = True
    fase_actual: int = 1
    estado_productivo_actual: str = "SIN_EVALUACION"
    dias_consecutivos_bajo_50: int = 0
    dias_consecutivos_alto_desempeno: int = 0
    advertencias_fase2: int = 0

    model_config = ConfigDict(from_attributes=True)


class RendimientoDiarioItem(BaseModel):
    fecha_operacional: date
    codigo_sap: str
    usuario: str
    zona: Optional[str] = None
    tipo_brigada: Optional[str] = None
    corte_en_poste: int = 0
    corte_en_empalme: int = 0
    corte_fuera_de_rango: int = 0
    visita_fallida: int = 0
    reconexiones: int = 0
    cortes_productivos: int = 0
    meta_aplicada: int = 0
    cumplimiento_pct: Decimal = Decimal("0.00")
    es_evaluable: bool = True
    estado_diario: Optional[str] = None
    motivo_no_evaluable: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ResumenDiarioZona(BaseModel):
    zona: str
    fecha_operacional: date
    total_tecnicos: int = 0
    tecnicos_evaluables: int = 0
    tecnicos_no_evaluables: int = 0
    promedio_cumplimiento: Decimal = Decimal("0.00")
    corte_en_poste_sum: int = 0
    corte_en_empalme_sum: int = 0
    corte_fuera_de_rango_sum: int = 0
    visita_fallida_sum: int = 0
    reconexiones_sum: int = 0
    criticos: int = 0
    recuperacion: int = 0
    estables: int = 0
    alto_desempeno: int = 0


class ResumenDiarioSupervisor(BaseModel):
    supervisor_id: int
    supervisor_nombre: str
    total_tecnicos: int = 0
    tecnicos_evaluables: int = 0
    promedio_cumplimiento: Decimal = Decimal("0.00")
    criticos: int = 0
    recuperacion: int = 0
    estables: int = 0
    alto_desempeno: int = 0


class RankingItem(BaseModel):
    codigo_sap: str
    cuenta: str
    zona: Optional[str] = None
    promedio_cumplimiento_30d: Decimal = Decimal("0.00")
    dias_evaluados_30d: int = 0
    tendencia: str = "ESTABLE"
    fase_actual: int = 1
    estado_productivo_actual: str = "SIN_EVALUACION"

    model_config = ConfigDict(from_attributes=True)


class HistorialItem(BaseModel):
    fecha_cambio: datetime
    codigo_sap: str
    tipo_cambio: str
    fase_anterior: Optional[int] = None
    fase_nueva: Optional[int] = None
    estado_anterior: Optional[str] = None
    estado_nuevo: Optional[str] = None
    motivo: Optional[str] = None
    regla_disparadora: str

    model_config = ConfigDict(from_attributes=True)


class AlertaItem(BaseModel):
    id: int
    codigo_sap: str
    fecha_operacional: date
    fase_al_momento: int
    numero_advertencia: Optional[int] = None
    motivo: str
    estado: str
    fecha_registro: datetime
    anulada_por_id: Optional[int] = None
    fecha_anulacion: Optional[datetime] = None
    motivo_anulacion: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ProductividadFilterParams(BaseModel):
    fecha_desde: Optional[date] = None
    fecha_hasta: Optional[date] = None
    zona: Optional[str] = None
    supervisor_id: Optional[int] = None
    tipo_brigada: Optional[str] = None
    codigo_sap: Optional[str] = None
    estado_diario: Optional[str] = None
    limit: int = Field(default=100, ge=1, le=1000)
    offset: int = Field(default=0, ge=0)
