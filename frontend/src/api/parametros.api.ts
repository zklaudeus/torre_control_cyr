import { apiClient } from './client';
import type { ParametroZona } from '../types/programacionZona';

export const getZonasActivas = async (): Promise<ParametroZona[]> => {
  const response = await apiClient.get<ParametroZona[]>('/api/parametros/zonas');
  return response.data;
};
