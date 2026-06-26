import axios from 'axios';

const resolveBaseUrl = () => {
  // En producción usamos URLs relativas (/api/...). Así el mismo origen HTTPS
  // y el proxy de Nginx resuelven la API sin riesgo de Mixed Content.
  if (!import.meta.env.DEV) return '';

  const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
  const localApiUrl = `http://${window.location.hostname}:8000`;
  return (configuredApiUrl || localApiUrl).replace(/\/+$/, '');
};

export const API_BASE_URL = resolveBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('torreControlToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('torreControlToken');
      localStorage.removeItem('torreControlUser');
      window.location.hash = '#/login';
    }
    return Promise.reject(error);
  }
);
