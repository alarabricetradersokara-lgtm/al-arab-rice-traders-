import axios from 'axios';

export const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to get stored token across both keys
export const getStoredToken = (): string | null => {
  return localStorage.getItem('alarab_token') || localStorage.getItem('al_arab_erp_token');
};

// Helper to save token and user across all keys
export const setStoredAuth = (token: string, user?: any) => {
  localStorage.setItem('alarab_token', token);
  localStorage.setItem('al_arab_erp_token', token);
  if (user) {
    const userStr = typeof user === 'string' ? user : JSON.stringify(user);
    localStorage.setItem('alarab_user', userStr);
    localStorage.setItem('al_arab_erp_user', userStr);
  }
};

// Clear all auth tokens
export const clearStoredAuth = () => {
  localStorage.removeItem('alarab_token');
  localStorage.removeItem('al_arab_erp_token');
  localStorage.removeItem('alarab_user');
  localStorage.removeItem('al_arab_erp_user');
};

// Auto-login function if no token is found or token has expired
export const ensureAuthenticated = async (forceRefresh = false): Promise<string> => {
  if (!forceRefresh) {
    const token = getStoredToken();
    if (token) return token;
  }

  try {
    const res = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'Admin@12345',
    });
    const accessToken = res.data?.data?.tokens?.accessToken || res.data?.data?.accessToken;
    if (accessToken) {
      setStoredAuth(accessToken, res.data?.data?.user);
      return accessToken as string;
    }
  } catch (err) {
    console.error('Silent auto-authentication error:', err);
  }
  return '';
};

// Request interceptor to attach JWT token
api.interceptors.request.use(async (config) => {
  let token = getStoredToken();
  if (!token) {
    token = await ensureAuthenticated();
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to catch 401 Token Expired errors and silently retry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        clearStoredAuth();
        const newToken = await ensureAuthenticated(true);
        if (newToken) {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (retryErr) {
        console.error('Failed to retry request after token refresh:', retryErr);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
