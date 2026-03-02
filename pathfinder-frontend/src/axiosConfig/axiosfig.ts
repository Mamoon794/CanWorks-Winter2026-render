import axios from 'axios';

// Determine if we're running in development/localhost mode
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || 
   window.location.hostname === '127.0.0.1' || 
   window.location.hostname === '::1' ||
   process.env.NODE_ENV === 'development');

// Set base URL based on environment
const BASE_URL = isLocalhost 
  ? 'http://127.0.0.1:8000'
  : 'https://canworks-winter2026-render.onrender.com';

// Create axios instance with base configuration
const fastAxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, 
  headers: {
    'Content-Type': 'application/json',
  },
});


fastAxiosInstance.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
fastAxiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
      }
    }
    return Promise.reject(error);
  }
);

export { fastAxiosInstance, BASE_URL, isLocalhost };
export default fastAxiosInstance;