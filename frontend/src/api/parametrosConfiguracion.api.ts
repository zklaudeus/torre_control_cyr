import type { ConfiguracionCompleta } from '../types/parametrosConfiguracion';
import { apiClient } from './client';

export const getConfiguracion = async (): Promise<ConfiguracionCompleta> => {
  const response = await apiClient.get<ConfiguracionCompleta>('/api/configuracion/');
  return response.data;
};

export const saveConfiguracion = async (data: ConfiguracionCompleta): Promise<void> => {
  await apiClient.post('/api/configuracion/', data);
};
