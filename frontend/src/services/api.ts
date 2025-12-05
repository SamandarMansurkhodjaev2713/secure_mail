import axios from 'axios'
import { useAuth } from '../store/auth'

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true
})

api.interceptors.request.use((config) => {
  const token = useAuth.getState().accessToken
  if (token) {
    config.headers = config.headers || {}
    ;(config.headers as any).Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      if (isRefreshing) throw error
      isRefreshing = true
      try {
        const refresh = useAuth.getState().refreshToken
        if (!refresh) throw error
        const r = await api.post('/auth/refresh', { refreshToken: refresh })
        useAuth.setState({ accessToken: r.data.accessToken })
        localStorage.setItem('sm_access', r.data.accessToken)
        isRefreshing = false
        const cfg = error.config
        cfg.headers = cfg.headers || {}
        ;(cfg.headers as any).Authorization = `Bearer ${r.data.accessToken}`
        return api.request(cfg)
      } catch (e) {
        isRefreshing = false
        useAuth.getState().logout()
        throw e
      }
    }
    throw error
  }
)
