import { apiClient } from './client';
import type { ReporteCYR, ReporteCYRCreate } from '../types/reporte';

export const createOrGetReporte = async (data: ReporteCYRCreate): Promise<ReporteCYR> => {
  const response = await apiClient.post<ReporteCYR>('/api/reportes/', data);
  return response.data;
};

export const getReportes = async (): Promise<ReporteCYR[]> => {
  const response = await apiClient.get<ReporteCYR[]>('/api/reportes/');
  return response.data;
};

export const getReporteByFecha = async (fecha: string): Promise<ReporteCYR> => {
  const response = await apiClient.get<ReporteCYR>(`/api/reportes/${fecha}`);
  return response.data;
};
