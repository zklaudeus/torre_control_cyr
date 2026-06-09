import { apiClient } from './client';
import type { BrigadaDiaria, BrigadaDiariaCreate, ResumenBrigadasZona } from '../types/brigadaDia';

export const getBrigadas = async (fecha: string): Promise<BrigadaDiaria[]> => {
  const response = await apiClient.get<BrigadaDiaria[]>(`/api/brigadas-dia/?fecha=${fecha}`);
  return response.data;
};

export const getResumenBrigadas = async (fecha: string): Promise<ResumenBrigadasZona[]> => {
  const response = await apiClient.get<ResumenBrigadasZona[]>(`/api/brigadas-dia/resumen?fecha=${fecha}`);
  return response.data;
};

export const createBrigada = async (data: BrigadaDiariaCreate): Promise<BrigadaDiaria> => {
  const response = await apiClient.post<BrigadaDiaria>('/api/brigadas-dia/', data);
  return response.data;
};

export const updateBrigada = async (id: number, data: BrigadaDiariaCreate): Promise<BrigadaDiaria> => {
  const response = await apiClient.put<BrigadaDiaria>(`/api/brigadas-dia/${id}`, data);
  return response.data;
};

export const deleteBrigada = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/brigadas-dia/${id}`);
};
