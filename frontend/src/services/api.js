// src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  changePassword: (data) => api.post('/auth/change-password', data),
  getProfile: () => api.get('/auth/profile')
};

// Members API
export const membersAPI = {
  getAll: (params) => api.get('/members', { params }),
  getById: (id) => api.get(`/members/${id}`),
  create: (data) => api.post('/members', data),
  update: (id, data) => api.put(`/members/${id}`, data),
  getBalance: (id) => api.get(`/members/${id}/balance`),
  bulkImport: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/members/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// Deductions API
export const deductionsAPI = {
  getAll: (params) => api.get('/deductions', { params }),
  create: (data) => api.post('/deductions', data),
  verify: (deduction_ids) => api.post('/deductions/verify', { deduction_ids }),
  forward: (data) => api.post('/deductions/forward', data),
  approve: (data) => api.post('/deductions/approve', data),
  getSummary: (params) => api.get('/deductions/summary', { params }),
  bulkImport: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/deductions/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// Withdrawals API
export const withdrawalsAPI = {
  getAll: (params) => api.get('/withdrawals', { params }),
  create: (data) => api.post('/withdrawals', data),
  zecApprove: (id, data) => api.post(`/withdrawals/${id}/zec-approve`, data),
  cecApprove: (id, data) => api.post(`/withdrawals/${id}/cec-approve`, data)
};

// Committees API
export const committeesAPI = {
  getAll: () => api.get('/committees')
};

// Reports API
export const reportsAPI = {
  memberBalances: (params) => api.get('/reports/member-balances', { params }),
  pendingVerifications: () => api.get('/reports/pending-verifications'),
  pendingApprovals: () => api.get('/reports/pending-cec-approvals'),
  withdrawalRequests: (params) => api.get('/reports/withdrawal-requests', { params }),
  suspenseBalance: () => api.get('/reports/suspense-balance'),
  committeeSummary: (params) => api.get('/reports/committee-summary', { params }),
  dashboard: () => api.get('/reports/dashboard')
};

export default api;
