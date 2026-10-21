/** Durable client state (localStorage) — survives WebView kill / Telegram mail switch. */

export const DURABLE_STORAGE_PREFIX = 'fintech.durable.v1:'

export type DurableEnvelope<T = unknown> = {
  v: 1
  savedAt: number
  expiresAt: number | null
  value: T
}

export type DurableWriteOptions = {
  ttlMs?: number
  userId?: string | number | null
}

function storageKey(logicalKey: string, userId?: string | number | null): string {
  const base = String(logicalKey || '').trim()
  const uid = userId == null || userId === '' ? '' : String(userId)
  return `${DURABLE_STORAGE_PREFIX}${uid ? `${uid}:` : ''}${base}`
}

function readRaw(storageKeyName: string): string | null {
  if (typeof localStorage === 'undefined') return null
  try {
    return localStorage.getItem(storageKeyName)
  } catch {
    return null
  }
}

function writeRaw(storageKeyName: string, raw: string): boolean {
  if (typeof localStorage === 'undefined') return false
  try {
    localStorage.setItem(storageKeyName, raw)
    return true
  } catch {
    return false
  }
}

function removeRaw(storageKeyName: string): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(storageKeyName)
  } catch {
    // ignore
  }
}

function parseEnvelope<T>(raw: string): DurableEnvelope<T> | null {
  try {
    const parsed = JSON.parse(raw) as DurableEnvelope<T>
    if (!parsed || parsed.v !== 1 || typeof parsed.savedAt !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

export function readDurable<T = string>(
  logicalKey: string,
  options?: { userId?: string | number | null },
): T | null {
  const key = storageKey(logicalKey, options?.userId)
  const raw = readRaw(key)
  if (!raw) return null

  const envelope = parseEnvelope<T>(raw)
  if (!envelope) {
    removeRaw(key)
    return null
  }

  if (envelope.expiresAt != null && Date.now() > envelope.expiresAt) {
    removeRaw(key)
    return null
  }

  return envelope.value as T
}

export function writeDurable<T>(
  logicalKey: string,
  value: T,
  options?: DurableWriteOptions,
): boolean {
  const key = storageKey(logicalKey, options?.userId)
  const savedAt = Date.now()
  const expiresAt =
    options?.ttlMs != null && options.ttlMs > 0 ? savedAt + options.ttlMs : null
  const envelope: DurableEnvelope<T> = {
    v: 1,
    savedAt,
    expiresAt,
    value,
  }
  return writeRaw(key, JSON.stringify(envelope))
}

export function removeDurable(
  logicalKey: string,
  options?: { userId?: string | number | null },
): void {
  removeRaw(storageKey(logicalKey, options?.userId))
}

/** One-shot: copy sessionStorage → durable localStorage if durable empty. */
export function migrateFromSessionStorage(
  sessionKey: string,
  logicalKey: string,
  options?: DurableWriteOptions & { asJson?: boolean },
): boolean {
  if (typeof sessionStorage === 'undefined') return false

  const existing = readDurable(logicalKey, { userId: options?.userId })
  if (existing != null && existing !== '') return false

  let sessionValue: string | null = null
  try {
    sessionValue = sessionStorage.getItem(sessionKey)
  } catch {
    return false
  }
  if (!sessionValue) return false

  if (options?.asJson) {
    try {
      const parsed = JSON.parse(sessionValue) as unknown
      writeDurable(logicalKey, parsed, options)
    } catch {
      writeDurable(logicalKey, sessionValue, options)
    }
  } else {
    writeDurable(logicalKey, sessionValue, options)
  }

  try {
    sessionStorage.removeItem(sessionKey)
  } catch {
    // ignore
  }

  return true
}

export function readDurableString(
  logicalKey: string,
  options?: { userId?: string | number | null },
): string {
  const value = readDurable<string>(logicalKey, options)
  return value == null ? '' : String(value)
}
