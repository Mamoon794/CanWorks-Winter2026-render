import axios from 'axios';
import { supabase } from '@/app/lib/supabase';

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
  async (config) => {
    // get the current session token from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    // Don't set Content-Type for FormData - let the browser set it automatically
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
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
    return Promise.reject(error);
  }
);

export { fastAxiosInstance, BASE_URL, isLocalhost };
export default fastAxiosInstance;