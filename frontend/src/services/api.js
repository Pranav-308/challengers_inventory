import axios from 'axios';

// Use the same host as the frontend for API calls (works for both localhost and network access)
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Use the current hostname so it works from any device
  const hostname = window.location.hostname;
  return `http://${hostname}:5000/api`;
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    // Check both localStorage and sessionStorage for token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (credentials) => api.post('/auth/login', credentials);
export const getMe = () => api.get('/auth/me');
export const register = (userData) => api.post('/auth/register', userData);
export const sendInvite = (data) => api.post('/auth/invite', data);
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const resetPassword = (data) => api.post('/auth/reset-password', data);

// Components
export const getComponents = (params) => api.get('/components', { params });
export const getComponent = (id) => api.get(`/components/${id}`);
export const checkoutComponent = (id, notes) => api.post(`/components/${id}/checkout`, { notes });
export const returnComponent = (id, notes) => api.post(`/components/${id}/return`, { notes });
export const getComponentHistory = (id) => api.get(`/components/${id}/history`);
export const createComponent = (data) => api.post('/components', data);
export const getOverdueComponents = () => api.get('/components/overdue/list');
export const uploadComponentImage = (id, formData) => {
  return api.post(`/components/${id}/upload-image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// Users
export const getAllUsers = () => api.get('/users');
export const getUserBorrowedItems = (id) => api.get(`/users/${id}/borrowed`);
export const getUserHistory = (id) => api.get(`/users/${id}/history`);
export const updateNotificationPreferences = (id, preferences) => 
  api.patch(`/users/${id}/preferences`, preferences);
export const registerUser = (userData) => api.post('/auth/register', userData);
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const updateUserRole = (id, role) => api.patch(`/users/${id}/role`, { role });

// Dashboard
export const getDashboardStats = () => api.get('/dashboard/stats');

// Requests
export const requestComponent = (data) => api.post('/requests', data);
export const getRequests = (params) => api.get('/requests', { params });
export const approveRequest = (id) => api.patch(`/requests/${id}/approve`);
export const rejectRequest = (id, reason) => api.patch(`/requests/${id}/reject`, { reason });
export const cancelRequest = (id) => api.delete(`/requests/${id}`);

export default api;
