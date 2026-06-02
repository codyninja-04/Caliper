import axios from 'axios';
import { supabase } from './supabaseClient';

// Shared axios instance for the Express API. Every request gets the current
// Supabase JWT attached so the server's authMiddleware can verify it.
const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 30000, // generous — Render free tier cold start can take ~30s
});

http.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize errors to a thrown Error with a readable message.
http.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.error || error.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

export default http;
