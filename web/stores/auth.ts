import { defineStore } from 'pinia'
import { ensureAuth, getApi, resetApiSession, setAuthToken } from '~/utils/api'

export interface AuthUser {
  id: number
  username: string
  first_name: string
  token?: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AuthUser | null,
    loaded: false,
  }),
  getters: {
    isAuthenticated: (s) => !!s.user,
  },
  actions: {
    async fetchMe() {
      try {
        await ensureAuth()
        const { data } = await getApi().get<AuthUser & { notification_prefs?: unknown }>('/api/me')
        this.user = {
          id: data.id,
          username: data.username,
          first_name: data.first_name,
        }
      } catch {
        this.user = null
      } finally {
        this.loaded = true
      }
    },
    async login(username: string, password: string) {
      await ensureAuth()
      const { data } = await getApi().post<AuthUser>('/api/auth/login', { username, password })
      if (data.token) setAuthToken(data.token)
      this.user = {
        id: data.id,
        username: data.username,
        first_name: data.first_name,
      }
    },
    async logout() {
      try {
        await getApi().post('/api/auth/logout')
      } finally {
        this.user = null
        resetApiSession()
      }
    },
  },
})
