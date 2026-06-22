import { apiClient } from './client';

export interface Supervisor {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface SupervisorComunaZona {
  id: number;
  supervisor_id: number;
  comuna: string;
  zona_principal: string;
  activo: boolean;
}

export interface SupervisorUsuarioSAP {
  id: number;
  supervisor_id: number;
  codigo_sap: string;
  cuenta: string;
  tipo_brigada: string;
  patente_habitual?: string;
  brigada?: string;
  pareja?: string;
  comuna_habitual?: string;
  zona_principal?: string;
  activo: boolean;
}

export const getSupervisoresActivos = async (): Promise<Supervisor[]> => {
  const { data } = await apiClient.get<Supervisor[]>('/api/supervisores/');
  return data;
};

export const getComunasZonasBySupervisor = async (supervisorId: number): Promise<SupervisorComunaZona[]> => {
  const { data } = await apiClient.get<SupervisorComunaZona[]>(`/api/supervisores/${supervisorId}/comunas-zonas`);
  return data;
};

export const getUsuariosSapBySupervisor = async (supervisorId: number): Promise<SupervisorUsuarioSAP[]> => {
  const { data } = await apiClient.get<SupervisorUsuarioSAP[]>(`/api/supervisores/${supervisorId}/usuarios-sap`);
  return data;
};

export const getMeComunasZonas = async (): Promise<SupervisorComunaZona[]> => {
  const { data } = await apiClient.get<SupervisorComunaZona[]>('/api/supervisores/me/comunas-zonas');
  return data;
};

export const getMeUsuariosSap = async (): Promise<SupervisorUsuarioSAP[]> => {
  const { data } = await apiClient.get<SupervisorUsuarioSAP[]>('/api/supervisores/me/usuarios-sap');
  return data;
};

export const getAllUsuariosSap = async (): Promise<SupervisorUsuarioSAP[]> => {
  const { data } = await apiClient.get<SupervisorUsuarioSAP[]>('/api/supervisores/usuarios-sap/todos');
  return data;
};

export interface ZonaResumenOut {
  zona: string;
  tipo_brigada: string;
  total_brigadas: number;
  corte_programado: number;
  reconexiones_programadas: number;
  total_en_bandeja: number;
}

export interface BitacoraResumenPreviewRes {
  fecha_operacional: string;
  supervisor_id: number;
  total_brigadas: number;
  total_corte_programado: number;
  total_reconexiones_programadas: number;
  zonas: ZonaResumenOut[];
  errores: string[];
  advertencias: string[];
}

export const getResumenBitacoraPreview = async (
  supervisorId: number, 
  payload: any
): Promise<BitacoraResumenPreviewRes> => {
  const { data } = await apiClient.post<BitacoraResumenPreviewRes>(
    `/api/supervisores/${supervisorId}/bitacora/resumen-preview`,
    payload
  );
  return data;
};

export const getMeResumenBitacoraPreview = async (
  payload: any
): Promise<BitacoraResumenPreviewRes> => {
  const { data } = await apiClient.post<BitacoraResumenPreviewRes>(
    '/api/supervisores/me/bitacora/resumen-preview',
    payload
  );
  return data;
};
