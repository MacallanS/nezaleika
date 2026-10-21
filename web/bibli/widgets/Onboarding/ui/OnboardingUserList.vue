<script setup lang="ts">
import { computed, ref } from 'vue'
import { getDocumentAvatarUrl } from '@/shared/api/http/http'
import {
  RrGridList,
  RrMultiSelect,
  RrStatusBadge,
  RrStatusBadgeSelect,
  useToast,
  type RrGridListColumn,
} from 'bibli/shared/ui'
import iconCopy from '../assets/copy.svg'
import { writeClipboardText } from 'bibli/shared/utils/copyToClipboard'
import {
  formatOnboardingJoinedAt,
  getOnboardingRegisteredAt,
  formatOnboardingRolePhone,
  formatOnboardingTestAccess,
  getActivationProgress,
  getOnboardingFullName,
  getOnboardingInitials,
  getOnboardingPointName,
  getOnboardingProjectName,
  getOnboardingSupportLabelIds,
  resolveOnboardingSystemStatus,
  type OnboardingListUser,
  type OnboardingStatusOption,
  type OnboardingTab,
} from '../lib/onboardingListUtils'
import { REGISTRATION_SYSTEM_STATUSES, SIGNING_SYSTEM_STATUSES } from '../lib/registrationSystemStatus'
import { ONEC_STATUS_LABELS, type OnecSyncStatusLike } from '../lib/onecSyncUtils'

export type OnboardingSortKey = 'fio' | 'status' | 'joined'
export type OnboardingSortDir = 'asc' | 'desc'

const DEFAULT_GRID =
  'minmax(220px, 1.35fr) minmax(160px, 1fr) minmax(130px, 0.95fr) minmax(120px, 0.9fr) minmax(132px, 0.82fr) minmax(168px, 1fr)'

const DEFAULT_GRID_NO_LABELS =
  'minmax(220px, 1.35fr) minmax(160px, 1fr) minmax(130px, 0.95fr) minmax(120px, 0.9fr) minmax(132px, 0.82fr)'

const WIDE_GRID =
  'minmax(220px, 1.45fr) minmax(160px, 1fr) minmax(220px, 0.7fr) minmax(130px, 0.95fr) minmax(120px, 0.9fr) minmax(132px, 0.82fr) minmax(168px, 1fr)'

/** Signing: без «Раздел», с колонкой 1С перед статусом подписания. */
const SIGNING_GRID =
  'minmax(220px, 1.35fr) minmax(160px, 1fr) minmax(130px, 0.95fr) minmax(120px, 0.9fr) minmax(132px, 0.82fr) minmax(120px, 0.75fr) minmax(168px, 1fr)'

const SIGNING_GRID_NO_LABELS =
  'minmax(220px, 1.35fr) minmax(160px, 1fr) minmax(130px, 0.95fr) minmax(120px, 0.9fr) minmax(132px, 0.82fr) minmax(120px, 0.75fr)'

const props = defineProps<{
  items: OnboardingListUser[]
  activeTab: OnboardingTab
  statuses: OnboardingStatusOption[]
  newStatuses: OnboardingStatusOption[]
  systemStatuses?: OnboardingStatusOption[]
  /** Системные статусы вкладки «На подписании». */
  signingSystemStatuses?: OnboardingStatusOption[]
  loading?: boolean
  wideLayout?: boolean
  /** Появилась кнопка «доп. фильтры» — прячем подпись и «Раздел». */
  filtersOverflow?: boolean
  /** Уже узко (но не телефон) — прячем и метки. */
  collapseLabels?: boolean
  /** Телефон — метки оставляем. */
  isPhone?: boolean
  sortKey?: OnboardingSortKey | null
  sortDir?: OnboardingSortDir | null
  roleNameById?: Record<string, string>
  savingUserId?: number | string | null
  /** HR read-only: статусы/метки только просмотр */
  readOnly?: boolean
}>()

const emit = defineEmits<{
  rowClick: [user: OnboardingListUser]
  sort: [key: OnboardingSortKey]
  statusAssign: [user: OnboardingListUser, statusIds: string | number | Array<string | number>]
  systemStatusAssign: [user: OnboardingListUser, statusId: string]
}>()

const toast = useToast()

/** Подпись под ФИО + колонка «Раздел»: только на registered при широком экране. */
const showRichColumns = computed(
  () =>
    props.activeTab === 'registered' &&
    Boolean(props.wideLayout) &&
    !props.filtersOverflow,
)

/** Метки: прячем при overflow на «средней» ширине; на телефоне всегда оставляем. */
const showLabelsColumn = computed(
  () => Boolean(props.isPhone) || !props.filtersOverflow || !props.collapseLabels,
)

const showOnecColumn = computed(() => props.activeTab === 'signing')

const columns = computed((): RrGridListColumn[] => {
  const base: RrGridListColumn[] = [
    { key: 'user', label: 'Пользователи', sortable: true, sortKey: 'fio' },
    { key: 'project', label: 'Проект' },
  ]

  if (showRichColumns.value) {
    base.push({ key: 'section', label: 'Раздел' })
  }

  base.push(
    {
      key: 'status',
      label: 'Статус',
      sortable: true,
      sortKey: 'status',
      interactive: true,
    },
    { key: 'test', label: 'Тестовый доступ' },
    { key: 'joined', label: 'Присоединился', sortable: true, sortKey: 'joined' },
  )

  if (showOnecColumn.value) {
    base.push({ key: 'onec', label: '1С' })
  }

  if (showLabelsColumn.value) {
    base.push({
      key: 'labels',
      label: props.activeTab === 'registered' ? 'Метки' : 'Статус подписания',
      interactive: true,
      stack: true,
    })
  }

  return base
})

const gridTemplate = computed(() => {
  if (showOnecColumn.value) {
    return showLabelsColumn.value ? SIGNING_GRID : SIGNING_GRID_NO_LABELS
  }
  if (showRichColumns.value) return WIDE_GRID
  if (!showLabelsColumn.value) return DEFAULT_GRID_NO_LABELS
  return DEFAULT_GRID
})

const gridListStyle = computed(() => {
  const scrollMinWidth = showOnecColumn.value
    ? showLabelsColumn.value
      ? '1180px'
      : '1020px'
    : showRichColumns.value
      ? '1260px'
      : showLabelsColumn.value
        ? '1060px'
        : '900px'

  return {
    '--rr-grid-list-scroll-min-width': scrollMinWidth,
    '--rr-grid-list-template': gridTemplate.value,
  }
})

const supportLabelOptions = computed(() =>
  props.newStatuses.map(({ id, name }) => ({ id, name })),
)

const systemStatusOptions = computed(() => {
  if (props.activeTab === 'signing') {
    const fromProps = (props.signingSystemStatuses ?? []).filter((item) => item?.id && item?.name)
    if (fromProps.length > 0) {
      return fromProps.map(({ id, name }) => ({ id: String(id), name: String(name) }))
    }
    return SIGNING_SYSTEM_STATUSES.map(({ id, name }) => ({ id, name }))
  }
  const fromProps = (props.systemStatuses ?? []).filter((item) => item?.id && item?.name)
  if (fromProps.length > 0) {
    return fromProps.map(({ id, name }) => ({ id: String(id), name: String(name) }))
  }
  return REGISTRATION_SYSTEM_STATUSES.map(({ id, name }) => ({ id, name }))
})

const systemStatusKind = computed(() =>
  props.activeTab === 'signing' ? 'signing' : 'registration',
)

/** URL фото, которые не загрузились — показываем инициалы вместо битого img/alt. */
const brokenAvatarKeys = ref(new Set<string>())

function avatarKey(user: OnboardingListUser): string {
  return String(user.user_id ?? user.id ?? '')
}

function avatarUrl(user: OnboardingListUser): string | null {
  const file = user.data?.file_agent_with_passport
  return file ? getDocumentAvatarUrl(file, 96) : null
}

function showAvatarImage(user: OnboardingListUser): boolean {
  const url = avatarUrl(user)
  if (!url) return false
  return !brokenAvatarKeys.value.has(avatarKey(user))
}

function onAvatarError(user: OnboardingListUser) {
  const key = avatarKey(user)
  if (!key || brokenAvatarKeys.value.has(key)) return
  const next = new Set(brokenAvatarKeys.value)
  next.add(key)
  brokenAvatarKeys.value = next
}

function roleName(user: OnboardingListUser): string | null {
  const roleId = user.role_id
  if (roleId == null) return null
  return props.roleNameById?.[String(roleId)] ?? null
}

function progressPercent(user: OnboardingListUser): number {
  const { completed, total } = getActivationProgress(user)
  if (!total) return 0
  return Math.round((completed / total) * 100)
}

function userRowKey(user: OnboardingListUser, index: number): string | number {
  return user.user_id ?? user.id ?? index
}

function isSavingUser(user: OnboardingListUser): boolean {
  if (props.savingUserId == null) return false
  return String(props.savingUserId) === String(user.user_id ?? user.id ?? '')
}

function supportLabelValues(user: OnboardingListUser): Array<string | number> {
  return getOnboardingSupportLabelIds(user, props.newStatuses)
}

function signingStatusValue(user: OnboardingListUser): string | number {
  return user.type_id ?? user.registration?.type?.id ?? ''
}

function onecSyncOf(user: OnboardingListUser): OnecSyncStatusLike | null {
  return user.onec_sync_status ?? null
}

function onecStatusId(user: OnboardingListUser): string | undefined {
  const status = onecSyncOf(user)?.status
  return typeof status === 'string' && status.trim() ? status.trim() : undefined
}

function onecStatusLabelForUser(user: OnboardingListUser): string {
  const id = onecStatusId(user)
  if (!id) return 'Не отправлен'
  return ONEC_STATUS_LABELS[id] || id
}

function sameIdSet(
  left: string | number | Array<string | number>,
  right: string | number | Array<string | number>,
): boolean {
  const normalize = (value: string | number | Array<string | number>) =>
    (Array.isArray(value) ? value : value ? [value] : [])
      .map(String)
      .sort()

  const a = normalize(left)
  const b = normalize(right)
  return a.length === b.length && a.every((item, index) => item === b[index])
}

function handleInlineStatusAssign(
  user: OnboardingListUser,
  statusIds: string | number | Array<string | number>,
) {
  const currentValue = signingStatusValue(user)
  if (sameIdSet(currentValue, statusIds)) return
  emit('statusAssign', user, statusIds)
}

function handleInlineLabelAssign(
  user: OnboardingListUser,
  labelIds: string | number | Array<string | number>,
) {
  const currentValue = supportLabelValues(user)
  if (sameIdSet(currentValue, labelIds)) return
  emit('statusAssign', user, labelIds)
}

function handleSystemStatusAssign(
  user: OnboardingListUser,
  statusId: string | number,
) {
  const current = resolveOnboardingSystemStatus(user)
  if (String(current.id) === String(statusId)) return
  emit('systemStatusAssign', user, String(statusId))
}

function onSort(sortKey: string) {
  emit('sort', sortKey as OnboardingSortKey)
}

function onRowClick(item: unknown) {
  emit('rowClick', item as OnboardingListUser)
}

function canCopyFullName(user: OnboardingListUser): boolean {
  const value = getOnboardingFullName(user).trim()
  return Boolean(value) && value !== '—'
}

async function copyFullName(user: OnboardingListUser) {
  const text = getOnboardingFullName(user).trim()
  if (!text || text === '—') return
  const ok = await writeClipboardText(text)
  if (ok) {
    toast.add({
      severity: 'success',
      summary: 'Скопировано',
      detail: text.slice(0, 120),
      life: 1500,
    })
    return
  }
  toast.add({
    severity: 'error',
    summary: 'Ошибка',
    detail: 'Не удалось скопировать',
    life: 2500,
  })
}
</script>

<template>
  <RrGridList
    :style="gridListStyle"
    :columns="columns"
    :items="items"
    :loading="loading"
    :sort-key="sortKey"
    :sort-dir="sortDir"
    :row-key="userRowKey"
    @sort="onSort"
    @row-click="onRowClick"
  >
    <template #cell-user="{ item }">
      <div class="onboarding-user-list__user">
        <span class="onboarding-user-list__avatar" aria-hidden="true">
          <img
            v-if="showAvatarImage(item as OnboardingListUser)"
            :src="avatarUrl(item as OnboardingListUser)!"
            alt=""
            loading="lazy"
            decoding="async"
            @error="onAvatarError(item as OnboardingListUser)"
          />
          <span v-else>{{ getOnboardingInitials(item as OnboardingListUser) }}</span>
        </span>
        <span class="onboarding-user-list__user-text">
          <span class="onboarding-user-list__name-row">
            <span class="onboarding-user-list__name">{{ getOnboardingFullName(item as OnboardingListUser) }}</span>
            <button
              v-if="canCopyFullName(item as OnboardingListUser)"
              type="button"
              class="onboarding-user-list__copy"
              title="Копировать ФИО"
              aria-label="Копировать ФИО"
              @click.stop="copyFullName(item as OnboardingListUser)"
            >
              <img
                class="onboarding-user-list__copy-icon"
                :src="iconCopy"
                alt=""
                width="24"
                height="24"
              />
            </button>
          </span>
          <span v-if="showRichColumns" class="onboarding-user-list__subline">
            {{ formatOnboardingRolePhone(item as OnboardingListUser, roleName(item as OnboardingListUser)) }}
          </span>
        </span>
      </div>
    </template>

    <template #cell-project="{ item }">
      <span class="onboarding-user-list__project-name">{{ getOnboardingProjectName(item as OnboardingListUser) }}</span>
      <span class="onboarding-user-list__project-point">{{ getOnboardingPointName(item as OnboardingListUser) }}</span>
    </template>

    <template v-if="showRichColumns" #cell-section="{ item }">
      <span class="onboarding-user-list__progress" aria-hidden="true">
        <svg viewBox="0 0 36 36" class="onboarding-user-list__progress-ring">
          <g transform="rotate(-90 18 18)">
            <circle cx="18" cy="18" r="15.5" class="onboarding-user-list__progress-track" />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              class="onboarding-user-list__progress-value"
              pathLength="100"
              :style="{ strokeDasharray: `${progressPercent(item as OnboardingListUser)} 100` }"
            />
          </g>
        </svg>
      </span>
      <span class="onboarding-user-list__section-text">
        {{ getActivationProgress(item as OnboardingListUser).completed }} из
        {{ getActivationProgress(item as OnboardingListUser).total }}
      </span>
    </template>

    <template #cell-status="{ item }">
      <RrStatusBadgeSelect
        :model-value="resolveOnboardingSystemStatus(item as OnboardingListUser).id"
        :options="systemStatusOptions"
        :kind="systemStatusKind"
        size="sm"
        sheet-title="Статус"
        :disabled="
          props.readOnly ||
          isSavingUser(item as OnboardingListUser) ||
          !systemStatusOptions.length
        "
        :dropdown-z-index="100010"
        @update:model-value="handleSystemStatusAssign(item as OnboardingListUser, $event)"
      />
    </template>

    <template #cell-test="{ item }">
      <span
        class="onboarding-user-list__test-primary"
        :class="`onboarding-user-list__test-primary--${formatOnboardingTestAccess(item as OnboardingListUser).tone}`"
      >
        {{ formatOnboardingTestAccess(item as OnboardingListUser).primary }}
      </span>
      <span
        v-if="formatOnboardingTestAccess(item as OnboardingListUser).secondary"
        class="onboarding-user-list__test-secondary"
      >
        {{ formatOnboardingTestAccess(item as OnboardingListUser).secondary }}
      </span>
    </template>

    <template #cell-joined="{ item }">
      {{ formatOnboardingJoinedAt(getOnboardingRegisteredAt(item as OnboardingListUser)) }}
    </template>

    <template v-if="showOnecColumn" #cell-onec="{ item }">
      <RrStatusBadge
        class="rr-grid-list__badge"
        kind="onec"
        :id="onecStatusId(item as OnboardingListUser)"
        :label="onecStatusLabelForUser(item as OnboardingListUser)"
        size="sm"
      />
    </template>

    <template v-if="showLabelsColumn" #cell-labels="{ item }">
      <RrMultiSelect
        v-if="activeTab === 'registered'"
        :model-value="supportLabelValues(item as OnboardingListUser)"
        :options="supportLabelOptions"
        placeholder="Выберите метки"
        sheet-title="Метки"
        class="rr-grid-list__inline-control onboarding-user-list__labels-select"
        :disabled="
          props.readOnly ||
          isSavingUser(item as OnboardingListUser) ||
          !supportLabelOptions.length
        "
        :dropdown-z-index="100010"
        @update:model-value="handleInlineLabelAssign(item as OnboardingListUser, $event)"
      />
      <RrMultiSelect
        v-else
        :model-value="signingStatusValue(item as OnboardingListUser)"
        :options="statuses"
        placeholder="Статус подписания"
        sheet-title="Статус подписания"
        :multiple="false"
        class="rr-grid-list__inline-control onboarding-user-list__signing-status-select"
        :disabled="
          props.readOnly ||
          isSavingUser(item as OnboardingListUser) ||
          !statuses.length
        "
        :dropdown-z-index="100010"
        @update:model-value="handleInlineStatusAssign(item as OnboardingListUser, $event)"
      />
    </template>

    <template #empty>
      <slot name="empty">Ничего не найдено</slot>
    </template>
  </RrGridList>
</template>

<style scoped>
.onboarding-user-list__user {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.onboarding-user-list__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  overflow: hidden;
  background: #e8edf5;
  color: #35507a;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}

.onboarding-user-list__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.onboarding-user-list__user-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1 1 auto;
}

.onboarding-user-list__name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.onboarding-user-list__name {
  color: #101012;
  font-size: 15px;
  font-weight: 600;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  line-height: 1.35;
  min-width: 0;
}

.onboarding-user-list__copy {
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
  opacity: 0;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.onboarding-user-list__copy-icon {
  display: block;
  width: 24px;
  height: 24px;
}

.onboarding-user-list__user:hover .onboarding-user-list__copy,
.onboarding-user-list__copy:focus-visible {
  opacity: 1;
}

.onboarding-user-list__copy:hover {
  opacity: 0.82;
}

.onboarding-user-list__copy:focus-visible {
  outline: 2px solid var(--rr-input-border-active, #1c4ae5);
  outline-offset: 2px;
}

@media (hover: none), (pointer: coarse) {
  .onboarding-user-list__copy {
    opacity: 0.75;
  }
}

.onboarding-user-list__subline {
  color: #8b919a;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.onboarding-user-list__project-name {
  display: block;
  color: #101012;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.onboarding-user-list__project-point {
  display: block;
  color: #8b919a;
  font-size: 13px;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.onboarding-user-list__progress {
  position: relative;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
}

.onboarding-user-list__progress-ring {
  display: block;
  width: 28px;
  height: 28px;
  overflow: visible;
}

.onboarding-user-list__progress-track,
.onboarding-user-list__progress-value {
  fill: none;
  stroke-width: 3;
}

.onboarding-user-list__progress-track {
  stroke: var(--rr-labels-info-primary, #3e87ff);
  opacity: 0.2;
}

.onboarding-user-list__progress-value {
  stroke: var(--rr-labels-info-primary, #3e87ff);
  stroke-linecap: round;
}

.onboarding-user-list__section-text {
  color: #000;
  font-family: var(--rr-font-family-font-family, Manrope, sans-serif);
  font-size: var(--rr-font-size-font-size-xs, 12px);
  font-weight: 400;
  line-height: var(--rr-line-height-line-height-xs, 16px);
}

:deep(.rr-grid-list__cell--user),
:deep(.rr-grid-list__head-cell--user) {
  min-width: 220px;
}

:deep(.rr-grid-list__cell--project),
:deep(.rr-grid-list__head-cell--project) {
  min-width: 160px;
}

:deep(.rr-grid-list__cell--section),
:deep(.rr-grid-list__head-cell--section) {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  min-width: 220px;
}

.onboarding-user-list__test-primary {
  display: block;
  color: #101012;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}

.onboarding-user-list__test-primary--muted {
  color: rgba(60, 60, 67, 0.72);
  font-weight: 500;
}

.onboarding-user-list__test-primary--danger {
  color: #e11d48;
}

.onboarding-user-list__test-secondary {
  display: block;
  margin-top: 2px;
  color: rgba(60, 60, 67, 0.6);
  font-size: 13px;
  line-height: 18px;
}

:deep(.rr-grid-list__cell--joined) {
  color: #101012;
  font-size: 14px;
}

:deep(.rr-grid-list__cell--onec),
:deep(.rr-grid-list__head-cell--onec) {
  min-width: 120px;
}

.onboarding-user-list__signing-status-select {
  width: 100%;
  min-height: 40px;
  --rr-floating-panel-width-scale: 1;
  --rr-floating-panel-min-width: 0;
}

.onboarding-user-list__labels-select {
  width: 100%;
  min-height: 40px;
  height: 100%;
  --rr-floating-panel-width-scale: 1;
  --rr-floating-panel-min-width: 0;
}

.onboarding-user-list__labels-select :deep(.rr-multi-select__trigger) {
  justify-content: flex-start;
  min-height: 40px;
  height: 100%;
  /* Только padding чипа (__primary / __more), иначе на узкой колонке
     8px trigger + 12px chip визуально «съедают» ячейку по-разному. */
  padding: 0;
}

.onboarding-user-list__signing-status-select :deep(.rr-multi-select__trigger) {
  justify-content: flex-start;
  min-height: 40px;
  height: 100%;
  padding: 0;
}

.onboarding-user-list__labels-select.rr-grid-list__inline-control :deep(.rr-multi-select__value) {
  justify-content: flex-start;
  gap: 4px;
}

.onboarding-user-list__labels-select.rr-grid-list__inline-control :deep(.rr-multi-select__primary) {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: auto;
  max-width: 100%;
  min-height: 24px;
  height: 24px;
  padding: 4px 12px;
  border-radius: 34px;
  background: var(--Backgrounds-Quaternary, var(--rr-backgrounds-quaternary, #f2f3f7));
  color: var(--Labels-Neutral-Primary, var(--rr-labels-neutral-primary, #101012));
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 400;
  font-size: var(--rr-font-size-font-size-xs, 12px);
  line-height: var(--rr-line-height-line-height-xs, 16px);
  letter-spacing: var(--rr-tracking-tracking-s, 0);
  vertical-align: middle;
}

.onboarding-user-list__labels-select.rr-grid-list__inline-control :deep(.rr-multi-select__more) {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-width: 28px;
  width: auto;
  height: 24px;
  padding: 4px 8px;
  gap: 4px;
  border-radius: 34px;
  background: var(--Backgrounds-Quaternary, var(--rr-backgrounds-quaternary, #f2f3f7));
  color: var(--Labels-Neutral-Primary, var(--rr-labels-neutral-primary, #101012));
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 400;
  font-size: var(--rr-font-size-font-size-xs, 12px);
  line-height: var(--rr-line-height-line-height-xs, 16px);
  letter-spacing: var(--rr-tracking-tracking-s, 0);
  vertical-align: middle;
}

.onboarding-user-list__signing-status-select.rr-grid-list__inline-control :deep(.rr-multi-select__primary) {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: auto;
  max-width: 100%;
  min-height: 24px;
  height: 24px;
  padding: 4px 12px;
  border-radius: 34px;
  background: var(--Backgrounds-Quaternary, var(--rr-backgrounds-quaternary, #f2f3f7));
  color: var(--Labels-Neutral-Primary, var(--rr-labels-neutral-primary, #101012));
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 400;
  font-size: var(--rr-font-size-font-size-xs, 12px);
  line-height: var(--rr-line-height-line-height-xs, 16px);
  letter-spacing: var(--rr-tracking-tracking-s, 0);
  vertical-align: middle;
}

.onboarding-user-list__label-texts {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.onboarding-user-list__label-text {
  color: #4b5563;
  font-size: 13px;
  line-height: 1.35;
}

:deep(.rr-grid-list__cell--project),
:deep(.rr-grid-list__cell--test) {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

:deep(.rr-grid-list__cell--project) {
  justify-content: center;
  padding-block: 4px;
}
</style>
