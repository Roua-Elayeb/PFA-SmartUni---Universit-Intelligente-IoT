// src/api/index.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.100.43:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Intercepteur : injecte le token JWT automatiquement
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── AUTH ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  getProfile: () => api.get('/auth/profile'),
};

// ── SENSORS ──────────────────────────────────────────────────────────────────
export const sensorAPI = {
  getAll: () => api.get('/sensors'),
  getLatest: () => api.get('/sensors/latest'),
  getByType: (type) => api.get(`/sensors/${type}`),
  add: (data) => api.post('/sensors', data),
};

// ── ROOMS ─────────────────────────────────────────────────────────────────────
export const roomAPI = {
  getAll: () => api.get('/rooms'),
  reserve: (id, data) => api.post(`/rooms/${id}/reserve`, data),
  cancel: (id) => api.put(`/rooms/${id}/cancel`),
  getReservations: (id) => api.get(`/rooms/${id}/reservations`),
};

// ── PARKING ───────────────────────────────────────────────────────────────────
export const parkingAPI = {
  getAll: () => api.get('/parking'),
  getByFloor: (floor) => api.get(`/parking/floor/${floor}`),
  reserve: (id, reservedUntil) => api.post(`/parking/${id}/reserve`, { reservedUntil }),
  cancel: (id) => api.put(`/parking/${id}/cancel`),
};

// ── ALERTS ────────────────────────────────────────────────────────────────────
export const alertAPI = {
  getAll: () => api.get('/alerts'),
  create: (data) => api.post('/alerts', data),
  markRead: (id) => api.put(`/alerts/${id}/read`),
  triggerAlarm: (message) => api.post('/alerts/alarm', { message }),
};

export default api;