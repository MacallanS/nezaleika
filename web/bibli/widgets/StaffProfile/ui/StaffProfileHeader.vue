<template>
  <section class="staff-profile-header">
    <div class="staff-profile-header__top">
      <div class="staff-profile-header__top-start">
        <div class="staff-profile-header__badges">
          <RrStatusBadge
            v-if="systemStatus"
            class="rr-grid-list__badge"
            :kind="systemStatusKind"
            :id="systemStatus.id"
            :label="systemStatus.name"
            size="sm"
          />
          <RrStatusBadge
            v-if="onecStatusBadge"
            class="rr-grid-list__badge"
            kind="onec"
            :id="onecStatusBadge.id"
            :label="onecStatusBadge.label"
            size="sm"
          />
        </div>
      </div>

      <div class="staff-profile-header__avatar-wrap">
        <img
          v-if="avatarUrl"
          :src="avatarUrl"
          alt=""
          class="staff-profile-header__avatar-img"
          decoding="async"
        />
        <div v-else class="staff-profile-header__avatar" aria-hidden="true">
          {{ initials }}
        </div>
      </div>

      <div v-if="showDownload || moreItems.length" class="staff-profile-header__actions">
        <button
          v-if="showDownload"
          type="button"
          class="staff-profile-header__icon-btn"
          aria-label="Скачать документы"
          :disabled="downloadLoading"
          @click="emit('download')"
        >
          <img class="staff-profile-header__icon" :src="iconDownload" alt="" width="24" height="24" />
        </button>
        <StaffProfileMoreMenu v-if="moreItems.length" :items="moreItems" />
      </div>
    </div>

    <div class="staff-profile-header__identity">
      <div class="staff-profile-header__name-row">
        <h1 class="staff-profile-header__name">{{ fullName }}</h1>
        <button
          v-if="canCopyFullName"
          type="button"
          class="staff-profile-header__name-copy"
          aria-label="Копировать ФИО"
          @click="emit('copy', fullName)"
        >
          <img class="staff-profile-header__copy" :src="iconCopy" alt="" width="24" height="24" />
        </button>
      </div>
      <p class="staff-profile-header__location">{{ locationLabel }}</p>
    </div>

    <div class="staff-profile-header__contacts">
      <div class="staff-profile-header__contact" :class="{ 'staff-profile-header__contact--disabled': !phone }">
        <button
          type="button"
          class="staff-profile-header__contact-main"
          :disabled="!phone"
          aria-label="Позвонить"
          @click="openPhone"
        >
          <img class="staff-profile-header__contact-icon" :src="iconPhone" alt="" width="24" height="24" />
          <span class="staff-profile-header__contact-value">{{ phoneLabel }}</span>
        </button>
        <button
          type="button"
          class="staff-profile-header__copy-wrap"
          :disabled="!phone"
          aria-label="Копировать телефон"
          @click="emit('copy', phoneLabel)"
        >
          <img class="staff-profile-header__copy" :src="iconCopy" alt="" width="24" height="24" />
        </button>
      </div>
      <div class="staff-profile-header__contact" :class="{ 'staff-profile-header__contact--disabled': !telegram }">
        <button
          type="button"
          class="staff-profile-header__contact-main"
          :disabled="!telegram"
          aria-label="Открыть Telegram"
          @click="openTelegram"
        >
          <img class="staff-profile-header__contact-icon" :src="iconTelegram" alt="" width="24" height="24" />
          <span class="staff-profile-header__contact-value">{{ telegramLabel }}</span>
        </button>
        <button
          type="button"
          class="staff-profile-header__copy-wrap"
          :disabled="!telegram"
          aria-label="Копировать Telegram"
          @click="emit('copy', telegramLabel)"
        >
          <img class="staff-profile-header__copy" :src="iconCopy" alt="" width="24" height="24" />
        </button>
      </div>
      <div class="staff-profile-header__contact" :class="{ 'staff-profile-header__contact--disabled': !email }">
        <button
          type="button"
          class="staff-profile-header__contact-main"
          :disabled="!email"
          aria-label="Написать письмо"
          @click="openEmail"
        >
          <img class="staff-profile-header__contact-icon" :src="iconEmail" alt="" width="24" height="24" />
          <span class="staff-profile-header__contact-value">{{ email || '—' }}</span>
        </button>
        <button
          type="button"
          class="staff-profile-header__copy-wrap"
          :disabled="!email"
          aria-label="Копировать email"
          @click="emit('copy', email || '')"
        >
          <img class="staff-profile-header__copy" :src="iconCopy" alt="" width="24" height="24" />
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RrStatusBadge from 'bibli/shared/ui/rr/list/RrStatusBadge.vue'
import StaffProfileMoreMenu from './StaffProfileMoreMenu.vue'
import type { RegistrationSystemStatus } from 'bibli/widgets/Onboarding/lib/registrationSystemStatus'
import { onecStatusLabel } from 'bibli/widgets/Onboarding/lib/onecSyncUtils'
import {
  formatStaffContactPhone,
  formatTelegramHandle,
} from '../lib/staffProfileFormat'
import iconPhone from '../assets/icons/phone.svg'
import iconTelegram from '../assets/icons/telegram.svg'
import iconEmail from '../assets/icons/email.svg'
import iconCopy from '../assets/icons/copy.svg'
import iconDownload from '../assets/icons/download.svg'
import type { StaffProfileMoreMenuItem } from '../composables/useStaffProfileMoreActions'

const props = withDefaults(
  defineProps<{
    fullName: string
    initials: string
    avatarUrl?: string | null
    locationLabel: string
    phone: string | null
    email: string | null
    telegram: string | null
    systemStatus: RegistrationSystemStatus | null
    onecSyncStatus?: string | null
    downloadLoading?: boolean
    moreItems?: StaffProfileMoreMenuItem[]
    showDownload?: boolean
  }>(),
  {
    onecSyncStatus: null,
    downloadLoading: false,
    moreItems: () => [],
    showDownload: true,
  },
)

const emit = defineEmits<{
  copy: [value: string]
  download: []
}>()

const phoneLabel = computed(() => formatStaffContactPhone(props.phone))
const telegramLabel = computed(() => formatTelegramHandle(props.telegram))
const canCopyFullName = computed(() => {
  const value = String(props.fullName || '').trim()
  return Boolean(value) && value !== '—'
})

const SIGNING_STATUS_IDS = new Set([
  'waiting',
  'waiting_send',
  'on_signing',
  'signed',
  'suspended',
])

const systemStatusKind = computed(() =>
  props.systemStatus?.id && SIGNING_STATUS_IDS.has(String(props.systemStatus.id))
    ? 'signing'
    : 'registration',
)

const onecStatusBadge = computed(() => {
  const status = String(props.onecSyncStatus ?? '').trim()
  if (!status) return null
  // В шапке показываем только значимые статусы 1С, не «в очереди».
  if (status === 'pending') return null
  const base = onecStatusLabel(status)
  return {
    id: status,
    // Рядом со статусом подписания явно помечаем, что бейдж про синхронизацию.
    label: `Синхронизация: ${base}`,
  }
})

function openExternal(url: string): void {
  if (typeof window === 'undefined' || !url) return
  window.location.href = url
}

function openPhone(): void {
  let digits = String(props.phone || '').replace(/\D/g, '')
  if (!digits) return
  if (digits.length === 11 && digits.startsWith('8')) {
    digits = `7${digits.slice(1)}`
  }
  openExternal(`tel:+${digits}`)
}

function openTelegram(): void {
  const raw = String(props.telegram || '').trim()
  if (!raw) return
  const username = raw.replace(/^@+/, '').replace(/^https?:\/\/(t\.me|telegram\.me)\//i, '')
  if (!username) return
  openExternal(`https://t.me/${encodeURIComponent(username)}`)
}

function openEmail(): void {
  const value = String(props.email || '').trim()
  if (!value) return
  openExternal(`mailto:${value}`)
}
</script>

<style scoped>
.staff-profile-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.staff-profile-header__top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 96px minmax(0, 1fr);
  align-items: start;
  column-gap: 12px;
}

.staff-profile-header__top-start {
  display: flex;
  align-items: flex-start;
  min-width: 0;
}

.staff-profile-header__badges {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  min-width: 0;
}

.staff-profile-header__actions {
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  position: relative;
}

.staff-profile-header__icon-btn {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  gap: var(--rr-spacing-padding-s, 4px);
  padding: var(--rr-spacing-padding-l, 12px);
  border: none;
  border-radius: var(--rr-radius-m, 8px);
  background: var(--rr-button-neutral-secondary-background-default, #f2f3f7);
  color: var(--rr-button-neutral-secondary-text-default, #101012);
  cursor: pointer;
}

.staff-profile-header__icon {
  display: block;
  width: 24px;
  height: 24px;
}

.staff-profile-header__icon-btn:hover:not(:disabled) {
  background: var(--rr-button-neutral-secondary-background-hover, #e7e8ee);
}

.staff-profile-header__icon-btn:focus-visible {
  outline: 2px solid var(--rr-input-border-active, #1c4ae5);
  outline-offset: 2px;
}

.staff-profile-header__icon-btn:disabled {
  opacity: 0.45;
  cursor: default;
}

.staff-profile-header__identity {
  text-align: center;
}

.staff-profile-header__name-row {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  max-width: 100%;
}

.staff-profile-header__name-copy {
  box-sizing: border-box;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  line-height: 0;
  cursor: pointer;
}

.staff-profile-header__name-copy:hover {
  opacity: 0.82;
}

.staff-profile-header__name-copy:focus-visible {
  outline: 2px solid var(--rr-input-border-active, #1c4ae5);
  outline-offset: 2px;
}

.staff-profile-header__avatar-wrap {
  display: grid;
  place-items: center;
  width: 96px;
  height: 96px;
  flex-shrink: 0;
  border-radius: 14px;
  background: #dbeafe;
  overflow: hidden;
}

.staff-profile-header__avatar,
.staff-profile-header__avatar-img {
  width: 96px;
  height: 96px;
  border-radius: 14px;
  object-fit: cover;
}

.staff-profile-header__avatar-img {
  display: block;
  object-position: center 22%;
}

.staff-profile-header__avatar {
  background: linear-gradient(135deg, #5b8def, #3b6fe0);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.staff-profile-header__name {
  margin: 0;
  min-width: 0;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 500;
  font-size: var(--rr-font-size-font-size-2xl, 32px);
  line-height: var(--rr-line-height-line-height-2xl, 32px);
  letter-spacing: var(--rr-tracking-tracking-2xl, -1px);
  vertical-align: middle;
  color: var(--rr-labels-neutral-primary, #101012);
}

.staff-profile-header__location {
  margin: 4px 0 0;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 400;
  font-size: var(--rr-font-size-font-size-m, 16px);
  line-height: var(--rr-line-height-line-height-m, 24px);
  letter-spacing: var(--rr-tracking-tracking-m, 0px);
  vertical-align: middle;
  color: var(--rr-labels-neutral-primary, #101012);
}

.staff-profile-header__contacts {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
}

.staff-profile-header__contact {
  box-sizing: border-box;
  display: flex;
  align-items: stretch;
  height: 40px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--rr-labels-neutral-primary, #101012);
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-size: var(--rr-font-size-font-size-s, 14px);
  line-height: var(--rr-line-height-line-height-s, 20px);
  gap: 1px;
}

.staff-profile-header__contact-main {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  height: 40px;
  margin: 0;
  padding: 8px;
  border: none;
  border-radius: 8px 0 0 8px;
  background: var(--rr-backgrounds-quaternary, #f2f3f7);
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.staff-profile-header__contact-value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.staff-profile-header__copy-wrap {
  box-sizing: border-box;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin: 0;
  padding: 0;
  border: none;
  line-height: 0;
  border-radius: 0 8px 8px 0;
  background: var(--rr-backgrounds-quaternary, #f2f3f7);
  cursor: pointer;
}

.staff-profile-header__contact-icon,
.staff-profile-header__copy {
  display: block;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
}

.staff-profile-header__contact--disabled {
  opacity: 0.55;
}

.staff-profile-header__contact-main:disabled,
.staff-profile-header__copy-wrap:disabled {
  cursor: default;
}
</style>
