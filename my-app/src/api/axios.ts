import axios from 'axios'

export const API_BASE_URL = 'http://localhost:8080'

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

// Tự động gắn token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token'); 
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const message = String(error?.response?.data ?? '')

    if (
      status === 401 &&
      message.toLowerCase().includes('khóa') &&
      window.location.pathname !== '/login'
    ) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }

    return Promise.reject(error)
  },
)

export function getMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${API_BASE_URL}${path}`
}

export default api
