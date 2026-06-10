export interface ParametrosGenerales {
  hora_inicio_operacion: string;
  hora_cierre_operacion: string;
  hora_corte_gps: string;
  meta_diaria_cortes_pxq: number;
  meta_diaria_cortes_cf: number;
  meta_diaria_reconexiones: number;
  tramo_horario_inicial: string;
  tramo_horario_final: string;
}

export interface ParametrosPxqZona {
  zona: string;
  activa: boolean;
  brigadas_contrato: number;
  meta_diaria_cortes: number;
  meta_acumulada_09: number;
  meta_acumulada_10: number;
  meta_acumulada_11: number;
  meta_acumulada_12: number;
  meta_acumulada_13: number;
  meta_acumulada_14: number;
  hora_inicio: string;
  hora_cierre: string;
}

export interface ParametrosCfZona {
  zona: string;
  activa: boolean;
  brigadas_contrato: number;
  meta_diaria_cortes: number;
  meta_acumulada_09: number;
  meta_acumulada_10: number;
  meta_acumulada_11: number;
  meta_acumulada_12: number;
  meta_acumulada_13: number;
  meta_acumulada_14: number;
  hora_inicio: string;
  hora_cierre: string;
}

export interface ParametrosAutomatizacion {
  alerta_sin_brigadas: boolean;
  alerta_brigadas_efectivas: boolean;
  calcular_cumplimiento_carga: boolean;
  calcular_promedio_cortes: boolean;
  calcular_promedio_reconexiones: boolean;
  calcular_total_actividades: boolean;
  calcular_cumplimiento_promedio: boolean;
  generar_observacion_automatica: boolean;
}

export interface ConfiguracionCompleta {
  generales: ParametrosGenerales;
  pxq: ParametrosPxqZona[];
  cf: ParametrosCfZona[];
  automatizacion: ParametrosAutomatizacion;
}
