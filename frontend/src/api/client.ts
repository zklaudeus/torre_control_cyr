import axios from 'axios';

export const API_BASE_URL = import.meta.env.DEV
  ? (import.meta.env.VITE_API_URL?.trim() || `http://${window.location.hostname}:8000`).replace(/\/+$/, '')
  : window.location.origin.replace(/\/+$/, '');

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
