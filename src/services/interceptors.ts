import { apiClient } from './apiClient'
import { STORAGE_KEYS } from '@/utils/constants'

// Request interceptor: attach auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isSharedRoute = window.location.pathname.startsWith('/shared/')
      if (!isSharedRoute) {
        localStorage.removeItem(STORAGE_KEYS.TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER)
        window.location.href = '/login'
      }
    }
    console.error('[API Error]', error.response?.data || error.message)
    return Promise.reject(error)
  }
)
