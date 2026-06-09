import { apiClient } from './client';
import type { ProgramacionZona, ProgramacionZonaBulkCreate } from '../types/programacionZona';

export const getProgramacionZona = async (fecha: string): Promise<ProgramacionZona[]> => {
  const response = await apiClient.get<ProgramacionZona[]>(`/api/programacion-zona/?fecha=${fecha}`);
  return response.data;
};

export const bulkCreateOrUpdateProgramacion = async (data: ProgramacionZonaBulkCreate): Promise<ProgramacionZona[]> => {
  const response = await apiClient.post<ProgramacionZona[]>('/api/programacion-zona/bulk', data);
  return response.data;
};
