import { profileAuthFetch, profileCsrfHeaders } from './profileAuthFetch'

export type DeviceUnlockStatus = {
  pin_enabled: boolean
  biometric_enabled: boolean
  has_device_token: boolean
  credential_id?: string | null
  user_id?: number | null
  pin_locked_until?: string | null
}

type ApiErrorBody = {
  status?: boolean
  data?: string
  locked_until?: string | null
  message?: string
  errors?: Record<string, string[] | string>
  debug?: string
}

function hasXsrfCookie(): boolean {
  if (typeof document === 'undefined') return false
  return /(?:^|;\s*)XSRF-TOKEN=/.test(document.cookie)
}

/** BFF: обновить XSRF перед POST, иначе 419 → «Не удалось подготовить Face ID». */
async function ensureCsrfCookie(): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    await profileAuthFetch('/api/auth/csrf')
  } catch {
    // ignore — ниже уйдёт обычный запрос
  }
}

function isMutating(method?: string): boolean {
  const m = (method || 'GET').toUpperCase()
  return m === 'POST' || m === 'PUT' || m === 'PATCH' || m === 'DELETE'
}

function errorFromBody(body: ApiErrorBody | null, status: number): string | null {
  if (!body) {
    if (status === 419) return 'Сессия устарела. Обновите страницу и попробуйте снова'
    if (status === 401 || status === 403) return 'Нужно войти в аккаунт заново'
    return null
  }
  if (typeof body.data === 'string' && body.data.trim()) {
    return body.debug ? `${body.data} (${body.debug})` : body.data
  }
  if (typeof body.message === 'string' && body.message.trim()) return body.message
  if (body.errors && typeof body.errors === 'object') {
    const first = Object.values(body.errors).flat()[0]
    if (typeof first === 'string' && first.trim()) return first
  }
  if (status === 419) return 'Сессия устарела. Обновите страницу и попробуйте снова'
  return null
}

/** Хост SPA для WebAuthn rpId (не Host API за BFF-прокси). */
export function clientWebAuthnRpId(): string {
  if (typeof window === 'undefined') return ''
  return window.location.hostname
}

async function requestJson<T>(
  path: string,
  init: RequestInit = {},
  retried = false,
): Promise<{ data: T | null; error: string | null; lockedUntil: string | null; status: number }> {
  const method = init.method || 'GET'

  try {
    if (isMutating(method) && !hasXsrfCookie()) {
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

    if (response.status === 419 && isMutating(method) && !retried) {
      await ensureCsrfCookie()
      return requestJson<T>(path, init, true)
    }

    let body: ({ status?: boolean; data?: T } & ApiErrorBody) | null = null
    try {
      body = (await response.json()) as { status?: boolean; data?: T } & ApiErrorBody
    } catch {
      body = null
    }

    if (!response.ok) {
      return {
        data: null,
        error: errorFromBody(body, response.status),
        lockedUntil: body?.locked_until ?? null,
        status: response.status,
      }
    }

    if (body?.status && body.data !== undefined) {
      return { data: body.data as T, error: null, lockedUntil: null, status: response.status }
    }

    return {
      data: null,
      error: errorFromBody(body, response.status) || 'Пустой ответ сервера',
      lockedUntil: null,
      status: response.status,
    }
  } catch {
    return { data: null, error: 'Нет сети или сервер не ответил', lockedUntil: null, status: 0 }
  }
}

export async function fetchDeviceUnlockStatus(): Promise<DeviceUnlockStatus | null> {
  const result = await requestJson<DeviceUnlockStatus>('/api/user/device-unlock')
  return result.data
}

export async function saveDeviceUnlockPin(
  pin: string,
  currentPin?: string | null,
): Promise<{ data: DeviceUnlockStatus | null; error: string | null; lockedUntil: string | null }> {
  const body: Record<string, string> = { pin }
  if (currentPin) body.current_pin = currentPin

  const result = await requestJson<DeviceUnlockStatus>('/api/user/device-unlock/pin', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return {
    data: result.data,
    error: result.error,
    lockedUntil: result.lockedUntil,
  }
}

export async function fetchBiometricRegistrationOptions(
  replace = false,
): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
  // Всегда освежаем CSRF перед Face ID options — частая причина 419 в PWA.
  await ensureCsrfCookie()
  const result = await requestJson<Record<string, unknown>>(
    '/api/user/device-unlock/biometric/register/options',
    {
      method: 'POST',
      body: JSON.stringify({ replace, rp_id: clientWebAuthnRpId() }),
    },
  )
  return {
    data: result.data,
    error: result.error || (result.data ? null : 'Не удалось подготовить биометрию'),
  }
}

export async function registerDeviceUnlockBiometric(
  credential: Record<string, unknown>,
): Promise<{ data: DeviceUnlockStatus | null; error: string | null }> {
  await ensureCsrfCookie()
  const result = await requestJson<DeviceUnlockStatus>(
    '/api/user/device-unlock/biometric/register',
    {
      method: 'POST',
      body: JSON.stringify({ credential, rp_id: clientWebAuthnRpId() }),
    },
  )
  return { data: result.data, error: result.error }
}

export async function fetchBiometricAssertionOptions(): Promise<{
  data: Record<string, unknown> | null
  error: string | null
}> {
  await ensureCsrfCookie()
  const result = await requestJson<Record<string, unknown>>(
    '/api/user/device-unlock/biometric/assert/options',
    {
      method: 'POST',
      body: JSON.stringify({ rp_id: clientWebAuthnRpId() }),
    },
  )
  return { data: result.data, error: result.error }
}

export async function verifyDeviceUnlockBiometric(
  credential: Record<string, unknown>,
): Promise<{ data: DeviceUnlockStatus | null; error: string | null }> {
  await ensureCsrfCookie()
  const result = await requestJson<DeviceUnlockStatus>(
    '/api/user/device-unlock/biometric/verify',
    {
      method: 'POST',
      body: JSON.stringify({ credential, rp_id: clientWebAuthnRpId() }),
    },
  )
  return { data: result.data, error: result.error }
}

export async function disableDeviceUnlockBiometric(): Promise<DeviceUnlockStatus | null> {
  const result = await requestJson<DeviceUnlockStatus>('/api/user/device-unlock/biometric', {
    method: 'DELETE',
  })
  return result.data
}

export type VerifyPinResult = {
  ok: boolean
  lockedUntil: string | null
  error: string | null
}

export async function verifyDeviceUnlockPin(pin: string): Promise<VerifyPinResult> {
  await ensureCsrfCookie()
  const result = await requestJson<DeviceUnlockStatus>('/api/user/device-unlock/verify', {
    method: 'POST',
    body: JSON.stringify({ pin }),
  })

  const ok = Boolean(result.data) && !result.error && result.status >= 200 && result.status < 300

  return {
    ok,
    lockedUntil: result.lockedUntil,
    error: result.error,
  }
}
