import { defineStore } from 'pinia'
import axios from 'axios'
import { ensureAuth, getApi, getStoredAuthToken, resetApiSession, setAuthToken } from '~/utils/api'

const AUTH_USER_KEY = 'nezaleika_auth_user'

export interface AuthUser {
  id: number
  username: string
  first_name: string
  token?: string
}

function readCachedUser(): AuthUser | null {
  if (!import.meta.client) return null
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

function writeCachedUser(user: AuthUser | null) {
  if (!import.meta.client) return
  if (user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  else localStorage.removeItem(AUTH_USER_KEY)
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
    markLoaded() {
      this.loaded = true
    },
    clearSession() {
      this.user = null
      writeCachedUser(null)
    },
    async bootstrap() {
      const token = getStoredAuthToken()
      const cached = readCachedUser()
      if (token && cached) this.user = cached
      await this.fetchMe()
    },
    async fetchMe() {
      const token = getStoredAuthToken()
      if (!token) {
        this.user = null
        this.loaded = true
        return
      }
      try {
        await ensureAuth()
        const { data } = await getApi().get<AuthUser & { notification_prefs?: unknown }>('/api/me')
        this.user = {
          id: data.id,
          username: data.username,
          first_name: data.first_name,
        }
        writeCachedUser(this.user)
      } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status === 401) {
          this.user = null
          resetApiSession()
          writeCachedUser(null)
        } else if (!this.user) {
          const cached = readCachedUser()
          if (cached && token) this.user = cached
        }
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
      writeCachedUser(this.user)
      this.loaded = true
    },
    async logout() {
      try {
        await getApi().post('/api/auth/logout')
      } finally {
        this.user = null
        this.loaded = true
        resetApiSession()
        writeCachedUser(null)
      }
    },
  },
})
