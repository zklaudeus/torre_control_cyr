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


class CausaFallidaItem(BaseModel):
    causa_fallida: str
    cantidad: int
    observacion: Optional[str] = None

class RendimientoDiarioItem(BaseModel):
    fecha_operacional: date
    codigo_sap: str
    usuario: str
    brigada: Optional[str] = None
    pareja: Optional[str] = None
    patente: Optional[str] = None
    zona: Optional[str] = None
    tipo_brigada: Optional[str] = None
    carga_dia_evaluable: Optional[int] = None
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
    causas_fallidas: list['CausaFallidaItem'] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class KpiDiaTecnicoItem(BaseModel):
    fecha_operacional: date
    cortes_productivos: int
    meta_aplicada: int
    cumplimiento_pct: Decimal
    visita_fallida: int = 0


class ResumenKpiTecnico(BaseModel):
    codigo_sap: str
    fecha_desde: date
    fecha_hasta: date
    dias_con_datos: int = 0
    productividad_diaria: Optional[int] = None
    meta_diaria: Optional[int] = None
    cumplimiento_diario_pct: Optional[Decimal] = None
    productividad_promedio: Optional[Decimal] = None
    mejor_productividad: Optional[int] = None
    fecha_mejor_productividad: Optional[date] = None
    cumplimiento_acumulado_pct: Optional[Decimal] = None
    total_cortes_acumulados: int = 0
    total_meta_acumulada: int = 0
    corte_en_poste_acumulado: int = 0
    corte_en_empalme_acumulado: int = 0
    corte_fuera_de_rango_acumulado: int = 0
    dias_bajo_meta: int = 0
    dias_criticos: int = 0
    fallidas_dia: int = 0
    fallidas_acumuladas: int = 0
    fallidas_ultimos_7_dias: int = 0
    fallidas_ultimos_14_dias: int = 0
    fallidas_variacion_abs: Optional[int] = None
    fallidas_variacion_pct: Optional[Decimal] = None
    dias: list[KpiDiaTecnicoItem] = Field(default_factory=list)


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


class SeguimientoTecnicoResponse(BaseModel):
    codigo_sap: str
    usuario: str
    zona: Optional[str] = None
    supervisor: Optional[str] = None
    fase_actual: int = 1
    estado_productivo_actual: str = "SIN_EVALUACION"
    dias_consecutivos_bajo_50: int = 0
    dias_consecutivos_alto_desempeno: int = 0
    advertencias_fase2: int = 0
    fecha_ultima_evaluacion: Optional[date] = None
    advertencias_activas: list[AlertaItem] = []
    historial_reciente: list[HistorialItem] = []

    model_config = ConfigDict(from_attributes=True)


class AdvertenciaRequest(BaseModel):
    fecha_operacional: date
    motivo: str = Field(..., min_length=1, description="Motivo obligatorio de la advertencia")


class AdvertenciaResponse(BaseModel):
    success: bool = True
    mensaje: str
    advertencia: AlertaItem
    fase_anterior: Optional[int] = None
    fase_nueva: Optional[int] = None
    advertencias_activas_count: int


class CambioFaseRequest(BaseModel):
    fase_nueva: int = Field(..., ge=1, le=3, description="Fase a asignar (1, 2 o 3)")
    motivo: str = Field(..., min_length=1, description="Motivo obligatorio del cambio de fase")


class CambioFaseResponse(BaseModel):
    success: bool = True
    mensaje: str
    codigo_sap: str
    fase_anterior: int
    fase_nueva: int


class AnularAdvertenciaRequest(BaseModel):
    motivo_anulacion: str = Field(..., min_length=1, description="Motivo obligatorio de la anulación")


class ZonaResumenPanel(BaseModel):
    zona: str
    total_tecnicos: int = 0
    tecnicos_evaluables_hoy: int = 0
    sin_evaluacion: int = 0
    criticos: int = 0
    recuperacion: int = 0
    estables: int = 0
    alto_desempeno: int = 0
    fase_1: int = 0
    fase_2: int = 0
    fase_3: int = 0
    advertencias_activas: int = 0
    prioridad: str = "NORMAL"


class AnularAdvertenciaResponse(BaseModel):
    success: bool = True
    mensaje: str
    advertencia: AlertaItem
    fase_anterior: Optional[int] = None
    fase_nueva: Optional[int] = None
    advertencias_activas_restantes: int


class SemaforoManualUpdate(BaseModel):
    estado: str = Field(..., description="SIN_EVALUACION, CRITICO, ESTABLE, ALTO_DESEMPENO")
    descripcion: Optional[str] = None


class SemaforoManualResponse(BaseModel):
    categoria: str
    estado: str
    descripcion: Optional[str] = None
    updated_at: Optional[datetime] = None
    usuario_actualiza_id: Optional[int] = None


# ─── Recomendaciones del Supervisor ──────────────────────────────────────────

class RecomendacionCreate(BaseModel):
    comentario: str = Field(..., min_length=1, max_length=2000, description="Texto de la recomendación")
    prioridad: str = Field(default="MEDIA", description="ALTA, MEDIA o BAJA")
    estado_accion: str = Field(default="PENDIENTE", description="PENDIENTE, EN_CURSO, COMPLETADO, CANCELADO")

    model_config = ConfigDict(from_attributes=True)


class RecomendacionUpdate(BaseModel):
    comentario: Optional[str] = Field(None, min_length=1, max_length=2000)
    prioridad: Optional[str] = None
    estado_accion: Optional[str] = None


class RecomendacionResponse(BaseModel):
    id: int
    codigo_sap: str
    comentario: str
    prioridad: str
    estado_accion: str
    usuario_id: int
    autor_nombre: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
