import { apiClient } from './client';

export interface TecnicoResumenBackend {
  codigo_sap: string;
  cuenta: string;
  tipo_brigada: string;
  supervisor_id: number | null;
  supervisor_nombre: string | null;
  zona: string | null;
  activo: boolean;
  fase_actual: number;
  estado_productivo_actual: string;
  dias_consecutivos_bajo_50: number;
  dias_consecutivos_alto_desempeno: number;
  advertencias_fase2: number;
}

export interface CausaFallidaBackend {
  causa_fallida: string;
  cantidad: number;
  observacion: string | null;
}

export interface RendimientoDiarioBackend {
  fecha_operacional: string;
  codigo_sap: string;
  usuario: string;
  zona: string | null;
  tipo_brigada: string | null;
  corte_en_poste: number;
  corte_en_empalme: number;
  corte_fuera_de_rango: number;
  visita_fallida: number;
  reconexiones: number;
  cortes_productivos: number;
  meta_aplicada: number;
  cumplimiento_pct: number;
  es_evaluable: boolean;
  estado_diario: string | null;
  motivo_no_evaluable: string | null;
  causas_fallidas: CausaFallidaBackend[];
}

export interface ResumenDiarioZonaBackend {
  zona: string;
  fecha_operacional: string;
  total_tecnicos: number;
  tecnicos_evaluables: number;
  tecnicos_no_evaluables: number;
  promedio_cumplimiento: number;
  corte_en_poste_sum: number;
  corte_en_empalme_sum: number;
  corte_fuera_de_rango_sum: number;
  visita_fallida_sum: number;
  reconexiones_sum: number;
  criticos: number;
  recuperacion: number;
  estables: number;
  alto_desempeno: number;
}

export interface ResumenDiarioSupervisorBackend {
  supervisor_id: number;
  supervisor_nombre: string;
  total_tecnicos: number;
  tecnicos_evaluables: number;
  promedio_cumplimiento: number;
  criticos: number;
  recuperacion: number;
  estables: number;
  alto_desempeno: number;
}

export interface RankingItemBackend {
  codigo_sap: string;
  cuenta: string;
  zona: string | null;
  promedio_cumplimiento_30d: number;
  dias_evaluados_30d: number;
  tendencia: string;
  fase_actual: number;
  estado_productivo_actual: string;
}

export interface HistorialItemBackend {
  fecha_cambio: string;
  codigo_sap: string;
  tipo_cambio: string;
  fase_anterior: number | null;
  fase_nueva: number | null;
  estado_anterior: string | null;
  estado_nuevo: string | null;
  motivo: string | null;
  regla_disparadora: string;
}

export interface AlertaItemBackend {
  id: number;
  codigo_sap: string;
  fecha_operacional: string;
  fase_al_momento: number;
  numero_advertencia: number | null;
  motivo: string;
  estado: string;
  fecha_registro: string;
  anulada_por_id: number | null;
  fecha_anulacion: string | null;
  motivo_anulacion: string | null;
}

export interface ProductividadFilterParams {
  fecha_desde?: string;
  fecha_hasta?: string;
  codigo_sap?: string;
  zona?: string;
  supervisor_id?: number;
  estado_diario?: string;
  limit?: number;
  offset?: number;
}

export const getTecnicos = async (params?: {
  activo?: boolean;
  zona?: string;
}): Promise<TecnicoResumenBackend[]> => {
  const query: Record<string, string> = {};
  if (params?.activo !== undefined) query.activo = String(params.activo);
  if (params?.zona) query.zona = params.zona;
  const res = await apiClient.get<TecnicoResumenBackend[]>('/api/productividad/tecnicos', { params: query });
  return res.data;
};

export const getRendimientoDiario = async (params?: ProductividadFilterParams): Promise<RendimientoDiarioBackend[]> => {
  const res = await apiClient.get<RendimientoDiarioBackend[]>('/api/productividad/rendimiento', { params });
  return res.data;
};

export const getResumenZona = async (fecha: string, params?: {
  zona?: string;
  supervisor_id?: number;
}): Promise<ResumenDiarioZonaBackend[]> => {
  const res = await apiClient.get<ResumenDiarioZonaBackend[]>('/api/productividad/resumen/zona', {
    params: { fecha, ...params },
  });
  return res.data;
};

export const getResumenSupervisor = async (fecha: string, supervisor_id?: number): Promise<ResumenDiarioSupervisorBackend[]> => {
  const res = await apiClient.get<ResumenDiarioSupervisorBackend[]>('/api/productividad/resumen/supervisor', {
    params: { fecha, supervisor_id },
  });
  return res.data;
};

export const getRanking = async (params?: {
  fecha_hasta?: string;
  zona?: string;
  supervisor_id?: number;
  limit?: number;
}): Promise<RankingItemBackend[]> => {
  const res = await apiClient.get<RankingItemBackend[]>('/api/productividad/ranking', { params });
  return res.data;
};

export const getHistorial = async (params?: {
  codigo_sap?: string;
  limit?: number;
  offset?: number;
}): Promise<HistorialItemBackend[]> => {
  const res = await apiClient.get<HistorialItemBackend[]>('/api/productividad/historial', { params });
  return res.data;
};

export const getAlertas = async (params?: {
  estado?: string;
  codigo_sap?: string;
  limit?: number;
  offset?: number;
}): Promise<AlertaItemBackend[]> => {
  const res = await apiClient.get<AlertaItemBackend[]>('/api/productividad/alertas', { params });
  return res.data;
};

// ─── Seguimiento Técnico ─────────────────────────────────────────

export interface AdvertenciaActivaBackend {
  id: number;
  codigo_sap: string;
  fecha_operacional: string;
  fase_al_momento: number;
  numero_advertencia: number | null;
  motivo: string;
  estado: string;
  fecha_registro: string;
  anulada_por_id: number | null;
  fecha_anulacion: string | null;
  motivo_anulacion: string | null;
}

export interface SeguimientoTecnicoBackend {
  codigo_sap: string;
  usuario: string;
  zona: string | null;
  supervisor: string | null;
  fase_actual: number;
  estado_productivo_actual: string;
  dias_consecutivos_bajo_50: number;
  dias_consecutivos_alto_desempeno: number;
  advertencias_fase2: number;
  fecha_ultima_evaluacion: string | null;
  advertencias_activas: AdvertenciaActivaBackend[];
  historial_reciente: HistorialItemBackend[];
}

export interface AdvertenciaResponseBackend {
  success: boolean;
  mensaje: string;
  advertencia: AdvertenciaActivaBackend;
  fase_anterior: number | null;
  fase_nueva: number | null;
  advertencias_activas_count: number;
}

export const getSeguimientoTecnico = async (codigoSap: string): Promise<SeguimientoTecnicoBackend> => {
  const res = await apiClient.get<SeguimientoTecnicoBackend>(`/api/productividad/tecnicos/${codigoSap}/seguimiento`);
  return res.data;
};

export const registrarAdvertencia = async (
  codigoSap: string,
  data: { fecha_operacional: string; motivo: string }
): Promise<AdvertenciaResponseBackend> => {
  const res = await apiClient.post<AdvertenciaResponseBackend>(
    `/api/productividad/tecnicos/${codigoSap}/advertencias`,
    data
  );
  return res.data;
};

export interface CambioFaseRequest {
  fase_nueva: number;
  motivo: string;
}

export interface CambioFaseResponse {
  success: boolean;
  mensaje: string;
  codigo_sap: string;
  fase_anterior: number;
  fase_nueva: number;
}

export const cambiarFaseTecnico = async (
  codigoSap: string,
  data: CambioFaseRequest
): Promise<CambioFaseResponse> => {
  const res = await apiClient.put<CambioFaseResponse>(
    `/api/productividad/tecnicos/${codigoSap}/fase`,
    data
  );
  return res.data;
};

export interface AnularAdvertenciaRequest {
  motivo_anulacion: string;
}

export interface AnularAdvertenciaResponse {
  success: boolean;
  mensaje: string;
  advertencia: AdvertenciaActivaBackend;
  fase_anterior: number | null;
  fase_nueva: number | null;
  advertencias_activas_restantes: number;
}

export const anularAdvertencia = async (
  advertenciaId: number,
  data: AnularAdvertenciaRequest
): Promise<AnularAdvertenciaResponse> => {
  const res = await apiClient.put<AnularAdvertenciaResponse>(
    `/api/productividad/tecnicos/advertencias/${advertenciaId}/anular`,
    data
  );
  return res.data;
};

export interface EliminarAdvertenciaResponse {
  success: boolean;
  mensaje: string;
  codigo_sap: string;
  fase_anterior: number | null;
  fase_nueva: number | null;
}

// ─── Panel de Zonas ──────────────────────────────────────────────

export interface ZonaResumenPanelBackend {
  zona: string;
  total_tecnicos: number;
  tecnicos_evaluables_hoy: number;
  sin_evaluacion: number;
  criticos: number;
  recuperacion: number;
  estables: number;
  alto_desempeno: number;
  fase_1: number;
  fase_2: number;
  fase_3: number;
  advertencias_activas: number;
  prioridad: string;
}

export const getZonasResumen = async (): Promise<ZonaResumenPanelBackend[]> => {
  const res = await apiClient.get<ZonaResumenPanelBackend[]>('/api/productividad/zonas/resumen');
  return res.data;
};

export const eliminarAdvertencia = async (
  advertenciaId: number
): Promise<EliminarAdvertenciaResponse> => {
  const res = await apiClient.delete<EliminarAdvertenciaResponse>(
    `/api/productividad/tecnicos/advertencias/${advertenciaId}`
  );
  return res.data;
};
