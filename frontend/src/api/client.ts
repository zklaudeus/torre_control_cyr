import axios from 'axios';

const resolveBaseUrl = () => {
  if (import.meta.env.DEV) {
    const url = (import.meta.env.VITE_API_URL?.trim() || `http://${window.location.hostname}:8000`).replace(/\/+$/, '');
    return url;
  }
  return 'https://' + window.location.host;
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
