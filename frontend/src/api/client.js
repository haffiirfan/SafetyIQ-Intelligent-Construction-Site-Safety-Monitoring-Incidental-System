// ══════════════════════════════════════════
// api/client.js — Axios base configuration
// ══════════════════════════════════════════
import axios from 'axios'

const API_BASE = 'http://127.0.0.1:8000/api/v1'

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
})

// Attach JWT token to every request automatically
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto logout on 401
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (username, password) => {
    const form = new FormData()
    form.append('username', username)
    form.append('password', password)
    return axios.post(`${API_BASE}/auth/login`, form)
  },
  me: () => client.get('/auth/me')
}

export const camerasAPI = {
  getAll:  ()       => client.get('/cameras'),
  create:  (data)   => client.post('/cameras', data),
  delete:  (id)     => client.delete(`/cameras/${id}`)
}

export const detectionsAPI = {
  getAll:  (params) => client.get('/detections', { params }),
  getStats: ()      => client.get('/detections/stats')
}

export const violationsAPI = {
  getAll:    (params) => client.get('/violations', { params }),
  resolve:   (id)     => client.put(`/violations/${id}/resolve`),
  getHeatmap: ()      => client.get('/violations/heatmap')
}

export const reportsAPI = {
  getAll:  ()     => client.get('/reports'),
  getOne:  (id)   => client.get(`/reports/${id}`)
}

export const queryAPI = {
  ask: (question) => client.post('/query', { question })
}

export default client