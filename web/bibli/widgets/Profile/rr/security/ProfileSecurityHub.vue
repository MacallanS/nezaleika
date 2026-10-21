<template>
  <ProfileSecurityShell title="Безопасность и вход" back-to="/profile">
    <ul class="profile-security-list" role="list">
      <li v-if="showBiometric">
        <button type="button" class="profile-security-row" @click="openBiometric">
          <span class="profile-security-row__icon" aria-hidden="true">
            <img :src="iconBiometric" alt="" width="40" height="40" />
          </span>
          <span class="profile-security-row__text">
            <span class="profile-security-row__label">{{ biometricLabel }}</span>
            <span v-if="biometricHint" class="profile-security-row__hint">{{ biometricHint }}</span>
          </span>
          <span class="profile-security-row__chevron" aria-hidden="true">›</span>
        </button>
      </li>

      <li v-if="showPin">
        <button type="button" class="profile-security-row" @click="openPin">
          <span class="profile-security-row__icon" aria-hidden="true">
            <img :src="iconPin" alt="" width="40" height="40" />
          </span>
          <span class="profile-security-row__text">
            <span class="profile-security-row__label">Секретный код</span>
            <span class="profile-security-row__hint">Для входа в веб-приложение</span>
          </span>
          <span class="profile-security-row__chevron" aria-hidden="true">›</span>
        </button>
      </li>

      <li>
        <button type="button" class="profile-security-row" @click="openPassword">
          <span class="profile-security-row__icon" aria-hidden="true">
            <img :src="iconPassword" alt="" width="40" height="40" />
          </span>
          <span class="profile-security-row__text">
            <span class="profile-security-row__label">Смена пароля</span>
          </span>
          <span class="profile-security-row__chevron" aria-hidden="true">›</span>
        </button>
      </li>

      <li v-if="showDevices">
        <button type="button" class="profile-security-row" @click="openDevices">
          <span class="profile-security-row__icon" aria-hidden="true">
            <img :src="iconDevices" alt="" width="40" height="40" />
          </span>
          <span class="profile-security-row__text">
            <span class="profile-security-row__label">Авторизованные устройства</span>
            <span class="profile-security-row__hint">Устройства, с которых вы заходили</span>
          </span>
          <span class="profile-security-row__chevron" aria-hidden="true">›</span>
        </button>
      </li>
    </ul>
  </ProfileSecurityShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useProfileNavigate } from '../../composables/useProfileServices'
import {
  BIOMETRIC_PASSKEY_NAME,
  isBiometricLoginAvailable,
  isBiometricLoginBound,
} from '../lib/biometricLogin'
import { fetchDeviceUnlockStatus } from '../lib/deviceUnlockApi'
import { DEVICE_UNLOCK_UI_ENABLED, AUTHORIZED_DEVICES_UI_ENABLED } from '../lib/deviceUnlockSession'
import { isStandalonePwaClient } from '../lib/pwaClient'
import ProfileSecurityShell from './ProfileSecurityShell.vue'
import iconBiometric from '../assets/security/icon-face-id.svg'
import iconPin from '../assets/security/icon-pin.svg'
import iconPassword from '../assets/security/icon-password.svg'
import iconDevices from '../assets/security/icon-devices.svg'
import '../profile-security.css'

const navigateTo = useProfileNavigate()
const showBiometric = ref(false)
const showPin = ref(false)
const showDevices = AUTHORIZED_DEVICES_UI_ENABLED
const biometricOn = ref(false)

const biometricLabel = computed(() =>
  biometricOn.value ? BIOMETRIC_PASSKEY_NAME : 'Подключить Face ID / Touch ID',
)

const biometricHint = computed(() =>
  biometricOn.value ? 'Face ID / Touch ID · включён' : 'Face ID или Touch ID',
)

onMounted(() => {
  if (!DEVICE_UNLOCK_UI_ENABLED) {
    showBiometric.value = false
    showPin.value = false
    return
  }
  showBiometric.value = isBiometricLoginAvailable()
  showPin.value = isStandalonePwaClient()
  if (!showBiometric.value) return
  void fetchDeviceUnlockStatus().then((status) => {
    biometricOn.value = isBiometricLoginBound(status)
  })
})

function openBiometric() {
  void navigateTo('/profile/security/biometric')
}

function openPin() {
  void navigateTo('/profile/security/pin')
}

function openPassword() {
  void navigateTo('/profile/security/password')
}

function openDevices() {
  void navigateTo('/profile/security/devices')
}
</script>
