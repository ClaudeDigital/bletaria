import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
})

// Request interceptor - add JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bletaria_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || ''
      // Don't clear admin token on user auth failure and vice versa
      if (!url.includes('/admin/')) {
        localStorage.removeItem('bletaria_token')
        localStorage.removeItem('bletaria_user')
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

// Admin API instance
export const adminApi = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
})

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('bletaria_admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('bletaria_admin_token')
    }
    return Promise.reject(error)
  }
)

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  me: () => api.get('/auth/me'),
}

// Apiaries (Kopshtet)
export const apiaryAPI = {
  list: () => api.get('/apiaries'),
  get: (id) => api.get(`/apiaries/${id}`),
  create: (data) => api.post('/apiaries', data),
  update: (id, data) => api.put(`/apiaries/${id}`, data),
  delete: (id) => api.delete(`/apiaries/${id}`),
}

// Hives (Koshere)
export const hiveAPI = {
  list: (apiaryId) => api.get(`/hives?apiary_id=${apiaryId}`),
  get: (id) => api.get(`/hives/${id}`),
  create: (data) => api.post('/hives', data),
  update: (id, data) => api.put(`/hives/${id}`, data),
  delete: (id) => api.delete(`/hives/${id}`),
  floors: (id) => api.get(`/hives/${id}/floors`),
  addFloor: (id, data) => api.post(`/hives/${id}/floors`, data),
  updateFloor: (hiveId, floorId, data) => api.put(`/hives/${hiveId}/floors/${floorId}`, data),
  deleteFloor: (hiveId, floorId) => api.delete(`/hives/${hiveId}/floors/${floorId}`),
  visits: (id) => api.get(`/hives/${id}/visits`),
}

// Visits (Vizitat)
export const visitAPI = {
  list: (apiaryId) => api.get(`/visits?apiary_id=${apiaryId}`),
  get: (id) => api.get(`/visits/${id}`),
  create: (data) => api.post('/visits', data),
  update: (id, data) => api.put(`/visits/${id}`, data),
  delete: (id) => api.delete(`/visits/${id}`),
}

// Feeding (Ushqimi)
export const feedingAPI = {
  list: (apiaryId) => api.get(`/feeding?apiary_id=${apiaryId}`),
  get: (id) => api.get(`/feeding/${id}`),
  create: (data) => api.post('/feeding', data),
  update: (id, data) => api.put(`/feeding/${id}`, data),
  delete: (id) => api.delete(`/feeding/${id}`),
}

// Community (Komuniteti)
export const communityAPI = {
  posts: (page = 1) => api.get(`/community/posts?page=${page}`),
  post: (id) => api.get(`/community/posts/${id}`),
  createPost: (data) => api.post('/community/posts', data),
  deletePost: (id) => api.delete(`/community/posts/${id}`),
  likePost: (id) => api.post(`/community/posts/${id}/like`),
  comments: (postId) => api.get(`/community/posts/${postId}/comments`),
  addComment: (postId, data) => api.post(`/community/posts/${postId}/comments`, data),
  deleteComment: (postId, commentId) => api.delete(`/community/posts/${postId}/comments/${commentId}`),
}

// Marketplace
export const marketplaceAPI = {
  listings: (params = {}) => api.get('/marketplace', { params }),
  listing: (id) => api.get(`/marketplace/${id}`),
  create: (data) => api.post('/marketplace', data),
  update: (id, data) => api.put(`/marketplace/${id}`, data),
  delete: (id) => api.delete(`/marketplace/${id}`),
  contact: (id, data) => api.post(`/marketplace/${id}/contact`, data),
}

// AI
export const aiAPI = {
  chat: (data) => api.post('/ai/chat', data),
  usage: () => api.get('/ai/usage'),
}

// News
export const newsAPI = {
  list: (params = {}) => api.get('/news', { params }),
  get: (id) => api.get(`/news/${id}`),
}

// Profile
export const profileAPI = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
  stats: () => api.get('/profile/stats'),
  uploadAvatar: (formData) => api.post('/profile/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
}

// Admin API
export const adminAuthAPI = {
  login: (data) => adminApi.post('/admin/auth/login', data),
  me: () => adminApi.get('/admin/auth/me'),
}

export const adminDataAPI = {
  stats: () => adminApi.get('/admin/stats'),
  users: () => adminApi.get('/admin/users'),
  toggleUser: (id) => adminApi.patch(`/admin/users/${id}/toggle`),
  newsList: () => adminApi.get('/admin/news'),
  createNews: (data) => adminApi.post('/admin/news', data),
  updateNews: (id, data) => adminApi.put(`/admin/news/${id}`, data),
  deleteNews: (id) => adminApi.delete(`/admin/news/${id}`),
  marketplaceList: () => adminApi.get('/admin/marketplace'),
  toggleListing: (id) => adminApi.patch(`/admin/marketplace/${id}/toggle`),
  deleteListing: (id) => adminApi.delete(`/admin/marketplace/${id}`),
}

export default api
