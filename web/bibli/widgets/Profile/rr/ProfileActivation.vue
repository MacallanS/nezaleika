<template>
  <div class="profile-activation-root">
    <div v-if="isLoading" class="profile-activation__loader">Загрузка...</div>

    <div v-else class="profile-activation">
      <div class="profile-activation__shell">
      <header class="profile-activation__header">
        <button
          type="button"
          class="profile-activation__back"
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
        <p class="profile-activation__progress" aria-live="polite">
          {{ completedCount }} из {{ progressTotal }}
        </p>
      </header>

      <div class="profile-activation__intro">
        <h1 class="profile-activation__title">
          {{ profileLocked ? 'Профиль' : 'Активация профиля' }}
        </h1>
        <p class="profile-activation__subtitle">
          {{
            profileLocked
              ? 'Данные отправлены. Можно только просмотреть'
              : 'Шаги можно заполнять в любом порядке'
          }}
        </p>
      </div>

      <ul class="profile-activation__list" role="list">
        <li v-for="step in steps" :key="step.id">
          <button
            type="button"
            class="profile-activation__card"
            :disabled="statusesUnavailable"
            @click="onOpenStep(step.id)"
          >
            <img
              class="profile-activation__icon"
              :src="step.icon"
              :alt="step.title"
              width="40"
              height="40"
              decoding="async"
            />
            <span class="profile-activation__card-text">
              <span class="profile-activation__card-title">{{ step.title }}</span>
              <span
                class="profile-activation__card-status"
                :class="statusClass(stepStatuses[step.id])"
              >
                {{ statusLabel(stepStatuses[step.id]) }}
              </span>
            </span>
            <span class="profile-activation__chevron" aria-hidden="true">
              <svg
                class="profile-activation__chevron-icon"
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M14 11L19 16L14 21"
                  stroke="currentColor"
                  stroke-width="1.3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
          </button>
        </li>
      </ul>

      <div v-if="canClearPersonalData" class="profile-activation__clear">
        <button
          type="button"
          class="profile-activation__clear-btn"
          :disabled="isClearingData"
          @click="showClearModal = true"
        >
          Удалить все данные
        </button>
        <p v-if="clearError" class="profile-activation__clear-error" role="alert">
          {{ clearError }}
        </p>
      </div>
      </div>
    </div>

    <RrBottomSheet
      v-if="canClearPersonalData"
      v-model="showClearModal"
      height-mode="fit"
      :height-percent="90"
      title="Удаление персональных данных"
      title-id="profile-clear-title"
      footer-layout="row"
      :closing-locked="isClearingData"
      :close-on-backdrop="!isClearingData"
    >
      <p>
        Будут удалены паспортные данные, email, контакты, документы и данные самозанятого/ИП.
      </p>
      <p class="profile-activation__clear-warn">Это действие необратимо.</p>
      <template #footer>
        <button
          type="button"
          class="profile-activation__sheet-btn profile-activation__sheet-btn--cancel"
          :disabled="isClearingData"
          @click="showClearModal = false"
        >
          Отмена
        </button>
        <button
          type="button"
          class="profile-activation__sheet-btn profile-activation__sheet-btn--danger"
          :disabled="isClearingData"
          @click="handleClearPersonalData"
        >
          {{ isClearingData ? 'Удаление…' : 'Да, удалить' }}
        </button>
      </template>
    </RrBottomSheet>
  </div>
</template>

<script setup>
import { computed, onActivated, onMounted, ref, watch } from 'vue'
import { useProfileApi, useProfileNavigate } from '../composables/useProfileServices'
import { parseApiErrorDetail } from 'bibli/widgets/Profile/lib/parseApiError'
import { RrBottomSheet } from 'bibli/shared/ui/rr'
import {
  ACTIVATION_PROGRESS_TOTAL,
  ACTIVATION_STEPS,
  isActivationStepLocked,
} from './lib/activationSteps'
import {
  activationBlockStatusClass,
  activationBlockStatusLabel,
} from './lib/activationBlockStatus'
import 'bibli/widgets/Profile/rr/lib/activation-block-status.css'
import {
  activationHubVisibleNonce,
  activationStepStatuses,
  beginActivationLoad,
  hasPendingActivationStatuses,
  isActivationLoadCurrent,
  mergeActivationFromUser,
  resetActivationStatuses,
} from './lib/activationStatusSync'
import { openActivationStep } from './lib/openActivationStep'

const api = useProfileApi()
const navigateTo = useProfileNavigate()
const {
  clearPersonalData,
  getActivationStatus,
} = api

const props = defineProps({
  /** Только админ может сбрасывать персональные данные (host: useRoles().isAdmin). */
  canClearPersonalData: { type: Boolean, default: false },
})

const isLoading = ref(true)
/** true, если GET /api/user не ответил (таймаут/отмена/ошибка) — статусы неизвестны */
const statusesUnavailable = ref(false)
const steps = ACTIVATION_STEPS
const progressTotal = ACTIVATION_PROGRESS_TOTAL
const showClearModal = ref(false)
const isClearingData = ref(false)
const clearError = ref('')

const stepStatuses = activationStepStatuses
/** account_type из GET /api/user — для перехода к СЗ/ИП в режиме просмотра */
const accountType = ref(null)

const completedCount = computed(() =>
  ACTIVATION_STEPS.filter(
    (step) =>
      step.countsTowardProgress &&
      (stepStatuses[step.id] === 'done' || stepStatuses[step.id] === 'review'),
  ).length,
)

/** Все шаги прогресса уже отправлены — только просмотр. */
const profileLocked = computed(() =>
  ACTIVATION_STEPS.filter((step) => step.countsTowardProgress).every((step) =>
    isActivationStepLocked(stepStatuses[step.id]),
  ),
)

function statusLabel(status) {
  return activationBlockStatusLabel(status, {
    unavailable: statusesUnavailable.value,
    audience: 'agent',
  })
}

function statusClass(status) {
  return activationBlockStatusClass(status, {
    unavailable: statusesUnavailable.value,
    prefix: 'profile-activation__card-status',
  })
}

function applyAccountType(user) {
  const rawType = user?.account_type
  accountType.value =
    rawType === null || rawType === undefined || rawType === ''
      ? null
      : Number(rawType)
}

async function loadActivationStatuses() {
  const generation = beginActivationLoad()
  try {
    const res = await getActivationStatus()
    if (!isActivationLoadCurrent(generation)) return
    const activation = res?.data ?? res
    mergeActivationFromUser({ activation })
    applyAccountType(activation)
    statusesUnavailable.value = false
  } catch (err) {
    if (!isActivationLoadCurrent(generation)) return
    console.error('[profile-activation] failed to load statuses', err)
    statusesUnavailable.value = !hasPendingActivationStatuses()
  }
}

function onBack() {
  void navigateTo('/')
}

function onOpenStep(stepId) {
  openActivationStep(stepId, {
    navigateTo,
    stepStatuses,
    accountType: accountType.value,
    unavailable: statusesUnavailable.value,
  })
}

async function handleClearPersonalData() {
  if (!props.canClearPersonalData || isClearingData.value) return
  clearError.value = ''
  isClearingData.value = true
  try {
    const result = await clearPersonalData()
    if (!result?.status && result?.status !== undefined) {
      clearError.value = 'Не удалось удалить данные'
      return
    }
    showClearModal.value = false
    resetActivationStatuses()
    accountType.value = null
    statusesUnavailable.value = false
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('profile-data-cleared-at', String(Date.now()))
      }
    } catch {
      /* ignore */
    }
    await loadActivationStatuses()
  } catch (err) {
    console.error('[profile-activation] clear failed', err)
    clearError.value =
      parseApiErrorDetail(err, 'Ошибка при удалении данных') || 'Ошибка при удалении данных'
  } finally {
    isClearingData.value = false
  }
}

onMounted(async () => {
  await loadActivationStatuses()
  isLoading.value = false
})

/** Keepalive + Suspense: onActivated у этого виджета может не прийти — слушаем nonce с хаба. */
onActivated(() => {
  if (isLoading.value) return
  void loadActivationStatuses()
})

watch(activationHubVisibleNonce, () => {
  if (isLoading.value) return
  void loadActivationStatuses()
})
</script>

<style scoped>
.profile-activation-root,
.profile-activation-root *,
.profile-activation-root *::before,
.profile-activation-root *::after {
  box-sizing: border-box;
}

.profile-activation-root {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  flex: 1 1 0;
  overflow: hidden;
  overscroll-behavior: none;
  -webkit-overscroll-behavior: none;
  touch-action: pan-y;
}

.profile-activation {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  flex: 1 1 auto;
  overflow: hidden;
  background: var(--rr-backgrounds-quaternary);
  color: var(--rr-labels-neutral-primary, #101012);
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
}

/* Desktop: та же колонка 480px, что у home activation / step shell */
@media (min-width: 768px) {
  .profile-activation-root,
  .profile-activation {
    max-width: 480px;
    margin-inline: auto;
  }
}

.profile-activation__loader {
  display: grid;
  place-items: center;
  flex: 1;
  min-height: 40vh;
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
}

.profile-activation__shell {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: none;
  flex: 1 1 auto;
  min-height: 0;
  margin: 0;
  padding:
    calc(
      var(--app-page-rr-header-top, var(--rr-spacing-padding-m, 8px)) + env(safe-area-inset-top, 0px)
    )
    var(--app-page-rr-gutter, var(--rr-spacing-padding-xl, 16px))
    calc(var(--rr-spacing-padding-3-xl, 24px) + env(safe-area-inset-bottom, 0px));
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  scrollbar-width: none;
}

.profile-activation__shell::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

/* Мобилка: клиренс таббара (полная высота + safe-area уже в --app-mobile-tabbar-content-inset) */
@media (max-width: 767px) {
  .profile-activation__shell {
    padding-bottom: calc(
      var(--rr-spacing-padding-3-xl, 24px) + var(--app-mobile-tabbar-content-inset, 68px)
    );
  }
}

.profile-activation__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--rr-size-3-xl);
  margin-bottom: var(--rr-spacing-padding-xl, 16px);
  flex: 0 0 auto;
}

.profile-activation__back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--rr-size-3-xl);
  height: var(--rr-size-3-xl);
  margin: 0 0 0 calc(var(--rr-spacing-padding-m) * -1);
  padding: 0;
  border: none;
  border-radius: var(--rr-radius-m, 8px);
  background: transparent;
  color: var(--rr-labels-neutral-primary, #101012);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

@media (hover: hover) and (pointer: fine) {
  .profile-activation__back:hover {
    background: var(--rr-backgrounds-neutral-quinary-hover, #e7e7e9);
  }
}

.profile-activation__back:active {
  background: var(--rr-backgrounds-neutral-quinary-active, #cdcdd6);
}

.profile-activation__progress {
  margin: 0;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-size: var(--rr-font-size-font-size-s, 14px);
  line-height: var(--rr-line-height-line-height-s, 20px);
  letter-spacing: var(--rr-tracking-tracking-s, 0px);
  font-weight: 500;
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
}

.profile-activation__intro {
  margin-bottom: var(--rr-spacing-padding-xl, 16px);
}

.profile-activation__title {
  margin: 0 0 var(--rr-spacing-margin-s, 4px);
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 600;
  font-style: normal;
  font-size: var(--rr-font-size-font-size-xl, 24px);
  line-height: var(--rr-line-height-line-height-xl, 24px);
  letter-spacing: var(--rr-tracking-tracking-xl, -0.5px);
  color: var(--rr-labels-neutral-primary, #101012);
}

.profile-activation__subtitle {
  margin: 0;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-size: var(--rr-font-size-font-size-m, 16px);
  line-height: var(--rr-line-height-line-height-m, 24px);
  letter-spacing: var(--rr-tracking-tracking-m, 0px);
  font-weight: 400;
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
}

.profile-activation__list {
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-s, 4px);
  margin: 0;
  padding: 0;
  list-style: none;
}

.profile-activation__card {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: var(--rr-spacing-padding-l, 12px);
  width: 100%;
  min-height: 64px;
  padding: var(--rr-spacing-padding-l, 12px) var(--rr-spacing-padding-m, 8px);
  border: none;
  border-radius: var(--rr-radius-xl, 16px);
  background: var(--rr-backgrounds-primary, #fff);
  color: inherit;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 var(--rr-px-1, 1px) var(--rr-px-2, 2px) var(--rr-fx-shadow-penumbra);
  -webkit-tap-highlight-color: transparent;
}

.profile-activation__card:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (hover: hover) and (pointer: fine) {
  .profile-activation__card:not(:disabled):hover {
    background: var(--rr-backgrounds-neutral-quinary-hover, #e7e7e9);
  }
}

.profile-activation__card:not(:disabled):active {
  background: var(--rr-backgrounds-neutral-quinary-active, #cdcdd6);
}

.profile-activation__icon {
  flex: 0 0 auto;
  width: var(--rr-size-3-xl);
  height: var(--rr-size-3-xl);
  object-fit: contain;
  display: block;
}

.profile-activation__card-text {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.profile-activation__card-title {
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 600;
  font-size: var(--rr-font-size-font-size-m, 16px);
  line-height: var(--rr-line-height-line-height-m, 24px);
  letter-spacing: var(--rr-tracking-tracking-m, 0px);
  color: var(--rr-labels-neutral-primary, #101012);
}

.profile-activation__card-status {
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 400;
  font-size: var(--rr-font-size-font-size-xs, 12px);
  line-height: var(--rr-line-height-line-height-xs, 16px);
  letter-spacing: var(--rr-tracking-tracking-s, 0px);
}

.profile-activation__chevron {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--rr-labels-neutral-primary, #101012);
}

.profile-activation__chevron-icon {
  display: block;
  width: 32px;
  height: 32px;
}

.profile-activation__clear {
  margin-top: var(--rr-spacing-padding-xl, 16px);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--rr-spacing-padding-m);
}

.profile-activation__clear-btn {
  box-sizing: border-box;
  width: 100%;
  min-height: var(--rr-size-4-xl);
  padding: var(--rr-spacing-padding-l) var(--rr-spacing-padding-xl);
  border: none;
  border-radius: var(--rr-radius-xl, 16px);
  background: var(--rr-backgrounds-primary);
  color: var(--rr-labels-danger-primary);
  font-family: inherit;
  font-size: var(--rr-font-size-font-size-m);
  font-weight: 600;
  line-height: var(--rr-line-height-line-height-m);
  cursor: pointer;
  box-shadow: 0 var(--rr-px-1, 1px) var(--rr-px-2, 2px) var(--rr-fx-shadow-penumbra);
  -webkit-tap-highlight-color: transparent;
}

@media (hover: hover) and (pointer: fine) {
  .profile-activation__clear-btn:hover:not(:disabled) {
    background: var(--rr-fills-danger-secondary);
  }
}

.profile-activation__clear-btn:active:not(:disabled) {
  background: var(--rr-fills-danger-secondary);
}

.profile-activation__clear-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.profile-activation__clear-error {
  margin: 0;
  font-size: var(--rr-font-size-font-size-s);
  line-height: var(--rr-line-height-line-height-s);
  color: var(--rr-labels-danger-primary);
  text-align: center;
}

.profile-activation__clear-warn {
  color: var(--rr-labels-danger-primary) !important;
  font-weight: 600;
}

.profile-activation__sheet-btn {
  min-height: var(--rr-size-4-xl);
  border: none;
  border-radius: var(--rr-radius-xl);
  font: inherit;
  font-size: var(--rr-font-size-font-size-m);
  font-weight: 600;
  cursor: pointer;
}

.profile-activation__sheet-btn--cancel {
  background: var(--rr-backgrounds-quaternary, #f1f1f3);
  color: var(--rr-labels-neutral-primary, #101012);
}

.profile-activation__sheet-btn--danger {
  background: var(--rr-labels-danger-primary);
  color: var(--rr-labels-neutral-inverted-primary);
}

.profile-activation__sheet-btn:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>
