<template>
  <section class="profile-activation-home" aria-label="Активация профиля">
    <header
      class="pah-hero"
      :style="{ '--pah-p': String(collapseProgress) }"
    >
      <img class="pah-hero__glow" :src="headerGlow" alt="" aria-hidden="true" />
      <div class="pah-hero__top">
        <button
          type="button"
          class="pah-user"
          :aria-label="displayName || 'Профиль'"
          aria-haspopup="true"
          :aria-expanded="userMenuOpen ? 'true' : 'false'"
          @click="onUserChipClick"
        >
          <span class="pah-user__avatar" aria-hidden="true">
            <img
              v-if="avatarUrl"
              class="pah-user__avatar-img"
              :src="avatarUrl"
              alt=""
              @error="onAvatarError"
            />
            <span v-else class="pah-user__avatar-fallback">{{ initials }}</span>
          </span>
          <span class="pah-user__name">{{ displayName || 'Профиль' }}</span>
          <span class="pah-user__chevron" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M6 4l4 4-4 4"
                stroke="currentColor"
                stroke-width="1.3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
        </button>

        <Menu
          ref="userMenuRef"
          id="pah-user-menu"
          :model="userMenuItems"
          :popup="true"
          @update:visible="userMenuOpen = $event"
        />

        <!-- TODO: временно скрыто — колокол уведомлений -->
        <button
          v-if="false"
          type="button"
          class="pah-bell"
          aria-label="Уведомления"
          @click="onNotificationsClick"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M9.74074 19.1919C10.3698 19.6944 11.2005 20 12.1111 20C13.0218 20 13.8524 19.6944 14.4815 19.1919M5.45123 16.606C5.07646 16.606 4.86715 16.0173 5.09384 15.6902C5.61988 14.9311 7 13.8179 7 12.4773L7.01803 10.5348C7.01803 6.92573 8.81849 4 12.1111 4C15.4522 4 17 6.96883 17 10.6311L16.982 12.4773C16.982 13.8271 18.6293 14.9464 19.1339 15.7058C19.3518 16.0337 19.142 16.606 18.7719 16.606H5.45123Z"
              stroke="currentColor"
              stroke-width="1.3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M12 2L12 3.49968"
              stroke="currentColor"
              stroke-width="1.3"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      <div class="pah-hero__welcome">
        <h1 class="pah-hero__title">
          <span class="pah-hero__greeting">Добро пожаловать{{ firstName ? ',' : '' }}</span>
          <span v-if="firstName" class="pah-hero__name">{{ firstName }}</span>
        </h1>
        <p class="pah-hero__subtitle">Пока вам доступен ограниченный режим</p>
      </div>
    </header>

    <div class="pah-body">
      <div class="pah-status" :data-kind="headline.kind">
        <h2 class="pah-status__title">{{ headline.title }}</h2>
        <p v-if="headline.subtitle" class="pah-status__subtitle">{{ headline.subtitle }}</p>
      </div>

      <ul class="pah-grid" role="list">
        <li v-for="card in cards" :key="card.id">
          <button
            type="button"
            class="pah-card"
            :disabled="statusesUnavailable"
            @click="onOpenStep(card.id)"
          >
            <img
              class="pah-card__art"
              :src="card.art"
              alt=""
              :width="card.artW"
              :height="card.artH"
              decoding="async"
              draggable="false"
            />
            <span class="pah-card__title">{{ card.title }}</span>
            <span
              class="pah-card__status"
              :class="statusClass(card.id)"
            >
              {{ statusLabel(card.id) }}
            </span>
          </button>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup>
import {
  computed,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  watch,
} from 'vue'
import { useProfileApi, useProfileNavigate, useProfileLegacyExtras } from '../composables/useProfileServices'
import { rememberPhotosFromResponse } from './lib/seedWizardPhotos'
import { Menu } from 'bibli/shared/ui'
import {
  activationBlockStatusClass,
  activationBlockStatusLabel,
} from './lib/activationBlockStatus'
import { resolveActivationHomeHeadline } from './lib/activationHomeHeadline'
import { openActivationStep } from './lib/openActivationStep'
import {
  activationHubVisibleNonce,
  activationStepStatuses,
  beginActivationLoad,
  hasPendingActivationStatuses,
  isActivationLoadCurrent,
  mergeActivationFromUser,
} from './lib/activationStatusSync'
import headerGlow from './assets/activation/home/header-glow.svg'
import artPersonal from './assets/activation/home/personal.webp'
import artPassport from './assets/activation/home/passport.webp'
import artSnils from './assets/activation/home/snils.webp'
import artInn from './assets/activation/home/inn.webp'
import artBank from './assets/activation/home/bank.webp'
import artAgentType from './assets/activation/home/agent-type.webp'
import './profile-activation-home.css'

const HOME_CARD_META = [
  { id: 'personal', title: 'Личные данные', art: artPersonal, artW: 112, artH: 112 },
  { id: 'passport', title: 'Паспорт РФ', art: artPassport, artW: 112, artH: 112 },
  { id: 'snils', title: 'СНИЛС', art: artSnils, artW: 112, artH: 112 },
  { id: 'inn', title: 'ИНН', art: artInn, artW: 112, artH: 112 },
  { id: 'bank', title: 'Банковские реквизиты', art: artBank, artW: 112, artH: 112 },
  { id: 'agent-type', title: 'Тип оформления', art: artAgentType, artW: 112, artH: 112 },
]

const navigateTo = useProfileNavigate()
const { getActivationStatus, getUserData, getProfilePhotos, getDocumentUrl } =
  useProfileApi()
const legacyExtras = useProfileLegacyExtras()
const userMenuRef = ref(null)
const userMenuOpen = ref(false)
/** NEW_USER: полноценного /profile ещё нет — выход из меню на чипе. */
const userMenuItems = [
  {
    label: 'Выход',
    command: async () => { await legacyExtras.logoutGlobal?.() },
  },
]

const statusesUnavailable = ref(false)
const accountType = ref(null)
const firstName = ref('')
const displayName = ref('')
const avatarUrl = ref('')
/** 0 = expanded (~160px), 1 = compact sticky bar */
const collapseProgress = ref(0)

const COLLAPSE_DISTANCE_PX = 104
/** @type {Window | Element | null} */
let scrollTarget = null

const cards = HOME_CARD_META
const stepStatuses = activationStepStatuses

const headline = computed(() => resolveActivationHomeHeadline(stepStatuses))

const initials = computed(() => {
  const source = displayName.value || firstName.value
  const parts = source.trim().split(/[\s-]+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0].slice(0, 1) + parts[1].slice(0, 1)).toUpperCase()
})

function statusLabel(stepId) {
  return activationBlockStatusLabel(stepStatuses[stepId], {
    unavailable: statusesUnavailable.value,
    audience: 'agent',
  })
}

function statusClass(stepId) {
  return activationBlockStatusClass(stepStatuses[stepId], {
    unavailable: statusesUnavailable.value,
    prefix: 'pah-card__status',
  })
}

function onAvatarError() {
  avatarUrl.value = ''
}

function applyUser(user) {
  if (!user || typeof user !== 'object') return
  const name = String(user.name || user.first_name || '').trim()
  const surname = String(user.surname || user.last_name || '').trim()
  firstName.value = name
  displayName.value = [name, surname].filter(Boolean).join(' ') || name

  const rawType = user.account_type
  accountType.value =
    rawType === null || rawType === undefined || rawType === ''
      ? null
      : Number(rawType)
}

async function loadAvatarFromBackend() {
  try {
    const res = await getProfilePhotos()
    rememberPhotosFromResponse(res)
    const selfie = res?.data?.personal_selfie
    const code = selfie?.code ? String(selfie.code) : ''
    avatarUrl.value = code ? getDocumentUrl(code) : ''
  } catch {
    avatarUrl.value = ''
  }
}

async function loadHomeMeta() {
  const generation = beginActivationLoad()
  try {
    const res = await getActivationStatus()
    if (!isActivationLoadCurrent(generation)) return
    const activation = res?.data ?? res
    mergeActivationFromUser({ activation })
    applyUser(activation)
    statusesUnavailable.value = false
  } catch {
    if (!isActivationLoadCurrent(generation)) return
    statusesUnavailable.value = !hasPendingActivationStatuses()
  }

  try {
    const userRes = await getUserData()
    const user = userRes?.data ?? userRes
    applyUser(user)
    if (user?.activation) {
      mergeActivationFromUser(user)
    }
  } catch {
    /* optional enrichment */
  }

  if (!isActivationLoadCurrent(generation)) return
  await loadAvatarFromBackend()
}

function onOpenStep(stepId) {
  openActivationStep(stepId, {
    navigateTo,
    stepStatuses,
    accountType: accountType.value,
    unavailable: statusesUnavailable.value,
  })
}

function onUserChipClick(event) {
  userMenuRef.value?.toggle?.(event)
}

function onNotificationsClick() {
  /* Уведомления для NEW_USER пока недоступны. */
}

function updateCollapse() {
  const y = scrollTarget && 'scrollTop' in scrollTarget
    ? Number(scrollTarget.scrollTop) || 0
    : Number(window.scrollY || document.documentElement.scrollTop || 0)
  collapseProgress.value = Math.min(1, Math.max(0, y / COLLAPSE_DISTANCE_PX))
}

function bindCollapseScroll() {
  unbindCollapseScroll()
  /* Скролл на самом хабе (new-user-home-lock), не на content-wrapper */
  const root =
    document.querySelector('.profile-activation-home') ||
    document.querySelector('.content-wrapper')
  scrollTarget = root || window
  scrollTarget.addEventListener('scroll', updateCollapse, { passive: true })
  updateCollapse()
}

function unbindCollapseScroll() {
  if (!scrollTarget) return
  scrollTarget.removeEventListener('scroll', updateCollapse)
  scrollTarget = null
}

onMounted(() => {
  void loadHomeMeta()
  bindCollapseScroll()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('rr-ptr-rebind'))
  }
})

onActivated(() => {
  void loadHomeMeta()
  bindCollapseScroll()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('rr-ptr-rebind'))
  }
})

onDeactivated(() => {
  unbindCollapseScroll()
})

onBeforeUnmount(() => {
  unbindCollapseScroll()
})

watch(activationHubVisibleNonce, () => {
  void loadHomeMeta()
})
</script>
