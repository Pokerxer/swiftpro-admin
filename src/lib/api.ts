import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Token expired or invalid — clear auth and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (username: string, email: string, password: string) =>
    api.post('/auth/register', { username, email, password }),
  me: () => api.get('/auth/me'),
};

export const servicesAPI = {
  getAll: () => api.get('/services'),
  getOne: (id: string) => api.get(`/services/${id}`),
  create: (data: any) => api.post('/services', data),
  update: (id: string, data: any) => api.put(`/services/${id}`, data),
  delete: (id: string) => api.delete(`/services/${id}`),
};

export const projectsAPI = {
  getAll: () => api.get('/projects'),
  getOne: (id: string) => api.get(`/projects/${id}`),
  create: (data: any) => api.post('/projects', data),
  update: (id: string, data: any) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
};

export const postsAPI = {
  getAll: () => api.get('/posts'),
  getOne: (id: string) => api.get(`/posts/${id}`),
  getBySlug: (slug: string) => api.get(`/posts/slug/${slug}`),
  create: (data: any) => api.post('/posts', data),
  update: (id: string, data: any) => api.put(`/posts/${id}`, data),
  delete: (id: string) => api.delete(`/posts/${id}`),
};

export const teamAPI = {
  getAll: () => api.get('/team'),
  getOne: (id: string) => api.get(`/team/${id}`),
  create: (data: any) => api.post('/team', data),
  update: (id: string, data: any) => api.put(`/team/${id}`, data),
  delete: (id: string) => api.delete(`/team/${id}`),
};

export const testimonialsAPI = {
  getAll: () => api.get('/testimonials'),
  getOne: (id: string) => api.get(`/testimonials/${id}`),
  create: (data: any) => api.post('/testimonials', data),
  update: (id: string, data: any) => api.put(`/testimonials/${id}`, data),
  delete: (id: string) => api.delete(`/testimonials/${id}`),
};

export const statsAPI = {
  getAll: () => api.get('/stats'),
  getOne: (id: string) => api.get(`/stats/${id}`),
  create: (data: any) => api.post('/stats', data),
  update: (id: string, data: any) => api.put(`/stats/${id}`, data),
  delete: (id: string) => api.delete(`/stats/${id}`),
};

export const usersAPI = {
  getAll: () => api.get('/users'),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
  updateRole: (id: string, role: string) => api.patch(`/users/${id}/role`, { role }),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export const heroAPI = {
  get: () => api.get('/hero'),
  update: (data: any) => api.put('/hero', data),
};

export const settingsAPI = {
  get: () => api.get('/company'),
  update: (data: any) => api.put('/company', data),
};

export const analyticsAPI = {
  getOverview: (period?: number) => api.get(`/analytics/overview?period=${period || 30}`),
  getHistory: (days?: number) => api.get(`/analytics/history?days=${days || 30}`),
  getToday: () => api.get('/analytics/today'),
  trackView: (path: string) => api.post('/analytics/track/view', { path }),
  trackClick: () => api.post('/analytics/track/click'),
  trackSession: (sessionTime: number, isBounce: boolean) =>
    api.post('/analytics/track/session', { sessionTime, isBounce }),
};

export const partnersAPI = {
  getAll: () => api.get('/partners'),
  getOne: (id: string) => api.get(`/partners/${id}`),
  create: (data: any) => api.post('/partners', data),
  update: (id: string, data: any) => api.patch(`/partners/${id}`, data),
  delete: (id: string) => api.delete(`/partners/${id}`),
};

export default api;