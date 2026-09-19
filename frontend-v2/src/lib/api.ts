import axios from 'axios';

function getApiBase() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, '').endsWith('/api') ? configured.replace(/\/$/, '') : `${configured.replace(/\/$/, '')}/api`;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return `http://${host}:8000/api`;
  }
  // Production must provide NEXT_PUBLIC_API_URL. Never guess a LAN/localhost backend.
  return '/api';
}

const api = axios.create({ baseURL: getApiBase(), timeout: 15000 });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('emefast_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
