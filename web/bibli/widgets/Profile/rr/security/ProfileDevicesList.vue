<template>
  <ProfileSecurityShell title="Авторизованные устройства" back-to="/profile/security">
    <p v-if="loading" class="profile-devices-status">Загрузка…</p>
    <p v-else-if="errorText" class="profile-devices-status profile-devices-status--error" role="alert">
      {{ errorText }}
    </p>
    <p v-else-if="!currentDevice && !otherSessions.length" class="profile-devices-status">
      Активных сеансов нет
    </p>

    <template v-else>
      <div class="profile-devices-content">
        <ul v-if="currentDevice" class="profile-devices-list" role="list">
          <li>
            <button type="button" class="profile-devices-row" @click="openDevice(currentDevice)">
              <span class="profile-devices-row__icon profile-devices-row__icon--current" aria-hidden="true">
                <img :src="currentDevice.icon === 'phone' ? iconPhone : iconLaptop" alt="" width="24" height="24" />
              </span>
              <span class="profile-devices-row__text">
                <span class="profile-devices-row__label">{{ sessionLabel(currentDevice) }}</span>
                <span class="profile-devices-row__hint">{{ sessionHint(currentDevice) }}</span>
              </span>
              <span class="profile-devices-row__chevron" aria-hidden="true">›</span>
            </button>
          </li>
        </ul>

        <p v-if="otherSessions.length" class="profile-devices-section-title">Активные сеансы</p>

        <ul v-if="otherSessions.length" class="profile-devices-list" role="list">
          <li v-for="device in otherSessions" :key="device.id">
            <button type="button" class="profile-devices-row" @click="openDevice(device)">
              <span class="profile-devices-row__icon" aria-hidden="true">
                <img :src="device.icon === 'phone' ? iconPhone : iconLaptop" alt="" width="24" height="24" />
              </span>
              <span class="profile-devices-row__text">
                <span class="profile-devices-row__label">{{ sessionLabel(device) }}</span>
                <span class="profile-devices-row__hint">{{ sessionHint(device) }}</span>
              </span>
              <span class="profile-devices-row__chevron" aria-hidden="true">›</span>
            </button>
          </li>
        </ul>

        <button
          v-if="otherSessions.length"
          type="button"
          class="profile-devices-end-sessions"
          :disabled="busy"
          @click="onRevokeOthers"
        >
          {{ busy && busyKind === 'others' ? 'Завершаем…' : 'Завершить другие сеансы' }}
        </button>
      </div>
    </template>

    <RrBottomSheet
      v-model="sheetOpen"
      :title="sheetTitle"
      :subtitle="selectedDevice?.lastSeen"
      height-mode="fit"
      footer-layout="stack"
    >
      <div v-if="selectedDevice" class="profile-device-sheet">
        <div
          class="profile-device-sheet__hero-icon"
          :class="{ 'profile-device-sheet__hero-icon--current': selectedDevice.isCurrent }"
        >
          <img
            :src="selectedDevice.icon === 'phone' ? iconPhone : iconLaptop"
            alt=""
            width="40"
            height="40"
          />
        </div>

        <div class="profile-device-sheet__meta">
          <div class="profile-device-sheet__meta-row">
            <span class="profile-device-sheet__meta-icon profile-device-sheet__meta-icon--globe" aria-hidden="true" />
            <span>{{ selectedDevice.browser }}</span>
          </div>
          <div v-if="selectedDevice.location" class="profile-device-sheet__meta-row">
            <span class="profile-device-sheet__meta-icon profile-device-sheet__meta-icon--pin" aria-hidden="true" />
            <span>{{ selectedDevice.location }}</span>
          </div>
        </div>

        <p v-if="sheetError" class="profile-devices-status profile-devices-status--error" role="alert">
          {{ sheetError }}
        </p>
        <p v-else-if="selectedDevice.isCurrent" class="profile-devices-status">
          Это текущее устройство — сеанс завершить нельзя
        </p>
      </div>

      <template #footer>
        <AuthRRButton
          v-if="selectedDevice && !selectedDevice.isCurrent"
          type="button"
          label="Завершить сеанс"
          :loading="busy && busyKind === 'one'"
          :disabled="busy"
          @click="onRevokeSelected"
        />
      </template>
    </RrBottomSheet>
  </ProfileSecurityShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { AuthRRButton, RrBottomSheet } from 'bibli/shared/ui/rr'
import {
  fetchUserSessions,
  revokeOtherUserSessions,
  revokeUserSession,
  type SecurityDeviceSession,
} from '../lib/userSessionsApi'
import ProfileSecurityShell from './ProfileSecurityShell.vue'
import iconLaptop from '../assets/security/icon-devices.svg'
import iconPhone from '../assets/security/icon-pin.svg'
import '../profile-security.css'

const loading = ref(true)
const busy = ref(false)
const busyKind = ref<'one' | 'others' | null>(null)
const errorText = ref('')
const sheetError = ref('')
const sessions = ref<SecurityDeviceSession[]>([])
const sheetOpen = ref(false)
const selectedDevice = ref<SecurityDeviceSession | null>(null)

const currentDevice = computed(() => sessions.value.find((d) => d.isCurrent) ?? null)
const otherSessions = computed(() => sessions.value.filter((d) => !d.isCurrent))

const sheetTitle = computed(() => {
  if (!selectedDevice.value) return ''
  return sessionDeviceName(selectedDevice.value)
})

function sessionDeviceName(session: SecurityDeviceSession): string {
  const parts = session.name.split(' · ')
  return parts.length > 1 ? parts[parts.length - 1]! : session.name
}

function sessionLabel(session: SecurityDeviceSession): string {
  return session.browser || session.name
}

function sessionHint(session: SecurityDeviceSession): string {
  const device = sessionDeviceName(session)
  if (session.isCurrent) return device === session.browser ? session.subtitle : `${device} · ${session.subtitle}`
  return `${device} · ${session.subtitle}`
}

onMounted(() => {
  void loadSessions()
})

async function loadSessions(): Promise<void> {
  loading.value = true
  errorText.value = ''
  const result = await fetchUserSessions()
  sessions.value = result.sessions
  errorText.value = result.error || ''
  loading.value = false
}

function openDevice(device: SecurityDeviceSession) {
  selectedDevice.value = device
  sheetError.value = ''
  sheetOpen.value = true
}

function applySessions(next: SecurityDeviceSession[]) {
  sessions.value = next
  if (selectedDevice.value) {
    const still = next.find((d) => d.id === selectedDevice.value?.id)
    if (!still) {
      sheetOpen.value = false
      selectedDevice.value = null
    } else {
      selectedDevice.value = still
    }
  }
}

async function onRevokeSelected(): Promise<void> {
  const device = selectedDevice.value
  if (!device || device.isCurrent || busy.value) return

  busy.value = true
  busyKind.value = 'one'
  sheetError.value = ''
  try {
    const result = await revokeUserSession(device.id)
    if (result.error || !result.sessions) {
      sheetError.value = result.error || 'Не удалось завершить сеанс'
      return
    }
    applySessions(result.sessions)
    sheetOpen.value = false
    selectedDevice.value = null
  } finally {
    busy.value = false
    busyKind.value = null
  }
}

async function onRevokeOthers(): Promise<void> {
  if (!otherSessions.value.length || busy.value) return

  busy.value = true
  busyKind.value = 'others'
  errorText.value = ''
  try {
    const result = await revokeOtherUserSessions()
    if (result.error || !result.sessions) {
      errorText.value = result.error || 'Не удалось завершить сеансы'
      return
    }
    applySessions(result.sessions)
    sheetOpen.value = false
    selectedDevice.value = null
  } finally {
    busy.value = false
    busyKind.value = null
  }
}
</script>
