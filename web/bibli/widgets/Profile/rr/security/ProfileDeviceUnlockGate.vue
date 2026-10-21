<template>
  <div
    v-if="locked"
    class="profile-device-unlock-gate"
    role="dialog"
    aria-modal="true"
    aria-label="Разблокировка приложения"
  >
    <div class="profile-device-unlock-gate__paint" aria-hidden="true" />

    <!--
      Экран кода всегда виден.
      Face ID стартует сам поверх (системный диалог); отмена → ввод кода.
      Иконка слева внизу — повторный Face ID.
    -->
    <div class="profile-pin profile-pin--entry">
      <header class="profile-pin__header profile-device-unlock-gate__header">
        <button
          v-if="legacyExtras?.logoutGlobal"
          type="button"
          class="profile-device-unlock-gate__logout"
          :disabled="logoutBusy || pinBusy"
          @click="onLogout"
        >
          Выйти из аккаунта
        </button>
      </header>
      <div class="profile-pin__main">
        <h1 class="profile-pin__title">{{ title }}</h1>
        <div
          class="profile-pin__dots"
          :class="{
            'profile-pin__dots--error': pinError,
            'profile-pin__dots--busy': pinBusy,
          }"
          aria-hidden="true"
        >
          <span
            v-for="index in 4"
            :key="index"
            class="profile-pin__dot"
            :class="{ 'profile-pin__dot--filled': index <= digits.length }"
          />
        </div>
        <p v-if="pinLockedUntil" class="profile-pin__lockout" role="alert">
          Слишком много попыток. Повторите позже
        </p>
        <p v-else-if="biometricError" class="profile-pin__lockout" role="alert">
          {{ biometricError }}
        </p>
        <ProfilePinKeypad
          :show-face-id="biometricEnabled"
          :face-id-busy="biometricBusy"
          :disabled="pinBusy || logoutBusy"
          @digit="onDigit"
          @backspace="onBackspace"
          @face-id="onFaceIdFromKeypad"
        />
      </div>
    </div>

    <div
      v-if="pinBusy"
      class="profile-device-unlock-gate__busy-overlay"
      aria-busy="true"
      aria-live="assertive"
    >
      <span class="profile-device-unlock-gate__spinner" aria-hidden="true" />
      <p class="profile-device-unlock-gate__loading-hint">Проверка кода…</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { PROFILE_LEGACY_EXTRAS_KEY } from '../../types'
import { isStandalonePwaClient } from '../lib/pwaClient'
import {
  assertBiometricLogin,
  canAssertBiometricLogin,
  isBiometricAssertInFlight,
  isBiometricLoginBound,
} from '../lib/biometricLogin'
import {
  fetchDeviceUnlockStatus,
  verifyDeviceUnlockPin,
} from '../lib/deviceUnlockApi'
import {
  DEVICE_UNLOCK_GRACE_MS,
  DEVICE_UNLOCK_UI_ENABLED,
  clearDeviceUnlockSession,
  isDeviceUnlockSessionActive,
  isDeviceUnlockStepUpDone,
  isSensitiveUnlockPath,
  markDeviceUnlockSession,
  markDeviceUnlockStepUp,
} from '../lib/deviceUnlockSession'
import ProfilePinKeypad from './ProfilePinKeypad.vue'
import '../profile-security.css'

const legacyExtras = inject(PROFILE_LEGACY_EXTRAS_KEY, null)

const SKIP_PREFIXES = [
  '/auth',
  '/registration',
  '/forgot_password',
  '/consent',
  '/profile/security/pin',
  '/profile/security/biometric',
]

const HTML_LOCK_CLASS = 'app-device-unlock-locked'

const locked = ref(false)
/** Только проверка PIN — блокирует клавиатуру. Face ID клавиатуру не блокирует. */
const pinBusy = ref(false)
const biometricBusy = ref(false)
const logoutBusy = ref(false)
/** Пока статус грузится — клавиатура уже принимает код (сервер отклонит, если PIN нет). */
const pinEnabled = ref(true)
const biometricEnabled = ref(false)
/** На сервере включён PIN и/или Face ID — нужен замок (даже если local Face ID ещё не связан). */
const lockRequired = ref(false)
const stepUp = ref(false)
const digits = ref('')
const pinError = ref(false)
const biometricError = ref('')
const pinLockedUntil = ref<string | null>(null)
let statusReady = false
/** Один автозапуск Face ID на показ gate (на инстанс). Параллельный get режет mutex в assertBiometricLogin. */
let autoFaceIdStartedForLock = false
/** Не сбрасывать sessionStorage во время системного Face ID (visibility=hidden). */
let suppressBackgroundClear = false
let suppressBackgroundClearTimer: number | undefined
/** После успешного кода не возвращать замок из-за мигания iOS visibility. */
let unlockHoldUntil = 0
/** Когда ушли в фон (без немедленного clear — grace проверяем на resume). */
let backgroundedAt: number | null = null
let ignoreBiometricResult = false

const title = computed(() =>
  stepUp.value ? 'Подтвердите секретным кодом' : 'Введите секретный код',
)

function currentPath(): string {
  if (typeof window === 'undefined') return '/'
  return window.location.pathname.replace(/\/+$/, '') || '/'
}

function shouldSkip(): boolean {
  const path = currentPath()
  return SKIP_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

function syncHtmlLockClass(isLocked: boolean): void {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle(HTML_LOCK_CLASS, isLocked)
}

watch(
  locked,
  (value) => {
    syncHtmlLockClass(value)
  },
  { immediate: true },
)

function isUnlockHoldActive(): boolean {
  return Date.now() < unlockHoldUntil
}

function unlock(): void {
  ignoreBiometricResult = true
  const path = currentPath()
  markDeviceUnlockSession()
  if (stepUp.value || isSensitiveUnlockPath(path)) {
    markDeviceUnlockStepUp(path)
  }
  unlockHoldUntil = Date.now() + 4000
  suppressBackgroundClear = true
  backgroundedAt = null
  if (suppressBackgroundClearTimer != null) {
    window.clearTimeout(suppressBackgroundClearTimer)
  }
  suppressBackgroundClearTimer = window.setTimeout(() => {
    suppressBackgroundClear = false
    suppressBackgroundClearTimer = undefined
  }, 4000)
  locked.value = false
  stepUp.value = false
  digits.value = ''
  pinError.value = false
  biometricError.value = ''
  pinLockedUntil.value = null
  pinBusy.value = false
  biometricBusy.value = false
  autoFaceIdStartedForLock = false
}

function beginFaceIdVisibilityGuard(): void {
  suppressBackgroundClear = true
  if (suppressBackgroundClearTimer != null) {
    window.clearTimeout(suppressBackgroundClearTimer)
  }
}

function endFaceIdVisibilityGuard(): void {
  if (suppressBackgroundClearTimer != null) {
    window.clearTimeout(suppressBackgroundClearTimer)
  }
  // iOS иногда мигает visibility после закрытия Face ID
  suppressBackgroundClearTimer = window.setTimeout(() => {
    suppressBackgroundClear = false
    suppressBackgroundClearTimer = undefined
  }, 800)
}

/**
 * Face ID поверх экрана кода.
 * Не ставит pinBusy — цифры остаются доступны после отмены системного диалога.
 */
async function runBiometric(fromAuto: boolean): Promise<void> {
  if (!biometricEnabled.value) return
  if (biometricBusy.value) return

  biometricError.value = ''
  pinError.value = false
  biometricBusy.value = true
  beginFaceIdVisibilityGuard()
  try {
    // Mutex в assertBiometricLogin: параллельные вызовы (ремаунт gate) делят один Face ID.
    const ok = await assertBiometricLogin()
    if (ok && !ignoreBiometricResult) {
      unlock()
      return
    }
    if (!fromAuto) {
      biometricError.value =
        'Не удалось разблокировать биометрию. Введите секретный код или нажмите иконку ещё раз'
    }
  } finally {
    biometricBusy.value = false
    endFaceIdVisibilityGuard()
  }
}

function onFaceIdFromKeypad(): void {
  void runBiometric(false)
}

async function onLogout(): Promise<void> {
  if (logoutBusy.value || pinBusy.value) return
  const logout = legacyExtras?.logoutGlobal
  if (!logout) return

  logoutBusy.value = true
  ignoreBiometricResult = true
  biometricBusy.value = false
  beginFaceIdVisibilityGuard()
  try {
    clearDeviceUnlockSession()
    await logout()
  } finally {
    logoutBusy.value = false
    endFaceIdVisibilityGuard()
  }
}

/** Сразу после показа gate — системный Face ID; код уже на экране под ним. */
function startAutoFaceIdIfNeeded(): void {
  if (!locked.value) return
  if (!biometricEnabled.value) return
  if (autoFaceIdStartedForLock) return
  autoFaceIdStartedForLock = true
  void runBiometric(true)
}

function isPinLockoutActive(): boolean {
  if (!pinLockedUntil.value) return false
  const until = Date.parse(pinLockedUntil.value)
  if (!Number.isFinite(until) || Date.now() >= until) {
    pinLockedUntil.value = null
    return false
  }
  return true
}

function onBackspace(): void {
  if (pinBusy.value) return
  pinError.value = false
  biometricError.value = ''
  digits.value = digits.value.slice(0, -1)
}

async function onDigit(digit: string): Promise<void> {
  if (pinBusy.value) return
  if (isPinLockoutActive()) return
  if (digits.value.length >= 4) return
  pinError.value = false
  biometricError.value = ''
  digits.value += digit
  if (digits.value.length < 4) return

  const pin = digits.value
  pinBusy.value = true
  try {
    const result = await verifyDeviceUnlockPin(pin)
    if (result.ok) {
      unlock()
      return
    }
    if (result.lockedUntil) {
      pinLockedUntil.value = result.lockedUntil
      pinError.value = false
      biometricError.value = result.error || 'Слишком много попыток. Повторите позже'
    } else {
      pinError.value = true
      biometricError.value = result.error || 'Неверный код'
    }
    digits.value = ''
  } finally {
    pinBusy.value = false
  }
}

function resetUnlockFields(): void {
  digits.value = ''
  pinError.value = false
  biometricError.value = ''
  pinLockedUntil.value = null
  pinBusy.value = false
}

function lockScreen(asStepUp = false): void {
  ignoreBiometricResult = false
  locked.value = true
  stepUp.value = asStepUp
  // Не сбрасываем авто-флаг, пока системный диалог уже идёт — иначе второй Face ID.
  if (!biometricBusy.value && !isBiometricAssertInFlight()) {
    autoFaceIdStartedForLock = false
  }
  resetUnlockFields()
  startAutoFaceIdIfNeeded()
}

function evaluateLock(): void {
  if (!DEVICE_UNLOCK_UI_ENABLED) {
    locked.value = false
    return
  }
  if (isUnlockHoldActive()) return
  if (!statusReady) return
  if (!isStandalonePwaClient()) return
  if (shouldSkip()) {
    // На экранах настройки PIN/Face ID замок не показываем, но сессию не «открываем» навсегда.
    return
  }
  if (!lockRequired.value) {
    locked.value = false
    return
  }
  if (locked.value) return

  const path = currentPath()
  if (isSensitiveUnlockPath(path) && !isDeviceUnlockStepUpDone(path)) {
    lockScreen(true)
    return
  }

  if (!isDeviceUnlockSessionActive()) {
    lockScreen(false)
  }
}

function coverNavOptimistic(): void {
  if (!DEVICE_UNLOCK_UI_ENABLED) return
  if (!isStandalonePwaClient()) return
  if (shouldSkip()) return
  if (isDeviceUnlockSessionActive()) return
  locked.value = true
  resetUnlockFields()
}

function applyStatus(status: {
  pin_enabled: boolean
  biometric_enabled: boolean
  credential_id?: string | null
  user_id?: number | null
  pin_locked_until?: string | null
}): void {
  pinEnabled.value = status.pin_enabled !== false
  pinLockedUntil.value = status.pin_locked_until ?? null
  isPinLockoutActive()
  biometricEnabled.value =
    canAssertBiometricLogin(status) || isBiometricLoginBound(status)
  lockRequired.value = Boolean(status.pin_enabled) || Boolean(status.biometric_enabled)
  statusReady = true
}

async function initGate(): Promise<void> {
  if (typeof window === 'undefined') return
  if (!DEVICE_UNLOCK_UI_ENABLED) {
    locked.value = false
    return
  }
  if (!isStandalonePwaClient()) return

  coverNavOptimistic()
  biometricEnabled.value = canAssertBiometricLogin()

  const status = await fetchDeviceUnlockStatus()
  if (!status) {
    pinEnabled.value = true
    biometricEnabled.value = canAssertBiometricLogin()
    return
  }

  applyStatus(status)

  if (!lockRequired.value) {
    locked.value = false
    return
  }

  if (isDeviceUnlockSessionActive() && !isSensitiveUnlockPath(currentPath())) {
    locked.value = false
    return
  }

  if (locked.value) {
    stepUp.value = isSensitiveUnlockPath(currentPath()) && !isDeviceUnlockStepUpDone(currentPath())
    startAutoFaceIdIfNeeded()
    return
  }

  evaluateLock()
}

/**
 * Уход в фон: только запоминаем момент.
 * Clear + lock — на resume, если grace (15 мин) истёк.
 * Короткие мигания visibility (Face ID / iOS) не считаем уходом.
 */
function onAppBackground(): void {
  if (suppressBackgroundClear || isUnlockHoldActive()) return
  if (shouldSkip()) return
  if (locked.value) return
  backgroundedAt = Date.now()
}

function onAppForeground(): void {
  if (isUnlockHoldActive()) return
  // Мигание visibility от системного Face ID — не трогаем замок и не стартуем второй диалог.
  if (suppressBackgroundClear || biometricBusy.value || isBiometricAssertInFlight()) {
    backgroundedAt = null
    return
  }
  if (!statusReady) return
  if (!lockRequired.value) return
  if (shouldSkip()) return

  const awayMs =
    backgroundedAt != null ? Date.now() - backgroundedAt : 0
  backgroundedAt = null

  const graceExpiredByAway = awayMs >= DEVICE_UNLOCK_GRACE_MS
  if (graceExpiredByAway) {
    clearDeviceUnlockSession()
  }

  if (isDeviceUnlockSessionActive()) {
    // Продлить cold-start окно при коротком уходе в фон
    if (awayMs > 0) {
      markDeviceUnlockSession()
    }
    return
  }

  clearDeviceUnlockSession()
  if (!locked.value) {
    lockScreen(false)
  }
}

function onVisibilityChange(): void {
  if (typeof document === 'undefined') return
  if (document.visibilityState === 'hidden') {
    onAppBackground()
    return
  }
  onAppForeground()
}

function onPageHide(): void {
  onAppBackground()
}

function onNavigated(): void {
  evaluateLock()
}

let stopAfterEach: (() => void) | undefined

onMounted(() => {
  void initGate()
  window.addEventListener('popstate', onNavigated)
  window.addEventListener('pagehide', onPageHide)
  document.addEventListener('visibilitychange', onVisibilityChange)
  try {
    const router = useRouter()
    stopAfterEach = router.afterEach(() => {
      onNavigated()
    })
  } catch {
    // вне Nuxt-контекста
  }
})

onUnmounted(() => {
  window.removeEventListener('popstate', onNavigated)
  window.removeEventListener('pagehide', onPageHide)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  if (suppressBackgroundClearTimer != null) {
    window.clearTimeout(suppressBackgroundClearTimer)
  }
  backgroundedAt = null
  stopAfterEach?.()
  syncHtmlLockClass(false)
})
</script>

<style scoped>
.profile-device-unlock-gate {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  height: 100dvh;
  height: 100lvh;
  min-height: -webkit-fill-available;
  z-index: 10050;
  display: flex;
  flex-direction: column;
  background: var(--Backgrounds-Quaternary, var(--rr-backgrounds-quaternary, #f2f3f7));
  color: var(--rr-labels-neutral-primary, #101012);
}

.profile-device-unlock-gate__paint {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  width: 100dvw;
  height: 100%;
  height: 100dvh;
  height: 100lvh;
  min-height: -webkit-fill-available;
  margin-top: calc(-1 * env(safe-area-inset-top, 0px));
  margin-bottom: calc(-1 * env(safe-area-inset-bottom, 0px));
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  box-sizing: content-box;
  background: var(--Backgrounds-Quaternary, var(--rr-backgrounds-quaternary, #f2f3f7));
  pointer-events: none;
  z-index: 0;
}

.profile-pin {
  position: relative;
  z-index: 1;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  pointer-events: auto;
}

.profile-device-unlock-gate :deep(.profile-pin-keypad) {
  position: relative;
  z-index: 3;
  pointer-events: auto;
}

.profile-device-unlock-gate :deep(.profile-pin-keypad__key) {
  pointer-events: auto;
  touch-action: manipulation;
}

.profile-device-unlock-gate :deep(.profile-pin-keypad--disabled) {
  opacity: 0.45;
}

.profile-device-unlock-gate__header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.profile-device-unlock-gate__logout {
  margin: 0;
  padding: 10px 4px;
  border: none;
  background: transparent;
  color: var(--rr-labels-neutral-secondary, rgba(16, 16, 18, 0.56));
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: -0.01em;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.profile-device-unlock-gate__logout:disabled {
  opacity: 0.45;
  cursor: default;
}

.profile-device-unlock-gate__logout:not(:disabled):active {
  color: var(--rr-labels-neutral-primary, #101012);
}

.profile-device-unlock-gate .profile-pin__lockout {
  margin: 0 0 12px;
  padding-left: var(--rr-spacing-padding-xl, 16px);
  padding-right: var(--rr-spacing-padding-xl, 16px);
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  text-align: center;
  color: var(--rr-labels-danger-primary, #dc2626);
}

.profile-device-unlock-gate__spinner {
  box-sizing: border-box;
  width: 28px;
  height: 28px;
  border: 2.5px solid rgba(16, 16, 18, 0.12);
  border-top-color: var(--rr-labels-neutral-primary, #101012);
  border-radius: 50%;
  animation: profile-device-unlock-spin 0.7s linear infinite;
}

.profile-device-unlock-gate__loading-hint {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: var(--rr-labels-neutral-primary, #101012);
}

.profile-device-unlock-gate__busy-overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  background: color-mix(
    in srgb,
    var(--Backgrounds-Quaternary, var(--rr-backgrounds-quaternary, #f2f3f7)) 78%,
    transparent
  );
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

@keyframes profile-device-unlock-spin {
  to {
    transform: rotate(360deg);
  }
}

.profile-device-unlock-gate :deep(.profile-pin__dots--busy) {
  opacity: 0.55;
}
</style>

<style>
html.app-device-unlock-locked .app-nav-rr,
html.app-device-unlock-locked .app-mobile-tab-bar-rr,
html.app-device-unlock-locked .app-nav-rr__backdrop {
  visibility: hidden !important;
  pointer-events: none !important;
}

@media (max-width: 767px) {
  html.app-device-unlock-locked.app-rr-shell::before,
  html.app-device-unlock-locked.app-rr-shell::after,
  html.app-device-unlock-locked.app-rr-shell.app-overlay-open::before,
  html.app-device-unlock-locked.app-rr-shell.app-overlay-open::after {
    background: var(--Backgrounds-Quaternary, var(--rr-backgrounds-quaternary, #f2f3f7)) !important;
    background-image: none !important;
    pointer-events: none !important;
    z-index: 0;
  }
}
</style>
