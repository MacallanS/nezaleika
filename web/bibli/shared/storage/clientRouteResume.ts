import {
  readDurable,
  removeDurable,
  writeDurable,
} from './clientDurableState'

export const LAST_APP_ROUTE_KEY = 'app.lastRoute'
export const LAST_APP_ROUTE_TTL_MS = 2 * 60 * 60 * 1000

export type StoredAppRoute = {
  path: string
  query: Record<string, string | string[]>
  hash: string
  updatedAt: number
}

const RESUME_ENTRY_PATHS = new Set(['/', '/profile/activation'])

const RESUMABLE_PREFIXES = [
  '/profile/',
  '/registration',
  '/onboarding',
  '/dismissal',
  '/consent',
  '/forgot_password',
] as const

function normalizePath(path: string): string {
  return String(path || '').split('?')[0].replace(/\/+$/, '') || '/'
}

export function isRouteResumable(path: string): boolean {
  const normalized = normalizePath(path)
  if (normalized === '/registration') return true
  return RESUMABLE_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(prefix),
  )
}

export function isResumeEntryPath(path: string): boolean {
  return RESUME_ENTRY_PATHS.has(normalizePath(path))
}

export function saveLastAppRoute(route: {
  path: string
  query?: Record<string, unknown>
  hash?: string
}): void {
  if (!isRouteResumable(route.path)) return
  const query: Record<string, string | string[]> = {}
  if (route.query) {
    for (const [key, value] of Object.entries(route.query)) {
      if (value == null) continue
      if (Array.isArray(value)) {
        query[key] = value.map((v) => String(v))
      } else {
        query[key] = String(value)
      }
    }
  }
  const payload: StoredAppRoute = {
    path: normalizePath(route.path),
    query,
    hash: String(route.hash || ''),
    updatedAt: Date.now(),
  }
  writeDurable(LAST_APP_ROUTE_KEY, payload, { ttlMs: LAST_APP_ROUTE_TTL_MS })
}

export function readLastAppRoute(): StoredAppRoute | null {
  const raw = readDurable<StoredAppRoute>(LAST_APP_ROUTE_KEY)
  if (!raw?.path || !raw.updatedAt) return null
  if (Date.now() - raw.updatedAt > LAST_APP_ROUTE_TTL_MS) {
    removeDurable(LAST_APP_ROUTE_KEY)
    return null
  }
  if (!isRouteResumable(raw.path)) return null
  return raw
}

export function clearLastAppRoute(): void {
  removeDurable(LAST_APP_ROUTE_KEY)
}

export function shouldRestoreLastRoute(currentPath: string): StoredAppRoute | null {
  if (!isResumeEntryPath(currentPath)) return null
  const stored = readLastAppRoute()
  if (!stored) return null
  if (normalizePath(stored.path) === normalizePath(currentPath)) return null
  return stored
}
