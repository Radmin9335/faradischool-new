// src/axiosConfig.js
import axios from 'axios';

// ✅ آدرس Netlify Function
const API_BASE_URL = '/.netlify/functions/api-proxy';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;