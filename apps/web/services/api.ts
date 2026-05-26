import axios from 'axios'
import { API_BASE_URL } from '@/constants'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('cpd-auth')
    if (raw) {
      try {
        const state = JSON.parse(raw) as { state?: { token?: string } }
        const token = state?.state?.token
        if (token) config.headers.Authorization = `Bearer ${token}`
      } catch {
        // ignore malformed storage
      }
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('cpd-auth')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
