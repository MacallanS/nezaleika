/**
 * Локальные черновики сканов Реестра (localStorage).
 * Переживают F5 / закрытие вкладки, пока пользователь не отправит или не сбросит.
 */

const PREFIX = "cards.scan.draft.v1."

export function cardsDraftKey(...parts: Array<string | number | null | undefined>): string {
  return PREFIX + parts.map((p) => String(p ?? "_")).join(".")
}

export function loadCardsDraft<T>(key: string): T | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function saveCardsDraft(key: string, value: unknown): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota / private mode */
  }
}

export function clearCardsDraft(key: string): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}
