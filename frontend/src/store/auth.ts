import { create } from 'zustand'
import axios from 'axios'
import type { User } from '../types/models'

type AuthState = {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  login: (data: { login?: string; email?: string; password: string; otp?: string }) => Promise<void>
  logout: () => Promise<void>
  skip: () => void
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  async login(data) {
    const res = await axios.post('/api/auth/login', data)
    set({ user: res.data.user, accessToken: res.data.accessToken, refreshToken: res.data.refreshToken })
    localStorage.setItem('sm_user', JSON.stringify(res.data.user))
    localStorage.setItem('sm_access', res.data.accessToken)
    localStorage.setItem('sm_refresh', res.data.refreshToken)
  },
  async logout() {
    await axios.post('/api/auth/logout')
    set({ user: null, accessToken: null, refreshToken: null })
    localStorage.removeItem('sm_user')
    localStorage.removeItem('sm_access')
    localStorage.removeItem('sm_refresh')
  },
  skip() {
    set({ user: { id: 'guest', login: 'guest', email: 'guest@example.test', name: 'Guest' }, accessToken: null, refreshToken: null })
  }
}))
