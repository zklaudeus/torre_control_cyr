export interface ResumenZonaFila {
  zona: string;
  brigadas_pxq: number;
  brigadas_cf: number;
  brigadas_convenio: number;
  total_brigadas_reportadas: number;
  brigadas_contrato: number;
  porcentaje_brigadas_efectivas: number;
  reconexiones_programadas: number;
  total_reconexiones_ejecutadas: number;
  promedio_reconexiones: number;
  asignacion_carga: number;
  corte_programado: number;
  total_cortes: number;
  cumplimiento_corte_porcentaje: number;
  promedio_cortes: number;
  total_actividades: number;
  promedio_actividades: number;
  cumplimiento_promedio_meta: number;
  observacion: string;
}

export interface ResumenZonaResponse {
  fecha_operacional: string;
  zonas: ResumenZonaFila[];
  total: ResumenZonaFila;
  alertas: string[];
}
