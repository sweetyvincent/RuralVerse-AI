import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT access token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ruralverse_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
    if (!isGitHubPages && error.response?.status === 401) {
      const currentHash = window.location.hash;
      if (!currentHash.includes('/login') && !currentHash.includes('/register')) {
        localStorage.removeItem('ruralverse_token');
        localStorage.removeItem('ruralverse_user');
        window.location.hash = '#/student/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
