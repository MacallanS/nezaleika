<template>
  <section class="staff-overview" aria-label="Обзор">
    <div class="staff-overview__summary">
      <div
        v-for="card in summaryCards"
        :key="card.id"
        class="staff-overview-card"
      >
        <button
          type="button"
          class="staff-overview-card__surface"
          :aria-label="`${card.title}: открыть вкладку`"
          @click="openSummaryCard(card.id)"
        >
          <div class="staff-overview-card__head">
            <div class="staff-overview-card__lead">
              <p class="staff-overview-card__title">{{ card.title }}</p>
              <span
                class="staff-overview-card__value"
                :class="{ 'staff-overview-card__value--text': !/^\d+$/.test(String(card.value)) }"
              >{{ card.value }}</span>
            </div>
            <span class="staff-overview-card__chevron" aria-hidden="true">
              <img :src="iconChevron" alt="" width="20" height="20" />
            </span>
          </div>
          <div
            v-if="card.metrics.length && !(card.id === 'documents' && card.value === 'Все приняты')"
            class="staff-overview-card__metrics"
          >
            <div
              v-for="metric in card.metrics"
              :key="metric.label"
              class="staff-overview-card__metric"
            >
              <span>{{ metric.label }}</span>
              <span
                class="staff-overview-card__metric-value"
                :class="metric.tone ? `staff-overview-card__metric-value--${metric.tone}` : undefined"
              >{{ metric.value }}</span>
            </div>
          </div>
        </button>
        <button
          v-if="card.id === 'documents' && showHirePermanent"
          type="button"
          class="staff-overview-card__cta"
          :disabled="hirePermanentLoading"
          @click.stop="emit('hire-permanent')"
        >
          {{ hirePermanentLoading ? 'Сохранение…' : 'Принять на работу' }}
        </button>
        <button
          v-else-if="card.id === 'documents' && showMoveToSigning"
          type="button"
          class="staff-overview-card__cta"
          :disabled="moveToSigningLoading"
          @click.stop="emit('move-to-signing')"
        >
          {{ moveToSigningLoading ? 'Сохранение…' : 'Перенести на подписание' }}
        </button>
      </div>
    </div>

    <div class="staff-overview__columns">
      <section class="staff-overview-panel" aria-label="Требуют внимания">
        <h2 class="staff-overview-panel__title">Требуют внимания</h2>

        <div
          v-if="!attentionItems.length"
          class="staff-overview-panel__body staff-overview-all-clear"
        >
          <img
            class="staff-overview-all-clear__icon"
            :src="iconCheck"
            alt=""
            width="40"
            height="40"
            aria-hidden="true"
          />
          <div class="staff-overview-all-clear__copy">
            <p class="staff-overview-all-clear__title">Пока всё в порядке</p>
            <p class="staff-overview-all-clear__text">{{ allClearMessage }}</p>
          </div>
        </div>

        <ul v-else class="staff-overview-panel__body staff-overview-attention" role="list">
          <li
            v-for="item in attentionItems"
            :key="item.id"
            class="staff-overview-attention__row"
          >
            <button
              type="button"
              class="staff-overview-attention__main"
              @click="emit('open-doc', item.id)"
            >
              <span class="staff-overview-attention__icon" aria-hidden="true">
                <img :src="item.icon" alt="" width="40" height="40" />
              </span>
              <span class="staff-overview-attention__body">
                <span class="staff-overview-attention__name">{{ item.title }}</span>
                <span
                  class="staff-overview-attention__status"
                  :class="`staff-overview-attention__status--${item.tone}`"
                >
                  {{ item.statusLabel }}
                </span>
              </span>
              <span
                v-if="!item.showNotify"
                class="staff-overview-attention__chevron"
                aria-hidden="true"
              >
                <img :src="iconChevron" alt="" width="24" height="24" />
              </span>
            </button>
            <button
              v-if="item.showNotify"
              type="button"
              class="staff-overview-attention__notify"
              aria-label="Напомнить"
              @click="onNotifyClick"
            >
              <img :src="iconBell" alt="" width="24" height="24" />
            </button>
          </li>
        </ul>
      </section>

      <section class="staff-overview-panel" aria-label="Последние изменения">
        <button
          type="button"
          class="staff-overview-panel__title-btn"
          @click="emit('open-tab', 'history')"
        >
          <h2 class="staff-overview-panel__title">Последние изменения</h2>
          <span class="staff-overview-panel__title-chevron" aria-hidden="true">
            <img :src="iconChevron" alt="" width="20" height="20" />
          </span>
        </button>

        <div
          v-if="historyLoading"
          class="staff-overview-panel__body staff-overview-panel__skeleton"
        >
          <StaffProfileListSkeleton variant="overview-history" :rows="4" />
        </div>
        <div
          v-else-if="historyError"
          class="staff-overview-panel__body staff-overview-panel__empty staff-overview-panel__empty--error"
        >
          {{ historyError }}
        </div>
        <div
          v-else-if="!historyItems.length"
          class="staff-overview-panel__body staff-overview-panel__empty"
        >
          <div class="staff-overview-all-clear__copy">
            <p class="staff-overview-all-clear__title">Пока нет изменений</p>
            <p class="staff-overview-all-clear__text">
              Здесь появятся действия по профилю сотрудника
            </p>
          </div>
        </div>

        <ul v-else class="staff-overview-panel__body staff-overview-history" role="list">
          <li
            v-for="item in historyItems"
            :key="item.id"
            class="staff-overview-history__row"
          >
            <span
              class="staff-overview-history__avatar"
              :class="`staff-overview-history__avatar--${item.actor_role}`"
              aria-hidden="true"
            >
              <img
                v-if="actorAvatarUrl(item) && !brokenAvatarIds.has(item.id)"
                class="staff-overview-history__avatar-img"
                :src="actorAvatarUrl(item)!"
                alt=""
                width="24"
                height="24"
                loading="lazy"
                decoding="async"
                @error="onAvatarError(item.id)"
              />
              <template v-else>{{ item.actor.initials }}</template>
            </span>
            <p class="staff-overview-history__line">
              <span class="staff-overview-history__name">{{ item.actor.name }}</span>
              <span class="staff-overview-history__verb">{{ item.verb }}</span>
              <span
                v-if="item.step_label"
                class="staff-overview-history__target"
              >
                <img
                  v-if="stepIcon(item.step)"
                  class="staff-overview-history__step-icon"
                  :src="stepIcon(item.step)!"
                  alt=""
                  width="16"
                  height="16"
                />
                {{ item.step_label }}
              </span>
              <span
                v-else-if="item.status_name"
                class="staff-overview-history__target"
              >
                «{{ item.status_name }}»
              </span>
              <span
                v-else-if="item.target"
                class="staff-overview-history__target"
              >
                {{ item.target }}
              </span>
            </p>
            <time class="staff-overview-history__time" :datetime="item.created_at">
              {{ formatTime(item.created_at) }}
            </time>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { ActivationStepId } from 'bibli/widgets/Profile/rr/lib/activationSteps'
import iconChevron from 'bibli/widgets/Profile/rr/assets/activation/chevron-right.svg'
import iconCheck from 'bibli/widgets/Profile/rr/assets/activation/home/check.svg'
import iconBell from 'bibli/widgets/Profile/rr/assets/hub/icon-bell.svg'
import { getDocumentAvatarUrl } from '@/shared/api/http/http'
import {
  fetchStaffActivationHistory,
  type StaffProfileHistoryItem,
} from '../../api/history'
import type { StaffProfileModel } from '../../composables/useStaffProfile'
import {
  activationStepIcon,
  buildStaffOverviewAllClearMessage,
  buildStaffOverviewAttention,
  buildStaffOverviewSummary,
  canMoveStaffToSigning,
  canHireStaffPermanent,
  OVERVIEW_HISTORY_FETCH_LIMIT,
  OVERVIEW_HISTORY_PREVIEW_LIMIT,
  selectOverviewHistoryPreview,
} from '../../lib/staffProfileOverview'
import { formatStaffHistoryTimeLabel } from '../../lib/staffProfileHistoryTime'
import type { StaffProfileTabId } from '../../lib/staffProfileTabs'
import { useToast } from 'bibli/shared/ui'
import StaffProfileListSkeleton from '../StaffProfileListSkeleton.vue'
import 'bibli/widgets/Profile/rr/lib/activation-block-status.css'

const toast = useToast()

const props = withDefaults(
  defineProps<{
    profile: StaffProfileModel
    userId: number | string
    moveToSigningLoading?: boolean
    hirePermanentLoading?: boolean
    showManagementShortcuts?: boolean
    readOnly?: boolean
  }>(),
  {
    moveToSigningLoading: false,
    hirePermanentLoading: false,
    showManagementShortcuts: false,
    readOnly: false,
  },
)

const emit = defineEmits<{
  'open-tab': [tab: StaffProfileTabId]
  'open-doc': [doc: ActivationStepId]
  'move-to-signing': []
  'hire-permanent': []
}>()

const summaryCards = computed(() => {
  const base = buildStaffOverviewSummary(props.profile)
  if (!props.showManagementShortcuts) return base
  return [
    ...base,
    {
      id: 'settings' as const,
      title: 'Параметры',
      value: 'Смена',
      metrics: [{ label: 'Выход на смену', value: 'Настройки', tone: 'muted' as const }],
    },
    {
      id: 'products' as const,
      title: 'Продукты',
      value: '—',
      metrics: [{ label: 'Назначения', value: 'Открыть', tone: 'muted' as const }],
    },
  ]
})
const attentionItems = computed(() =>
  buildStaffOverviewAttention(props.profile.activationSteps),
)
const allClearMessage = computed(() =>
  buildStaffOverviewAllClearMessage(props.profile),
)
const showMoveToSigning = computed(
  () => !props.readOnly && canMoveStaffToSigning(props.profile),
)
const showHirePermanent = computed(
  () => !props.readOnly && canHireStaffPermanent(props.profile),
)

function openSummaryCard(cardId: string) {
  if (cardId === 'documents') {
    emit('open-tab', 'documents')
    return
  }
  if (cardId === 'projects') {
    emit('open-tab', 'projects')
    return
  }
  if (cardId === 'settings') {
    emit('open-tab', 'settings')
    return
  }
  if (cardId === 'products') {
    emit('open-tab', 'products')
    return
  }
  emit('open-tab', 'other')
}

const historyLoading = ref(true)
const historyError = ref('')
const historyItems = ref<StaffProfileHistoryItem[]>([])
const brokenAvatarIds = ref(new Set<number>())

function onNotifyClick() {
  toast.add({
    severity: 'info',
    summary: 'Уведомления',
    detail: 'Уведомления ещё в разработке',
    life: 3000,
  })
}

function stepIcon(step: string | null) {
  return activationStepIcon(step)
}

function actorAvatarUrl(item: StaffProfileHistoryItem): string | null {
  const code = item.actor.avatar?.trim()
  if (!code) return null
  return getDocumentAvatarUrl(code, 96)
}

function onAvatarError(id: number) {
  if (brokenAvatarIds.value.has(id)) return
  const next = new Set(brokenAvatarIds.value)
  next.add(id)
  brokenAvatarIds.value = next
}

function formatTime(createdAt: string) {
  return formatStaffHistoryTimeLabel(createdAt)
}

async function loadHistory() {
  historyLoading.value = true
  historyError.value = ''
  brokenAvatarIds.value = new Set()
  try {
    const items = await fetchStaffActivationHistory(
      props.userId,
      OVERVIEW_HISTORY_FETCH_LIMIT,
    )
    historyItems.value = selectOverviewHistoryPreview(
      items,
      OVERVIEW_HISTORY_PREVIEW_LIMIT,
    )
  } catch (e) {
    console.error('[staff-overview]', e)
    historyError.value = 'Не удалось загрузить историю'
    historyItems.value = []
  } finally {
    historyLoading.value = false
  }
}

onMounted(() => {
  void loadHistory()
})

watch(
  () => props.userId,
  () => {
    void loadHistory()
  },
)
</script>

<style scoped>
.staff-overview {
  display: flex;
  flex-direction: column;
  flex: 0 0 auto;
  gap: 8px;
  width: 100%;
  min-width: 0;
  margin: 0;
}

.staff-overview__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  align-items: stretch;
}

.staff-overview-card {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 32px;
  min-width: 0;
  height: 100%;
  margin: 0;
  padding: 24px;
  border: none;
  border-radius: 24px;
  background: #ffffff;
  text-align: left;
  color: inherit;
  justify-content: space-around;
  transition: background-color 0.15s ease;
}

.staff-overview-card:has(.staff-overview-card__surface:hover),
.staff-overview-card:has(.staff-overview-card__surface:focus-visible) {
  background: #f8f9fb;
}

.staff-overview-card__surface {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  justify-content: space-between;
  gap: 32px;
  width: 100%;
  min-height: 0;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font: inherit;
  color: inherit;
  -webkit-tap-highlight-color: transparent;
}

.staff-overview-card__surface:focus-visible {
  outline: 2px solid #5b7dec;
  outline-offset: 4px;
  border-radius: 12px;
}

.staff-overview-card__cta {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin: 0;
  padding: 12px 16px;
  border: none;
  border-radius: 12px;
  background: var(--rr-button-brand-primary-background-default, #5b7dec);
  color: var(--rr-button-brand-primary-text-default, #ffffff);
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.staff-overview-card__cta:hover:not(:disabled) {
  background: var(--rr-button-brand-primary-background-hover, #1c4ae5);
}

.staff-overview-card__cta:disabled {
  opacity: 0.64;
  cursor: default;
}

.staff-overview-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.staff-overview-card__lead {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.staff-overview-card__title {
  margin: 0;
  min-width: 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 20px;
  color: #101012;
}

.staff-overview-card__value {
  font-size: 32px;
  font-weight: 700;
  line-height: 36px;
  letter-spacing: -0.02em;
  color: #101012;
}

.staff-overview-card__value--text {
  font-size: 18px;
  line-height: 24px;
  letter-spacing: -0.01em;
}

.staff-overview-card__chevron {
  display: inline-flex;
  flex: 0 0 auto;
  color: rgba(60, 60, 67, 0.42);
}

.staff-overview-card__chevron img {
  display: block;
}

.staff-overview-card__metrics {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.staff-overview-card__metric {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  line-height: 18px;
  color: var(--Labels-Neutral-Secondary, var(--rr-labels-neutral-secondary, #3c3c43b8));
}

.staff-overview-card__metric-value {
  flex: 0 0 auto;
  font-weight: 600;
  color: var(--Labels-Neutral-Secondary, var(--rr-labels-neutral-secondary, #3c3c43b8));
  text-align: right;
}

.staff-overview-card__metric-value--muted,
.staff-overview-card__metric-value--warning,
.staff-overview-card__metric-value--danger,
.staff-overview-card__metric-value--success {
  color: var(--Labels-Neutral-Secondary, var(--rr-labels-neutral-secondary, #3c3c43b8));
  font-weight: 600;
}

.staff-overview__columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  align-items: stretch;
}

.staff-overview-panel {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  min-height: 0;
  height: 100%;
  padding: 14px;
  border: none;
  border-radius: 16px;
  background: #ffffff;
}

.staff-overview-panel__body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.staff-overview-panel__title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 22px;
  color: #101012;
}

.staff-overview-panel__title-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  font: inherit;
  text-align: left;
  color: inherit;
}

.staff-overview-panel__title-chevron {
  display: inline-flex;
  color: rgba(60, 60, 67, 0.42);
}

.staff-overview-panel__empty {
  align-items: center;
  justify-content: center;
  padding: 8px 8px 12px;
  text-align: center;
  font-size: 14px;
  line-height: 20px;
  color: rgba(60, 60, 67, 0.72);
}

.staff-overview-panel__skeleton {
  justify-content: flex-start;
  padding: 4px 0 0;
}

.staff-overview-all-clear {
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 8px 8px 12px;
  text-align: center;
}

.staff-overview-all-clear__icon {
  box-sizing: border-box;
  display: block;
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  margin: 0;
  padding: 10px;
  border: none;
  border-radius: 12px;
  background: var(--Backgrounds-Tetriary, #E7E8EE);
  object-fit: contain;
}

.staff-overview-all-clear__copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 320px;
  padding: 0 8px;
}

.staff-overview-all-clear__title {
  margin: 0;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 600;
  font-style: normal;
  font-size: 16px;
  line-height: 22px;
  letter-spacing: -0.2px;
  text-align: center;
  color: var(--Labels-Neutral-Primary, var(--rr-labels-neutral-primary, #101012));
}

.staff-overview-all-clear__text {
  margin: 0;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 400;
  font-style: normal;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: 0;
  text-align: center;
  color: var(--Labels-Neutral-Secondary, var(--rr-labels-neutral-secondary, #3c3c43b8));
}

.staff-overview-panel__empty--error {
  color: #e11d48;
}

.staff-overview-attention {
  display: flex;
  flex-direction: column;
  margin: 0;
  list-style: none;
}

.staff-overview-attention__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--rr-spacing-padding-l, 12px);
  width: 100%;
  padding: var(--rr-spacing-padding-m, 8px) 0 var(--rr-spacing-padding-m, 8px) var(--rr-spacing-padding-m, 8px);
}

.staff-overview-attention__main {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 12px;
  background: transparent;
  cursor: pointer;
  font: inherit;
  text-align: left;
  color: inherit;
  -webkit-tap-highlight-color: transparent;
}

.staff-overview-attention__icon {
  display: inline-flex;
  width: 40px;
  height: 40px;
}

.staff-overview-attention__icon img {
  display: block;
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.staff-overview-attention__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.staff-overview-attention__name {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  color: #101012;
}

.staff-overview-attention__status {
  font-size: 13px;
  line-height: 16px;
}

.staff-overview-attention__status--review,
.staff-overview-attention__status--error {
  font-weight: 600;
}

.staff-overview-attention__notify {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: var(--rr-radius-m, 8px);
  background: var(--Button-Neutral-Secondary-Background-Default, #F2F3F7);
  color: #101012;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.staff-overview-attention__notify:hover {
  background: var(--Button-Neutral-Secondary-Background-Hover, #e8e9ef);
}

.staff-overview-attention__chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: #101012;
}

.staff-overview-attention__notify img,
.staff-overview-attention__chevron img {
  display: block;
  width: 24px;
  height: 24px;
}

.staff-overview-history {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  padding-right: 4px;
  list-style: none;
  overflow-y: auto;
}

.staff-overview-history__row {
  display: grid;
  grid-template-columns: var(--rr-size-xl, 24px) minmax(0, 1fr) auto;
  gap: var(--rr-spacing-padding-l, 12px);
  align-items: flex-start;
  padding: var(--rr-spacing-padding-l, 12px) 0;
}

.staff-overview-history__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e7e8ee;
  color: #101012;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  flex: 0 0 auto;
  overflow: hidden;
}

.staff-overview-history__avatar-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.staff-overview-history__avatar--system {
  background: #101012;
  color: #fff;
}

.staff-overview-history__avatar--support {
  background: #dbe4ff;
  color: #2f4fbf;
}

.staff-overview-history__avatar--agent {
  background: #e8f7ee;
  color: #1f7a3f;
}

.staff-overview-history__line {
  margin: 0;
  min-width: 0;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 400;
  font-style: normal;
  font-size: var(--rr-font-size-font-size-m, 16px);
  line-height: var(--rr-line-height-line-height-m, 24px);
  letter-spacing: var(--rr-tracking-tracking-m, 0px);
  color: #000000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.staff-overview-history__name {
  font-weight: 400;
  margin-right: 4px;
  color: #000000;
}

.staff-overview-history__verb {
  font-weight: 400;
  margin-right: 4px;
  color: var(--Labels-Neutral-Secondary, var(--rr-labels-neutral-secondary, #3c3c43b8));
}

.staff-overview-history__target {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 400;
  color: #000000;
  vertical-align: middle;
}

.staff-overview-history__step-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  object-fit: contain;
  flex: 0 0 auto;
  border-radius: 3px;
}

.staff-overview-history__time {
  flex: 0 0 auto;
  font-size: 12px;
  line-height: 16px;
  color: rgba(60, 60, 67, 0.52);
  white-space: nowrap;
  padding-top: 2px;
}

@media (max-width: 960px) {
  .staff-overview__summary {
    grid-template-columns: 1fr;
  }

  .staff-overview__columns {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .staff-overview-history__row {
    grid-template-columns: var(--rr-size-xl, 24px) minmax(0, 1fr);
  }

  .staff-overview-history__time {
    grid-column: 2;
    padding-top: 0;
  }
}
</style>
