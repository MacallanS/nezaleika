<template>
  <div
    class="profile-pin"
    :class="phase === 'success' ? 'profile-pin--success' : 'profile-pin--entry'"
  >
    <template v-if="phase !== 'success'">
      <header class="profile-pin__header">
        <button
          v-if="!isOnboarding"
          type="button"
          class="profile-pin__back"
          aria-label="Назад"
          @click="onBack"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M14.5 6.5L9 12l5.5 5.5"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </header>

      <div class="profile-pin__main">
        <h1 class="profile-pin__title">{{ title }}</h1>

        <div
          class="profile-pin__dots"
          :class="{
            'profile-pin__dots--error': showMismatch,
            'profile-pin__dots--busy': busy,
          }"
          aria-hidden="true"
        >
          <span
            v-for="index in PIN_LENGTH"
            :key="index"
            class="profile-pin__dot"
            :class="{ 'profile-pin__dot--filled': index <= activeDigits.length }"
          />
        </div>

        <p v-if="lockoutText" class="profile-pin__lockout" role="alert">{{ lockoutText }}</p>
        <p v-else-if="errorText" class="profile-pin__lockout" role="alert">{{ errorText }}</p>

        <ProfilePinKeypad
          :disabled="busy || Boolean(lockoutText)"
          @digit="onDigit"
          @backspace="onBackspace"
        />
      </div>
    </template>

    <template v-else>
      <header class="profile-pin__header">
        <button
          v-if="!isOnboarding"
          type="button"
          class="profile-pin__back"
          aria-label="Назад"
          @click="onDone"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M14.5 6.5L9 12l5.5 5.5"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </header>

      <div class="profile-pin__success">
        <img class="profile-pin__success-icon" :src="pinSuccessIcon" alt="" width="80" height="80" />
        <h1 class="profile-pin__success-title">
          {{ isChangeFlow ? 'Секретный код изменен' : 'Секретный код создан' }}
        </h1>
        <p class="profile-pin__success-subtitle">Запомните его, чтобы быстро входить</p>
      </div>

      <footer class="profile-pin__footer">
        <AuthRRButton
          type="button"
          class="profile-pin__success-btn"
          :label="isOnboarding && offerFaceId ? 'Дальше' : 'Отлично'"
          @click="onDone"
        />
      </footer>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { AuthRRButton } from 'bibli/shared/ui/rr'
import { useProfileNavigate } from '../../composables/useProfileServices'
import { isBiometricLoginAvailable } from '../lib/biometricLogin'
import {
  fetchDeviceUnlockStatus,
  saveDeviceUnlockPin,
  verifyDeviceUnlockPin,
} from '../lib/deviceUnlockApi'
import {
  DEVICE_UNLOCK_UI_ENABLED,
  isDeviceUnlockSetupQuery,
  markDeviceUnlockSession,
} from '../lib/deviceUnlockSession'
import ProfilePinKeypad from './ProfilePinKeypad.vue'
import pinSuccessIcon from '../assets/security/pin-success.svg'
import '../profile-security.css'

const PIN_LENGTH = 4

type Phase = 'loading' | 'current' | 'create' | 'confirm' | 'success'

const route = useRoute()
const navigateTo = useProfileNavigate()
const phase = ref<Phase>('loading')
const draftPin = ref('')
const currentPin = ref('')
const activeDigits = ref('')
const showMismatch = ref(false)
const busy = ref(false)
const errorText = ref('')
const lockoutText = ref('')
const isChangeFlow = ref(false)

const isOnboarding = computed(() => isDeviceUnlockSetupQuery(route.query))
const offerFaceId = computed(
  () =>
    isOnboarding.value && DEVICE_UNLOCK_UI_ENABLED && isBiometricLoginAvailable(),
)

const title = computed(() => {
  if (phase.value === 'current') return 'Введите текущий код'
  if (phase.value === 'confirm') return 'Повторите новый код'
  if (isChangeFlow.value) return 'Придумайте новый код'
  return 'Придумайте секретный код'
})

onMounted(() => {
  void bootstrap()
})

async function bootstrap(): Promise<void> {
  const status = await fetchDeviceUnlockStatus()
  const hasPin = Boolean(status?.pin_enabled)

  if (status?.pin_locked_until) {
    lockoutText.value = 'Слишком много попыток. Повторите позже'
  }

  if (hasPin && !isOnboarding.value) {
    isChangeFlow.value = true
    phase.value = 'current'
    return
  }

  isChangeFlow.value = false
  phase.value = 'create'
}

function onDigit(digit: string) {
  if (busy.value || lockoutText.value) return
  if (activeDigits.value.length >= PIN_LENGTH) return
  showMismatch.value = false
  errorText.value = ''
  activeDigits.value += digit
  if (activeDigits.value.length < PIN_LENGTH) return

  window.setTimeout(() => {
    void onPinComplete()
  }, 120)
}

async function onPinComplete(): Promise<void> {
  if (phase.value === 'current') {
    await verifyCurrentPin(activeDigits.value)
    return
  }

  if (phase.value === 'create') {
    draftPin.value = activeDigits.value
    activeDigits.value = ''
    phase.value = 'confirm'
    return
  }

  if (phase.value === 'confirm') {
    if (activeDigits.value === draftPin.value) {
      await persistPin(activeDigits.value)
      return
    }
    showMismatch.value = true
    errorText.value = 'Коды не совпадают'
    activeDigits.value = ''
  }
}

async function verifyCurrentPin(pin: string): Promise<void> {
  busy.value = true
  errorText.value = ''
  try {
    const result = await verifyDeviceUnlockPin(pin)
    if (result.ok) {
      currentPin.value = pin
      activeDigits.value = ''
      phase.value = 'create'
      return
    }
    if (result.lockedUntil) {
      lockoutText.value = 'Слишком много попыток. Повторите позже'
      showMismatch.value = false
    } else {
      showMismatch.value = true
      errorText.value = result.error || 'Неверный код'
    }
    activeDigits.value = ''
  } finally {
    busy.value = false
  }
}

async function persistPin(pin: string) {
  busy.value = true
  errorText.value = ''
  try {
    const saved = await saveDeviceUnlockPin(
      pin,
      isChangeFlow.value ? currentPin.value : null,
    )
    if (!saved.data) {
      showMismatch.value = true
      errorText.value = saved.error || 'Не удалось сохранить код'
      if (saved.lockedUntil) {
        lockoutText.value = 'Слишком много попыток. Повторите позже'
      }
      // Если текущий код отклонили на сервере — вернуться к его вводу
      if (isChangeFlow.value && /текущ/i.test(String(saved.error || ''))) {
        currentPin.value = ''
        draftPin.value = ''
        phase.value = 'current'
      }
      activeDigits.value = ''
      return
    }
    // Иначе gate сразу попросит только что созданный код до Face ID
    markDeviceUnlockSession()
    phase.value = 'success'
  } finally {
    busy.value = false
  }
}

function onBackspace() {
  if (busy.value) return
  showMismatch.value = false
  errorText.value = ''
  activeDigits.value = activeDigits.value.slice(0, -1)
}

function onBack() {
  if (phase.value === 'confirm') {
    phase.value = 'create'
    activeDigits.value = ''
    draftPin.value = ''
    showMismatch.value = false
    errorText.value = ''
    return
  }
  if (phase.value === 'create' && isChangeFlow.value) {
    phase.value = 'current'
    activeDigits.value = ''
    draftPin.value = ''
    currentPin.value = ''
    showMismatch.value = false
    errorText.value = ''
    return
  }
  void navigateTo('/profile/security')
}

function onDone() {
  if (isOnboarding.value && offerFaceId.value) {
    void navigateTo('/profile/security/biometric?setup=1', { replace: true })
    return
  }
  if (isOnboarding.value) {
    void navigateTo('/', { replace: true })
    return
  }
  void navigateTo('/profile/security')
}
</script>
