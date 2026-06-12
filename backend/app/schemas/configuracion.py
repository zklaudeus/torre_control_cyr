from pydantic import BaseModel
from typing import List

class ParametrosGenerales(BaseModel):
    hora_inicio_operacion: str
    hora_cierre_operacion: str
    hora_corte_gps: str
    meta_diaria_cortes_pxq: int
    meta_diaria_cortes_cf: int
    meta_diaria_reconexiones: int
    tramo_horario_inicial: str
    tramo_horario_final: str

class ParametrosZonaConfig(BaseModel):
    zona: str
    activa: bool
    brigadas_contrato: int
    meta_diaria_cortes: int
    meta_acumulada_09: int
    meta_acumulada_10: int
    meta_acumulada_11: int
    meta_acumulada_12: int
    meta_acumulada_13: int
    meta_acumulada_14: int
    hora_inicio: str
    hora_cierre: str

class ParametrosAutomatizacion(BaseModel):
    alerta_sin_brigadas: bool
    alerta_brigadas_efectivas: bool
    calcular_cumplimiento_carga: bool
    calcular_promedio_cortes: bool
    calcular_promedio_reconexiones: bool
    calcular_total_actividades: bool
    calcular_cumplimiento_promedio: bool
    generar_observacion_automatica: bool

class ConfiguracionCompleta(BaseModel):
    generales: ParametrosGenerales
    pxq: List[ParametrosZonaConfig]
    cf: List[ParametrosZonaConfig]
    automatizacion: ParametrosAutomatizacion
