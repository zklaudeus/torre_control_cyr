import { apiClient } from './client';

export interface HealthResponse {
  status: string;
  service: string;
}

export const checkHealth = async (): Promise<HealthResponse> => {
  const response = await apiClient.get<HealthResponse>('/api/health');
  return response.data;
};
