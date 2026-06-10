import { apiClient } from './client';
import type { ResumenZonaResponse } from '../types/resumenZona';

export const getResumenZona = async (fecha: string): Promise<ResumenZonaResponse> => {
  const response = await apiClient.get<ResumenZonaResponse>(`/api/resumen-zona/?fecha=${fecha}`);
  return response.data;
};
