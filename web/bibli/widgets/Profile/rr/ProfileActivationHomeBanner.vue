<template>
  <button
    v-if="visible"
    type="button"
    class="profile-activation-home-banner"
    :data-kind="headline.kind"
    @click="onOpen"
  >
    <div class="profile-activation-home-banner__body">
      <h2 class="profile-activation-home-banner__title">{{ headline.title }}</h2>
      <p
        v-if="headline.subtitle"
        class="profile-activation-home-banner__line profile-activation-home-banner__line--muted"
      >
        {{ headline.subtitle }}
      </p>
    </div>
    <div class="profile-activation-home-banner__action">
      <RrStatusBadge
        v-if="statusView?.kind === 'badge'"
        :label="statusView.label"
        :name="statusView.label"
        :id="homeBadgeId(statusView.tone)"
        :tone="homeBadgeTone(statusView.tone)"
        :icon="homeBadgeIcon(statusView.tone)"
        kind="registration"
        size="sm"
      />
      <span
        v-else-if="statusView?.kind === 'progress'"
        class="profile-activation-home-banner__progress"
      >
        <svg
          class="profile-activation-home-banner__progress-ring"
          viewBox="0 0 16 16"
          width="16"
          height="16"
          aria-hidden="true"
        >
          <circle
            class="profile-activation-home-banner__progress-ring-track"
            cx="8"
            cy="8"
            r="6"
            fill="none"
          />
          <circle
            class="profile-activation-home-banner__progress-ring-value"
            cx="8"
            cy="8"
            r="6"
            fill="none"
            :stroke-dasharray="progressRing.circumference"
            :stroke-dashoffset="progressRing.offset"
          />
        </svg>
        {{ statusView.label }}
      </span>
      <span
        v-else-if="statusView?.kind === 'link'"
        class="profile-activation-home-banner__link"
      >
        {{ statusView.label }}
      </span>
    </div>
    <img
      class="profile-activation-home-banner__art"
      :src="bannerArt"
      alt=""
      width="125"
      height="126"
      decoding="async"
    />
  </button>
</template>

<script setup>
import { computed, onActivated, onMounted, ref, watch } from 'vue'
import { RrStatusBadge } from 'bibli/shared/ui/rr'
import { useProfileApi, useProfileNavigate } from '../composables/useProfileServices'
import {
  resolveActivationHomeBannerStatus,
} from './lib/activationBlockStatus'
import { resolveActivationHomeHeadline } from './lib/activationHomeHeadline'
import { ACTIVATION_STEPS } from './lib/activationSteps'
import {
  activationHubVisibleNonce,
  activationStepStatuses,
  beginActivationLoad,
  isActivationLoadCurrent,
  mergeActivationFromUser,
} from './lib/activationStatusSync'
import bannerArt from './assets/activation/home-banner.png'
import './profile-activation-home-banner.css'

/** Маппинг тонов баннера → пресеты как в таблице оформления */
function homeBadgeId(tone) {
  if (tone === 'review') return 'review'
  if (tone === 'done') return 'accepted'
  return 'remarks'
}

function homeBadgeTone(tone) {
  if (tone === 'review') return 'warning'
  if (tone === 'done') return 'success'
  return 'danger'
}

function homeBadgeIcon(tone) {
  if (tone === 'review') return 'pause'
  if (tone === 'done') return 'check'
  return 'stop'
}

const navigateTo = useProfileNavigate()
const { getActivationStatus, getUserData } = useProfileApi()

const trialDaysLeft = ref(null)
const statusesReady = ref(false)

const headline = computed(() =>
  resolveActivationHomeHeadline(activationStepStatuses, {
    trialDaysLeft: trialDaysLeft.value,
  }),
)
const statusView = computed(() =>
  resolveActivationHomeBannerStatus(activationStepStatuses, {
    trialDaysLeft: trialDaysLeft.value,
  }),
)

const PROGRESS_RING_RADIUS = 6
const PROGRESS_RING_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RING_RADIUS

const progressRing = computed(() => {
  const view = statusView.value
  if (view?.kind !== 'progress' || view.total <= 0) {
    return {
      circumference: PROGRESS_RING_CIRCUMFERENCE,
      offset: PROGRESS_RING_CIRCUMFERENCE,
    }
  }
  const ratio = Math.min(1, Math.max(0, view.completed / view.total))
  return {
    circumference: PROGRESS_RING_CIRCUMFERENCE,
    offset: PROGRESS_RING_CIRCUMFERENCE * (1 - ratio),
  }
})

/** Пока активация не полностью принята — баннер на главной со сменами. */
const visible = computed(() => {
  if (!statusesReady.value) return false
  return !ACTIVATION_STEPS.every((step) => activationStepStatuses[step.id] === 'done')
})

async function loadBannerMeta() {
  const generation = beginActivationLoad()
  try {
    const res = await getActivationStatus()
    // Другой экран мог стартовать более новый load — всё равно показываем баннер
    // по текущему shared-стейту, иначе statusesReady залипает в false.
    if (isActivationLoadCurrent(generation)) {
      mergeActivationFromUser({ activation: res?.data ?? res })
    }
    statusesReady.value = true
  } catch {
    /* без статусов баннер не показываем — иначе ложный «заполните» */
    statusesReady.value = false
  }

  try {
    const userRes = await getUserData()
    const user = userRes?.data ?? userRes
    if (user?.trainee?.days_left != null) {
      trialDaysLeft.value = user.trainee.days_left
    }
  } catch {
    /* trainee line optional */
  }
}

function onOpen() {
  // Список шагов («N из 5»), не первый визард и не мобильный overflow /profile.
  void navigateTo('/profile/activation')
}

onMounted(() => {
  void loadBannerMeta()
})

onActivated(() => {
  void loadBannerMeta()
})

watch(activationHubVisibleNonce, () => {
  void loadBannerMeta()
})
</script>
