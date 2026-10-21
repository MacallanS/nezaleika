import { computed, inject, type ComputedRef } from 'vue'
import {
  PROFILE_API_KEY,
  PROFILE_LEGACY_EXTRAS_KEY,
  PROFILE_NAVIGATE_KEY,
  type ProfileApi,
  type ProfileLegacyExtras,
  type ProfileNavigate,
} from '../types'

export function useProfileApi(): ProfileApi {
  const api = inject(PROFILE_API_KEY, null)
  if (!api) {
    throw new Error(
      '[bibli/Profile] ProfileApi is not provided. Call provide(PROFILE_API_KEY, …) in the host app.',
    )
  }
  return api
}

export function useProfileNavigate(): ProfileNavigate {
  const navigate = inject(PROFILE_NAVIGATE_KEY, null)
  if (!navigate) {
    throw new Error(
      '[bibli/Profile] ProfileNavigate is not provided. Call provide(PROFILE_NAVIGATE_KEY, …) in the host app.',
    )
  }
  return navigate
}

export function useProfileLegacyExtras(): ProfileLegacyExtras {
  const extras = inject(PROFILE_LEGACY_EXTRAS_KEY, null)
  if (!extras) {
    throw new Error(
      '[bibli/Profile] ProfileLegacyExtras is not provided. Call provide(PROFILE_LEGACY_EXTRAS_KEY, …) in the host app.',
    )
  }
  return extras
}

/** Same host check as fintech useYandexHost — kept local so legacy stays app-free. */
export function useProfileYandexHost(): { isYandexHost: ComputedRef<boolean> } {
  const isYandexHost = computed(() => {
    if (typeof window === 'undefined') return false
    return window.location.host.includes('yandex.')
  })
  return { isYandexHost }
}
