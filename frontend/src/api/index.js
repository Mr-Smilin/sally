import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const url = err.config?.url || ''
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register')
    if (err.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err.response?.data || err)
  }
)

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout').catch(() => {}),
  config: () => api.get('/auth/config'),
}

export const transactionApi = {
  list: (params) => api.get('/transactions', { params }),
  summary: (params) => api.get('/transactions/summary', { params }),
  report: (params) => api.get('/transactions/report', { params }),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
}

export const categoryApi = {
  list: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
}

export const userApi = {
  list: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  updateMe: (data) => api.put('/users/me', data),
  changePassword: (data) => api.put('/users/me/password', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
}

export const preferencesApi = {
  get: () => api.get('/preferences'),
  save: (data) => api.put('/preferences', data),
}

export const monitorApi = {
  logs: (params) => api.get('/monitor', { params }),
  actions: () => api.get('/monitor/actions'),
  ipBlacklist: () => api.get('/monitor/ip-blacklist'),
  banIp: (data) => api.post('/monitor/ip-blacklist', data),
  unbanIp: (ip) => api.delete(`/monitor/ip-blacklist/${encodeURIComponent(ip)}`),
  getSettings: () => api.get('/monitor/settings'),
  saveSettings: (data) => api.put('/monitor/settings', data),
}

export const currencyApi = {
  list: () => api.get('/currencies'),
  create: (data) => api.post('/currencies', data),
  update: (id, data) => api.put(`/currencies/${id}`, data),
  setDefault: (id) => api.put(`/currencies/${id}/default`, {}),
  delete: (id) => api.delete(`/currencies/${id}`),
}

export default api
