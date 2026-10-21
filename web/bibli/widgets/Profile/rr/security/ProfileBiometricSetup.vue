<template>
  <ProfileSecurityShell
    class="profile-security-shell--biometric"
    :title="shellTitle"
    :back-to="isOnboarding ? '/' : '/profile/security'"
    :variant="phase === 'manage' ? 'card' : 'plain'"
    :hide-back="isOnboarding && phase !== 'manage'"
  >
    <!-- Управление: биометрия уже подключена -->
    <template v-if="phase === 'manage'">
      <ul class="profile-security-list profile-security-list--nested" role="list">
        <li>
          <div class="profile-biometric-manage__toggle">
            <ProfileRrCheckbox
              v-model="faceIdEnabled"
              label="Вход по Face ID / Touch ID"
              :disabled="busy"
              @update:model-value="onEnabledChange"
            />
            <p class="profile-biometric-manage__hint">
              Снимите галочку, чтобы отключить биометрию при входе в приложение
            </p>
          </div>
        </li>
        <li>
          <button
            type="button"
            class="profile-security-row"
            :disabled="busy || !faceIdEnabled"
            @click="onReplace"
          >
            <span class="profile-security-row__text">
              <span class="profile-security-row__label">Поменять биометрию</span>
              <span class="profile-security-row__hint">
                Перезапишет ключ на этом устройстве (не создаст второй)
              </span>
            </span>
            <span class="profile-security-row__chevron" aria-hidden="true">›</span>
          </button>
        </li>
      </ul>
      <p v-if="errorText" class="profile-biometric__error" role="alert">{{ errorText }}</p>
    </template>

    <div
      v-else
      class="profile-biometric"
      :class="{ 'profile-biometric--success': phase === 'success' }"
    >
      <div class="profile-biometric__hero-wrap">
        <img
          class="profile-biometric__hero profile-biometric__hero--icon"
          :src="heroImage"
          alt=""
          width="200"
          height="200"
        />
      </div>

      <div class="profile-biometric__copy">
        <h2 class="profile-biometric__title">{{ title }}</h2>
        <p class="profile-biometric__subtitle">{{ subtitle }}</p>
        <p v-if="errorText" class="profile-biometric__error" role="alert">{{ errorText }}</p>
      </div>
    </div>

    <template v-if="phase !== 'manage'" #footer>
      <div class="profile-biometric__actions">
        <AuthRRButton
          v-if="phase === 'intro' || phase === 'confirm'"
          type="button"
          :label="connectLabel"
          :loading="busy"
          @click="onConnect"
        />
        <AuthRRButton
          v-else
          type="button"
          label="Хорошо"
          @click="onDone"
        />
        <AuthRRButton
          v-if="phase === 'intro' || phase === 'confirm'"
          type="button"
          label="Не сейчас"
          variant="neutral-secondary"
          @click="onSkip"
        />
      </div>
    </template>
  </ProfileSecurityShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { AuthRRButton } from 'bibli/shared/ui/rr'
import { useProfileNavigate } from '../../composables/useProfileServices'
import {
  BIOMETRIC_PASSKEY_NAME,
  disableBiometricLoginLocal,
  isBiometricLoginAvailable,
  isBiometricLoginBound,
  isBiometricReplacePrefetchReady,
  prefetchBiometricRegistration,
  registerBiometricLogin,
} from '../lib/biometricLogin'
import {
  disableDeviceUnlockBiometric,
  fetchDeviceUnlockStatus,
} from '../lib/deviceUnlockApi'
import {
  DEVICE_UNLOCK_UI_ENABLED,
  clearDeviceUnlockSession,
  isDeviceUnlockSetupQuery,
  markDeviceUnlockSession,
} from '../lib/deviceUnlockSession'
import ProfileRrCheckbox from '../personal/ProfileRrCheckbox.vue'
import ProfileSecurityShell from './ProfileSecurityShell.vue'
import faceIdHero from '../assets/security/icon-face-id.svg'
import '../profile-security.css'

type Phase = 'loading' | 'intro' | 'confirm' | 'manage' | 'success'

const route = useRoute()
const navigateTo = useProfileNavigate()
const phase = ref<Phase>('loading')
const busy = ref(false)
const errorText = ref('')
const successKind = ref<'connect' | 'replace'>('connect')
const pendingReplace = ref(false)
const faceIdEnabled = ref(true)

const isOnboarding = computed(() => isDeviceUnlockSetupQuery(route.query))

/** Шапка: в manage — название продукта; на intro/success — пусто (заголовок в контенте). */
const shellTitle = computed(() => (phase.value === 'manage' ? BIOMETRIC_PASSKEY_NAME : ''))

const heroImage = faceIdHero

const connectLabel = computed(() =>
  phase.value === 'confirm'
    ? pendingReplace.value
      ? 'Подтвердить замену'
      : 'Подтвердить'
    : 'Подключить',
)

const title = computed(() => {
  if (phase.value === 'success') {
    return successKind.value === 'replace'
      ? 'Биометрия обновлена'
      : `${BIOMETRIC_PASSKEY_NAME} подключён`
  }
  if (phase.value === 'confirm') {
    return pendingReplace.value
      ? 'Подтвердите замену биометрии'
      : 'Подтвердите Face ID / Touch ID'
  }
  return BIOMETRIC_PASSKEY_NAME
})

const subtitle = computed(() => {
  if (phase.value === 'success') {
    return successKind.value === 'replace'
      ? 'Старый ключ на устройстве заменён. Сработает при следующем входе'
      : 'Сработает при следующем входе в веб-приложение'
  }
  if (phase.value === 'confirm') {
    return pendingReplace.value
      ? 'Сразу откроется Face ID или Touch ID — текущий ключ на устройстве будет перезаписан'
      : 'Нажмите кнопку ниже — сразу откроется Face ID или Touch ID (без ожидания сети)'
  }
  return 'Подключите биометрию устройства для входа в веб-приложение — пароль не понадобится'
})

function leaveSetup(): void {
  markDeviceUnlockSession()
  if (isOnboarding.value) {
    void navigateTo('/', { replace: true })
    return
  }
  void navigateTo('/profile/security')
}

onMounted(() => {
  if (!DEVICE_UNLOCK_UI_ENABLED || !isBiometricLoginAvailable()) {
    leaveSetup()
    return
  }
  void loadPhase()
})

async function loadPhase(): Promise<void> {
  const status = await fetchDeviceUnlockStatus()
  const enabled = isBiometricLoginBound(status)
  faceIdEnabled.value = enabled
  phase.value = enabled ? 'manage' : 'intro'
  if (!enabled) {
    void prefetchBiometricRegistration()
  } else {
    // Options с replace — чтобы Signal API знал user.id при отключении.
    void prefetchBiometricRegistration({ replace: true })
  }
}

async function runRegister(replace: boolean): Promise<void> {
  errorText.value = ''
  busy.value = true
  try {
    // Важно: не делать await fetch до credentials.create — iOS Safari
    // теряет user gesture. Options должны быть в prefetch с mount/confirm.
    const result = await registerBiometricLogin({ replace })
    if (result.ok) {
      successKind.value = replace ? 'replace' : 'connect'
      faceIdEnabled.value = true
      phase.value = 'success'
      pendingReplace.value = false
      return
    }

    if (result.needsGestureRetry) {
      pendingReplace.value = replace
      phase.value = 'confirm'
      errorText.value =
        result.error || 'Нажмите «Подтвердить» — диалог откроется сразу'
      return
    }

    // Options не было / сеть упала: подготовим и попросим второй тап.
    pendingReplace.value = replace
    await prefetchBiometricRegistration({ replace })
    phase.value = 'confirm'
    errorText.value =
      result.error ||
      (replace
        ? 'Не удалось обновить биометрию. Нажмите «Подтвердить замену»'
        : 'Не удалось подключить биометрию. Нажмите «Подтвердить»')
  } finally {
    busy.value = false
  }
}

async function onConnect(): Promise<void> {
  await runRegister(pendingReplace.value)
}

async function onReplace(): Promise<void> {
  errorText.value = ''
  pendingReplace.value = true
  // Options уже prefetch на mount (replace: true). create в том же жесте —
  // иначе iOS крутит спиннер и не открывает Face ID.
  if (isBiometricReplacePrefetchReady()) {
    await runRegister(true)
    return
  }
  busy.value = true
  try {
    const pref = await prefetchBiometricRegistration({ replace: true })
    if (!pref.ok) {
      errorText.value = pref.error || 'Не удалось подготовить биометрию'
      pendingReplace.value = false
      return
    }
    phase.value = 'confirm'
  } finally {
    busy.value = false
  }
}

async function onEnabledChange(checked: boolean): Promise<void> {
  if (checked) {
    faceIdEnabled.value = true
    return
  }
  // Optimistic UI: галочка уже снята через v-model
  errorText.value = ''
  busy.value = true
  try {
    await disableDeviceUnlockBiometric()
    await disableBiometricLoginLocal()
    clearDeviceUnlockSession()
    faceIdEnabled.value = false
    void navigateTo('/profile/security')
  } catch {
    faceIdEnabled.value = true
    errorText.value = 'Не удалось отключить биометрию. Попробуйте ещё раз'
  } finally {
    busy.value = false
  }
}

function onSkip() {
  leaveSetup()
}

function onDone() {
  leaveSetup()
}
</script>
