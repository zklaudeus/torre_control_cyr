import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

function resolveApiBaseUrl(): string {
  if (configuredApiUrl) {
    // Si la página se sirve en HTTPS pero la URL configurada es HTTP → elevar a HTTPS
    if (window.location.protocol === 'https:' && configuredApiUrl.startsWith('http://')) {
      return configuredApiUrl.replace('http://', 'https://').replace(/\/+$/, '');
    }
    return configuredApiUrl.replace(/\/+$/, '');
  }

  // En desarrollo: apuntar al hostname del navegador (para que funcione desde móvil)
  if (import.meta.env.DEV) {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:8000`;
  }

  // En producción sin VITE_API_URL: usar rutas relativas (nginx proxea /api/)
  return '';
}

export const API_BASE_URL = resolveApiBaseUrl();

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
