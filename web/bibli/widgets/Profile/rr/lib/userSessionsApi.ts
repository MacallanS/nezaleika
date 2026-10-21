import { profileAuthFetch, profileCsrfHeaders } from './profileAuthFetch'

export type SecurityDeviceSession = {
  id: string
  name: string
  browser: string
  subtitle: string
  isCurrent?: boolean
  lastSeen?: string
  location?: string
  icon: 'phone' | 'laptop'
}

type ApiSession = {
  id: string
  name: string
  browser: string
  subtitle: string
  is_current?: boolean
  last_seen?: string | null
  last_seen_at?: string | null
  location?: string | null
  icon?: 'phone' | 'laptop'
}

type ApiErrorBody = {
  status?: boolean
  data?: string | unknown
  message?: string
  errors?: Record<string, string[] | string>
}

function hasXsrfCookie(): boolean {
  if (typeof document === 'undefined') return false
  return /(?:^|;\s*)XSRF-TOKEN=/.test(document.cookie)
}

async function ensureCsrfCookie(): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    await profileAuthFetch('/api/auth/csrf')
  } catch {
    // ignore
  }
}

function errorFromBody(body: ApiErrorBody | null, status: number): string {
  if (body && typeof body.data === 'string' && body.data.trim()) return body.data
  if (body && typeof body.message === 'string' && body.message.trim()) return body.message
  if (body?.errors && typeof body.errors === 'object') {
    const first = Object.values(body.errors).flat()[0]
    if (typeof first === 'string' && first.trim()) return first
  }
  if (status === 419) return 'Сессия устарела. Обновите страницу'
  if (status === 401 || status === 403) return 'Нужно войти в аккаунт заново'
  return 'Не удалось выполнить запрос'
}

function mapSession(row: ApiSession): SecurityDeviceSession {
  return {
    id: String(row.id),
    name: row.name || 'Устройство',
    browser: row.browser || 'Браузер',
    subtitle: row.subtitle || '',
    isCurrent: Boolean(row.is_current),
    lastSeen: row.last_seen || undefined,
    location: row.location || undefined,
    icon: row.icon === 'phone' ? 'phone' : 'laptop',
  }
}

async function requestJson<T>(
  path: string,
  init: RequestInit = {},
  retried = false,
): Promise<{ data: T | null; error: string | null }> {
  const method = (init.method || 'GET').toUpperCase()
  try {
    if ((method === 'POST' || method === 'DELETE' || method === 'PUT' || method === 'PATCH') && !hasXsrfCookie()) {
      await ensureCsrfCookie()
    }

    const response = await profileAuthFetch(path, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...profileCsrfHeaders(),
        ...(init.headers as Record<string, string> | undefined),
      },
    })

    if (response.status === 419 && method !== 'GET' && !retried) {
      await ensureCsrfCookie()
      return requestJson<T>(path, init, true)
    }

    let body: ({ status?: boolean; data?: T } & ApiErrorBody) | null = null
    try {
      body = (await response.json()) as { status?: boolean; data?: T } & ApiErrorBody
    } catch {
      body = null
    }

    if (!response.ok || body?.status === false) {
      return { data: null, error: errorFromBody(body, response.status) }
    }

    if (body?.status && body.data !== undefined) {
      return { data: body.data as T, error: null }
    }

    return { data: null, error: errorFromBody(body, response.status) }
  } catch {
    return { data: null, error: 'Нет сети или сервер не ответил' }
  }
}

export async function fetchUserSessions(): Promise<{
  sessions: SecurityDeviceSession[]
  error: string | null
}> {
  const result = await requestJson<ApiSession[]>('/api/user/sessions')
  if (!result.data) {
    return { sessions: [], error: result.error || 'Не удалось загрузить устройства' }
  }
  return {
    sessions: result.data.map(mapSession),
    error: null,
  }
}

export async function revokeUserSession(sessionId: string): Promise<{
  sessions: SecurityDeviceSession[] | null
  error: string | null
}> {
  await ensureCsrfCookie()
  const result = await requestJson<ApiSession[]>(
    `/api/user/sessions/${encodeURIComponent(sessionId)}`,
    { method: 'DELETE' },
  )
  if (!result.data) {
    return { sessions: null, error: result.error || 'Не удалось завершить сеанс' }
  }
  return { sessions: result.data.map(mapSession), error: null }
}

export async function revokeOtherUserSessions(): Promise<{
  sessions: SecurityDeviceSession[] | null
  revoked: number
  error: string | null
}> {
  await ensureCsrfCookie()
  const result = await requestJson<{ revoked: number; sessions: ApiSession[] }>(
    '/api/user/sessions/others',
    { method: 'DELETE' },
  )
  if (!result.data) {
    return { sessions: null, revoked: 0, error: result.error || 'Не удалось завершить сеансы' }
  }
  return {
    sessions: (result.data.sessions || []).map(mapSession),
    revoked: Number(result.data.revoked) || 0,
    error: null,
  }
}
