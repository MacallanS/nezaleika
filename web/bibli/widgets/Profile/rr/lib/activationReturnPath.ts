import {
  migrateFromSessionStorage,
  readDurableString,
  removeDurable,
  writeDurable,
} from 'bibli/shared/storage/clientDurableState'
import { ACTIVATION_HUB_PATH } from './activationHubPath'

const STORAGE_LOGICAL_KEY = 'profile.activation.returnPath'
const STORAGE_SESSION_LEGACY = 'profile.activation.returnPath'
const RETURN_PATH_TTL_MS = 7 * 24 * 60 * 60 * 1000

/** Разрешённые «хабы» заполнения — куда возвращаем из визарда. */
const ALLOWED_RETURN_PATHS = new Set(['/', '/profile', '/profile/activation'])

export function normalizeActivationReturnPath(
  path: string | null | undefined,
): string | null {
  const normalized =
    String(path || '')
      .split('?')[0]
      .replace(/\/+$/, '') || '/'
  return ALLOWED_RETURN_PATHS.has(normalized) ? normalized : null
}

function ensureReturnPathMigrated(): void {
  migrateFromSessionStorage(STORAGE_SESSION_LEGACY, STORAGE_LOGICAL_KEY, {
    ttlMs: RETURN_PATH_TTL_MS,
  })
}

/** Запомнить, откуда открыли шаг (главная candy / /profile/activation). */
export function rememberActivationReturnPath(path?: string | null): void {
  const candidate =
    path ??
    (typeof window !== 'undefined' ? window.location.pathname : '')
  const normalized = normalizeActivationReturnPath(candidate)
  if (!normalized) return
  writeDurable(STORAGE_LOGICAL_KEY, normalized, { ttlMs: RETURN_PATH_TTL_MS })
}

/**
 * Phone и планшет в оболочке (таббар) идут одним режимом, десктоп — шире 1024.
 * Совпадает с DRAWER_MQ в AppNavigationRR.
 */
const PHONE_TABLET_MQ = '(max-width: 1024px)'

/**
 * Куда уходить после успешной отправки шага.
 * На телефоне и планшете /profile — хаб вкладки, список шагов живёт на /profile/activation.
 * На десктопе /profile уже показывает этот список.
 */
export function activationSubmitExitPath(): string {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return '/profile'
  }
  return window.matchMedia(PHONE_TABLET_MQ).matches ? '/profile/activation' : '/profile'
}

/** Куда выходить из визарда (Назад при отклонении / view-only / шаг 1). */
export function readActivationReturnPath(
  fallback: string = ACTIVATION_HUB_PATH,
): string {
  ensureReturnPathMigrated()
  const raw = readDurableString(STORAGE_LOGICAL_KEY)
  return normalizeActivationReturnPath(raw) || fallback
}

export function clearActivationReturnPath(): void {
  removeDurable(STORAGE_LOGICAL_KEY)
}
