/** Сессия локального замка PWA (Face ID / PIN): grace после unlock / cold start. */

/**
 * Мастер-флаг: секретный код + Face ID / gate в PWA.
 */
export const DEVICE_UNLOCK_UI_ENABLED = true

/**
 * Пункт «Авторизованные устройства» в безопасности и страница /profile/security/devices.
 */
export const AUTHORIZED_DEVICES_UI_ENABLED = true

/** Сколько можно не спрашивать код после unlock (и при cold start). */
export const DEVICE_UNLOCK_GRACE_MS = 15 * 60 * 1000

/** @deprecated legacy sessionStorage flag — не считается валидным unlock */
const LEGACY_SESSION_KEY = 'device_unlock_session_ok'
const SESSION_KEY_V2 = 'device_unlock_session_v2'
const STEPUP_PREFIX = 'device_unlock_stepup:'

/** Query `?setup=1` — обязательный онбординг после первого входа / сброса в PWA. */
export const DEVICE_UNLOCK_SETUP_QUERY = 'setup'

/** Повторный запрос только на этих путях (step-up), не при каждом возврате из фона. */
export const DEVICE_UNLOCK_SENSITIVE_PREFIXES = [
  '/profile/security/password',
] as const

type UnlockSessionPayload = {
  expiresAt: number
}

export function isDeviceUnlockSetupQuery(
  query: Record<string, unknown> | undefined | null,
): boolean {
  if (!query) return false
  const raw = query[DEVICE_UNLOCK_SETUP_QUERY]
  const value = Array.isArray(raw) ? raw[0] : raw
  return value === '1' || value === 1 || value === true
}

function readPayload(): UnlockSessionPayload | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY_V2)
    if (!raw) return null
    let parsed: unknown
    try {
      parsed = JSON.parse(raw) as unknown
    } catch {
      removePayload()
      return null
    }
    if (!parsed || typeof parsed !== 'object') {
      removePayload()
      return null
    }
    const expiresAt = Number((parsed as UnlockSessionPayload).expiresAt)
    if (!Number.isFinite(expiresAt)) {
      removePayload()
      return null
    }
    return { expiresAt }
  } catch {
    return null
  }
}

function writePayload(payload: UnlockSessionPayload): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SESSION_KEY_V2, JSON.stringify(payload))
  } catch {
    // ignore
  }
}

function removePayload(): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(SESSION_KEY_V2)
  } catch {
    // ignore
  }
}

function removeLegacySessionFlag(): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.removeItem(LEGACY_SESSION_KEY)
  } catch {
    // ignore
  }
}

function clearStepUpKeys(): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    const toRemove: string[] = []
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i)
      if (key?.startsWith(STEPUP_PREFIX)) toRemove.push(key)
    }
    toRemove.forEach((key) => sessionStorage.removeItem(key))
  } catch {
    // ignore
  }
}

/**
 * Активна ли grace-сессия unlock.
 * Просроченные / битые данные чистятся. expiresAt дальше now+GRACE clamp’ится
 * (защита от ухода часов устройства назад).
 */
export function isDeviceUnlockSessionActive(): boolean {
  const payload = readPayload()
  if (!payload) return false

  const now = Date.now()
  const maxExpiresAt = now + DEVICE_UNLOCK_GRACE_MS
  const expiresAt = Math.min(payload.expiresAt, maxExpiresAt)

  if (expiresAt !== payload.expiresAt) {
    writePayload({ expiresAt })
  }

  if (expiresAt <= now) {
    removePayload()
    removeLegacySessionFlag()
    return false
  }

  return true
}

export function markDeviceUnlockSession(): void {
  const expiresAt = Date.now() + DEVICE_UNLOCK_GRACE_MS
  writePayload({ expiresAt })
  removeLegacySessionFlag()
}

export function clearDeviceUnlockSession(): void {
  removePayload()
  removeLegacySessionFlag()
  clearStepUpKeys()
}

export function isSensitiveUnlockPath(pathRaw: string): boolean {
  const path = String(pathRaw || '').replace(/\/+$/, '') || '/'
  return DEVICE_UNLOCK_SENSITIVE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  )
}

export function isDeviceUnlockStepUpDone(pathRaw: string): boolean {
  if (typeof sessionStorage === 'undefined') return false
  const path = String(pathRaw || '').replace(/\/+$/, '') || '/'
  try {
    return sessionStorage.getItem(`${STEPUP_PREFIX}${path}`) === '1'
  } catch {
    return false
  }
}

export function markDeviceUnlockStepUp(pathRaw: string): void {
  if (typeof sessionStorage === 'undefined') return
  const path = String(pathRaw || '').replace(/\/+$/, '') || '/'
  try {
    sessionStorage.setItem(`${STEPUP_PREFIX}${path}`, '1')
  } catch {
    // ignore
  }
}
