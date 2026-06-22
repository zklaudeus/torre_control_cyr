import { apiClient } from './client';
import type { ReporteCYR, ReporteCYRCreate } from '../types/reporte';
import type { ReporteGerencialData } from '../hooks/useReporteGerencial';

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

export const getReporteGerencial = async (fecha: string, filtro: string = 'Todo'): Promise<ReporteGerencialData> => {
  const response = await apiClient.get<ReporteGerencialData>(`/api/reportes/gerencial/cyr?fecha_operacional=${fecha}&filtro=${filtro}`);
  return response.data;
};
