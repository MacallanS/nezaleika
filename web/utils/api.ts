import axios, { type AxiosInstance } from 'axios'

const AUTH_TOKEN_KEY = 'nezaleika_auth_token'

let client: AxiosInstance | null = null
let csrfReady = false

export function usesTokenAuth(): boolean {
  const config = useRuntimeConfig()
  const base = (config.public.apiBase as string) || ''
  return base.startsWith('http://') || base.startsWith('https://')
}

export function setAuthToken(token: string | null): void {
  if (!import.meta.client) return
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token)
  else localStorage.removeItem(AUTH_TOKEN_KEY)
  const api = getApi()
  if (token) api.defaults.headers.common.Authorization = `Token ${token}`
  else delete api.defaults.headers.common.Authorization
}

export function getStoredAuthToken(): string | null {
  if (!import.meta.client) return null
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function getApi(): AxiosInstance {
  if (!client) {
    const config = useRuntimeConfig()
    client = axios.create({
      baseURL: config.public.apiBase || '',
      withCredentials: !usesTokenAuth(),
      headers: { Accept: 'application/json' },
    })
    const stored = getStoredAuthToken()
    if (stored && usesTokenAuth()) {
      client.defaults.headers.common.Authorization = `Token ${stored}`
    }
  }
  return client
}

export async function ensureCsrf(): Promise<void> {
  if (usesTokenAuth()) return
  if (csrfReady) return
  const api = getApi()
  const { data } = await api.get<{ csrfToken: string }>('/api/csrf/')
  api.defaults.headers.common['X-CSRFToken'] = data.csrfToken
  csrfReady = true
}

/** CSRF for same-origin dev; Bearer token for GitHub Pages + remote API. */
export async function ensureAuth(): Promise<void> {
  if (usesTokenAuth()) {
    const t = getStoredAuthToken()
    if (t) getApi().defaults.headers.common.Authorization = `Token ${t}`
    return
  }
  await ensureCsrf()
}

export function resetApiSession(): void {
  csrfReady = false
  setAuthToken(null)
}
