import { apiClient } from './client';
import type { ProgramacionCFZonaResponse, ProgramacionCFZonaBulkCreate, ResultadosRealesCFZonaResponse } from '../types/cf';

export const getProgramacionCFZona = async (fecha: string): Promise<ProgramacionCFZonaResponse> => {
  const response = await apiClient.get<ProgramacionCFZonaResponse>(`/api/programacion-cf-zona/?fecha=${fecha}`);
  return response.data;
};

export const saveProgramacionCFZona = async (data: ProgramacionCFZonaBulkCreate): Promise<ProgramacionCFZonaResponse> => {
  const response = await apiClient.post<ProgramacionCFZonaResponse>('/api/programacion-cf-zona/bulk', data);
  return response.data;
};

export const getResultadosRealesCFZona = async (fecha: string): Promise<ResultadosRealesCFZonaResponse> => {
  const response = await apiClient.get<ResultadosRealesCFZonaResponse>(`/api/resultados-reales-cf-zona/?fecha=${fecha}`);
  return response.data;
};
