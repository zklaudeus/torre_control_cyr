import { apiClient } from './client';
import type { UserRole } from '../auth/AuthContext';

export interface AdminUser {
  id: number;
  nombre: string;
  usuario: string;
  email: string | null;
  rol: UserRole;
  activo: boolean;
  supervisor_id: number | null;
  zonas_asignadas: string[];
  created_at: string | null;
  updated_at: string | null;
}

export interface AdminUserPayload {
  nombre: string;
  usuario: string;
  email?: string | null;
  rol: UserRole;
  activo: boolean;
  zonas_asignadas: string[];
  password_temporal?: string;
}

export const getAdminZones = async (): Promise<string[]> => {
  const { data } = await apiClient.get<string[]>('/api/admin/zones');
  return data;
};

export const getAdminUsers = async (): Promise<AdminUser[]> => {
  const { data } = await apiClient.get<AdminUser[]>('/api/admin/users');
  return data;
};

export const createAdminUser = async (payload: AdminUserPayload): Promise<AdminUser> => {
  const { data } = await apiClient.post<AdminUser>('/api/admin/users', payload);
  return data;
};

export const updateAdminUser = async (id: number, payload: Partial<AdminUserPayload>): Promise<AdminUser> => {
  const { data } = await apiClient.put<AdminUser>(`/api/admin/users/${id}`, payload);
  return data;
};

export const updateAdminUserStatus = async (id: number, activo: boolean): Promise<AdminUser> => {
  const { data } = await apiClient.patch<AdminUser>(`/api/admin/users/${id}/status`, { activo });
  return data;
};

