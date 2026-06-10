import { apiClient } from './client';
import type { ResultadosRealesZonaResponse } from '../types/resultadoRealZona';

export const getResultadosRealesZona = async (fecha: string): Promise<ResultadosRealesZonaResponse> => {
  const response = await apiClient.get<ResultadosRealesZonaResponse>(`/api/resultados-reales-zona/?fecha=${fecha}`);
  return response.data;
};
