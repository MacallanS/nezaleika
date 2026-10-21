<script setup lang="ts">
/**
 * После входа в установленное PWA: если нет кода и Face ID —
 * уводим на настройку (без toast/баннера «Позже»).
 * Авторизация идёт раньше через /auth — этот редирект только после сессии.
 */
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProfileNavigate } from '../../composables/useProfileServices'
import { fetchDeviceUnlockStatus } from '../lib/deviceUnlockApi'
import { DEVICE_UNLOCK_UI_ENABLED, DEVICE_UNLOCK_SETUP_QUERY } from '../lib/deviceUnlockSession'
import { isStandalonePwaClient } from '../lib/pwaClient'

const DEVICE_UNLOCK_PIN_SETUP_PATH = `/profile/security/pin?${DEVICE_UNLOCK_SETUP_QUERY}=1`

const SETUP_PATH_PREFIXES = [
  '/profile/security/pin',
  '/profile/security/biometric',
] as const

const SKIP_PATH_PREFIXES = [
  '/auth',
  '/registration',
  '/forgot_password',
  '/consent',
] as const

const navigateTo = useProfileNavigate()
const router = useRouter()

let checking = false
let stopAfterEach: (() => void) | undefined

function currentPath(): string {
  if (typeof window === 'undefined') return '/'
  return window.location.pathname.replace(/\/+$/, '') || '/'
}

function shouldSkipPath(path: string): boolean {
  return SKIP_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  )
}

function isOnSetupPath(path: string): boolean {
  return SETUP_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  )
}

async function maybeForceSetup(): Promise<void> {
  if (!DEVICE_UNLOCK_UI_ENABLED || !isStandalonePwaClient()) return
  if (checking) return

  const path = currentPath()
  if (shouldSkipPath(path) || isOnSetupPath(path)) return

  checking = true
  try {
    const status = await fetchDeviceUnlockStatus()
    // null → нет сессии / ошибка: сначала обычный auth middleware
    if (!status) return
    if (status.pin_enabled) return
    if (status.biometric_enabled) return

    // Снова проверим путь — пользователь мог уйти на /auth пока ждали API
    const pathNow = currentPath()
    if (shouldSkipPath(pathNow) || isOnSetupPath(pathNow)) return

    await navigateTo(DEVICE_UNLOCK_PIN_SETUP_PATH, { replace: true })
  } finally {
    checking = false
  }
}

onMounted(() => {
  void maybeForceSetup()
  try {
    stopAfterEach = router.afterEach(() => {
      void maybeForceSetup()
    })
  } catch {
    // вне router
  }
})

onUnmounted(() => {
  stopAfterEach?.()
})
</script>

<template>
  <!-- Headless: редирект на настройку кода / Face ID после авторизации в PWA -->
  <span class="profile-device-unlock-setup-redirect" aria-hidden="true" />
</template>

<style scoped>
.profile-device-unlock-setup-redirect {
  display: none !important;
}
</style>
