import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const devFallback = import.meta.env.DEV ? `http://${window.location.hostname}:8000` : '';
let apiBaseUrl = configuredApiUrl || devFallback;

if (!import.meta.env.DEV && window.location.protocol === 'https:' && apiBaseUrl.startsWith('http://')) {
  apiBaseUrl = '';
}

export const API_BASE_URL = apiBaseUrl.replace(/\/+$/, '');

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
