import {
  ACTIVATION_STEPS,
  type ActivationStepId,
  type ActivationStepsMap,
} from 'bibli/widgets/Profile/rr/lib/activationSteps'
import {
  resolveActivationBlockStatus,
  type ActivationBlockStatusTone,
} from 'bibli/widgets/Profile/rr/lib/activationBlockStatus'
import { ONEC_STATUS_LABELS } from 'bibli/widgets/Onboarding/lib/onecSyncUtils'
import type { TraineeInfo } from '@/shared/types/trainee'
import { isTraineeExpired } from '@/shared/composables/trainee/useTrainee'
import type { StaffProfileModel } from '../composables/useStaffProfile'
import { STAFF_PROFILE_DOC_VALUES } from './staffProfileTabs'

export type StaffOverviewMetricTone = 'muted' | 'success' | 'warning' | 'danger'

export interface StaffOverviewMetric {
  label: string
  value: string
  tone?: StaffOverviewMetricTone
}

export interface StaffOverviewSummaryCard {
  id: 'documents' | 'projects' | 'other' | 'settings' | 'products'
  title: string
  value: string
  metrics: StaffOverviewMetric[]
}

export interface StaffOverviewAttentionItem {
  id: ActivationStepId
  title: string
  icon: string
  statusLabel: string
  tone: ActivationBlockStatusTone
  /** Колокол справа — для empty/error (нужно действие агента). */
  showNotify: boolean
}

/** Короткие подписи 1С для карточки обзора (все известные статусы). */
const OVERVIEW_ONEC_METRIC: Record<
  string,
  { value: string; tone: StaffOverviewMetricTone }
> = {
  pending: { value: 'В очереди', tone: 'warning' },
  success: { value: 'Успешно', tone: 'success' },
  needs_resync: { value: 'Нужна выгрузка', tone: 'warning' },
  skipped_not_smz: { value: 'Не выгружается', tone: 'muted' },
  failed_validation: { value: 'Ошибка данных', tone: 'danger' },
  failed_transport: { value: 'Ошибка сети', tone: 'danger' },
  failed_onec: { value: 'Ошибка 1С', tone: 'danger' },
}

function formatTraineeUntil(expiresAt: string | null | undefined): string | null {
  if (!expiresAt) return null
  const date = new Date(expiresAt)
  if (Number.isNaN(date.getTime())) return null
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `до ${day}.${month}`
}

function resolveTraineeInfo(profile: StaffProfileModel): TraineeInfo | null {
  const raw = profile.rawRegistration as Record<string, unknown> | null
  const reg = profile.registration as Record<string, unknown> | null
  const candidate = raw?.trainee ?? reg?.trainee
  if (!candidate || typeof candidate !== 'object') return null
  return candidate as TraineeInfo
}

export function resolveTraineeMetric(profile: StaffProfileModel): StaffOverviewMetric {
  const trainee = resolveTraineeInfo(profile)
  if (!trainee) {
    return { label: 'Тестовый период', value: 'Нет', tone: 'muted' }
  }
  if (trainee.active) {
    const until = formatTraineeUntil(trainee.expires_at)
    if (until) {
      return { label: 'Тестовый период', value: until, tone: 'success' }
    }
    if (typeof trainee.days_left === 'number') {
      return {
        label: 'Тестовый период',
        value: `${trainee.days_left} дн.`,
        tone: 'success',
      }
    }
    return { label: 'Тестовый период', value: 'Активен', tone: 'success' }
  }
  if (isTraineeExpired(trainee)) {
    return { label: 'Тестовый период', value: 'Завершён', tone: 'muted' }
  }
  return { label: 'Тестовый период', value: 'Нет', tone: 'muted' }
}

export function resolveOnecMetric(profile: StaffProfileModel): StaffOverviewMetric {
  const status = String(profile.onecSyncStatus || '').trim()
  if (!status) {
    return { label: 'Синхронизация 1С', value: 'Нет', tone: 'muted' }
  }
  const known = OVERVIEW_ONEC_METRIC[status]
  if (known) {
    return { label: 'Синхронизация 1С', value: known.value, tone: known.tone }
  }
  // Неизвестный статус с бэка — короткий fallback, без сырого ключа где возможно.
  const fallback = ONEC_STATUS_LABELS[status] || status
  return { label: 'Синхронизация 1С', value: fallback, tone: 'warning' }
}

/** Все разделы активации приняты саппортом (`done`). */
export function areAllActivationStepsAccepted(
  steps: ActivationStepsMap | null | undefined,
): boolean {
  if (!steps) return false
  return ACTIVATION_STEPS.every((step) => {
    const status = steps[step.id]
    return status === 'done'
  })
}

/**
 * CTA «Перенести на подписание»:
 * нельзя при пустых / на проверке / отклонённых разделах —
 * только когда саппорт принял все блоки (включая тип оформления).
 */
export function canMoveStaffToSigning(profile: StaffProfileModel): boolean {
  if (profile.onSigning) return false
  const steps = profile.activationSteps
  if (!steps) return false

  for (const step of ACTIVATION_STEPS) {
    const status = steps[step.id]
    if (
      status === 'empty' ||
      status === 'partial' ||
      status === 'review' ||
      status === 'error' ||
      status == null
    ) {
      return false
    }
    if (status !== 'done') return false
  }
  return true
}

/** CTA «Принять на работу» — только на подписании и после успешной/пропущенной выгрузки в 1С. */
export function isOnecReadyForHire(profile: StaffProfileModel): boolean {
  const status = profile.onecSyncStatus
  return (
    status === 'success'
    || status === 'skipped_not_smz'
  )
}

export function canHireStaffPermanent(profile: StaffProfileModel): boolean {
  if (profile.onSigning !== true) return false
  return isOnecReadyForHire(profile)
}

function resolvePrimaryProjectName(profile: StaffProfileModel): string {
  const attached = profile.attached
  if (!attached) return '—'

  const pointProjectIds = new Set<number>()
  const collectPointProjectId = (source: unknown) => {
    if (!source || typeof source !== 'object') return
    const rec = source as { project_id?: unknown; project?: { id?: unknown } }
    const raw = rec.project_id ?? rec.project?.id
    const id = typeof raw === 'number' ? raw : Number(raw)
    if (Number.isFinite(id) && id > 0) pointProjectIds.add(id)
  }
  if (Array.isArray(attached.points)) {
    for (const point of attached.points) collectPointProjectId(point)
  }
  if (attached.point) collectPointProjectId(attached.point)

  if (pointProjectIds.size > 0 && Array.isArray(attached.projects)) {
    for (const item of attached.projects) {
      if (!item || typeof item !== 'object') continue
      const id = Number((item as { id?: unknown }).id)
      if (!pointProjectIds.has(id)) continue
      const name = String((item as { name?: unknown }).name || '').trim()
      if (name) return name
    }
  }

  const fromPrimary = attached.project
  if (fromPrimary && typeof fromPrimary === 'object' && 'name' in fromPrimary) {
    const name = String((fromPrimary as { name?: unknown }).name || '').trim()
    if (name) return name
  }
  if (Array.isArray(attached.projects)) {
    for (const item of attached.projects) {
      if (!item || typeof item !== 'object' || !('name' in item)) continue
      const name = String((item as { name?: unknown }).name || '').trim()
      if (name) return name
    }
  }
  return '—'
}

/** Документы активации (без agent-type — он в «Другое»). */
const OVERVIEW_DOC_STEPS = STAFF_PROFILE_DOC_VALUES.filter((id) => id !== 'agent-type')

interface OverviewStepCounts {
  empty: number
  review: number
  error: number
  done: number
  present: number
}

function resolveDocumentsCardValue(counts: OverviewStepCounts): string {
  const allAccepted =
    counts.done === OVERVIEW_DOC_STEPS.length &&
    counts.empty === 0 &&
    counts.review === 0 &&
    counts.error === 0
  if (allAccepted) {
    return 'Все приняты'
  }
  return String(counts.present)
}

function countActivationStatuses(
  ids: readonly ActivationStepId[],
  steps: ActivationStepsMap,
): OverviewStepCounts {
  let empty = 0
  let review = 0
  let error = 0
  let done = 0

  for (const id of ids) {
    switch (steps[id]) {
      case 'review':
        review += 1
        break
      case 'error':
        error += 1
        break
      case 'done':
        done += 1
        break
      default:
        empty += 1
    }
  }

  return { empty, review, error, done, present: review + error + done }
}

function overviewDocStatusMetrics(counts: OverviewStepCounts): StaffOverviewMetric[] {
  return [
    {
      label: 'Не загружено',
      value: String(counts.empty),
      tone: counts.empty > 0 ? 'warning' : 'muted',
    },
    {
      label: 'Требуют проверки',
      value: String(counts.review),
      tone: counts.review > 0 ? 'warning' : 'muted',
    },
    {
      label: 'Отклонено',
      value: String(counts.error),
      tone: counts.error > 0 ? 'danger' : 'muted',
    },
  ]
}

export function buildStaffOverviewSummary(
  profile: StaffProfileModel,
): StaffOverviewSummaryCard[] {
  const steps = profile.activationSteps
  const docs = countActivationStatuses(OVERVIEW_DOC_STEPS, steps)
  const other = countActivationStatuses(['agent-type'], steps)

  return [
    {
      id: 'documents',
      title: 'Документы',
      value: resolveDocumentsCardValue(docs),
      metrics: overviewDocStatusMetrics(docs),
    },
    {
      id: 'projects',
      title: 'Проект',
      value: resolvePrimaryProjectName(profile),
      metrics: [resolveTraineeMetric(profile), resolveOnecMetric(profile)],
    },
    {
      id: 'other',
      title: 'Другие документы',
      value: 'В разработке',
      metrics: overviewDocStatusMetrics(other),
    },
  ]
}

/**
 * Порядок в «Требуют внимания» для саппорта:
 * review — действие саппорта, error — ждём агента после отказа,
 * empty/partial — агент ещё не закончил заполнение.
 * done / unavailable в список не попадают (пустое состояние — «Пока всё в порядке»).
 */
const ATTENTION_TONES = new Set<ActivationBlockStatusTone>([
  'review',
  'error',
  'empty',
  'partial',
])

const ATTENTION_PRIORITY: Record<'review' | 'error' | 'empty' | 'partial', number> = {
  review: 0,
  error: 1,
  partial: 2,
  empty: 3,
}

function attentionNeedsAgentAction(tone: ActivationBlockStatusTone): boolean {
  return tone === 'empty' || tone === 'partial' || tone === 'error'
}

export function buildStaffOverviewAttention(
  stepsMap: ActivationStepsMap,
): StaffOverviewAttentionItem[] {
  const items: StaffOverviewAttentionItem[] = []

  for (const step of ACTIVATION_STEPS) {
    if (!STAFF_PROFILE_DOC_VALUES.includes(step.id)) continue

    const view = resolveActivationBlockStatus(stepsMap[step.id], {
      audience: 'support',
    })
    // Принято (done) и unavailable — не в «Требуют внимания»
    if (!ATTENTION_TONES.has(view.tone)) continue

    items.push({
      id: step.id,
      title: step.title,
      icon: step.icon,
      statusLabel: view.label,
      tone: view.tone,
      showNotify: attentionNeedsAgentAction(view.tone),
    })
  }

  return items.sort(
    (a, b) =>
      ATTENTION_PRIORITY[a.tone as keyof typeof ATTENTION_PRIORITY] -
      ATTENTION_PRIORITY[b.tone as keyof typeof ATTENTION_PRIORITY],
  )
}

export function activationStepIcon(stepId: string | null | undefined): string | null {
  if (!stepId) return null
  return ACTIVATION_STEPS.find((step) => step.id === stepId)?.icon ?? null
}

export const OVERVIEW_HISTORY_PREVIEW_LIMIT = 7

/** Сколько строк тянуть с API для превью на Обзоре. */
export const OVERVIEW_HISTORY_FETCH_LIMIT = OVERVIEW_HISTORY_PREVIEW_LIMIT

/**
 * Превью «Последние изменения» на Обзоре: первые `limit` записей (newest-first).
 */
export function selectOverviewHistoryPreview<T>(
  items: T[],
  limit = OVERVIEW_HISTORY_PREVIEW_LIMIT,
): T[] {
  if (!Array.isArray(items) || items.length === 0) return []
  return items.slice(0, limit)
}

export function resolveStaffOverviewDisplayName(profile: StaffProfileModel): string {
  const raw = profile.rawRegistration as Record<string, unknown> | null
  const reg = profile.registration as Record<string, unknown> | null
  const fromRaw = typeof raw?.name === 'string' ? raw.name.trim() : ''
  if (fromRaw) return fromRaw
  const fromReg = typeof reg?.name === 'string' ? reg.name.trim() : ''
  if (fromReg) return fromReg
  const firstFromFull = profile.fullName.split(/\s+/).filter(Boolean)[0]
  if (firstFromFull && firstFromFull !== '—') return firstFromFull
  return 'Сотрудник'
}

function resolveStaffOverviewGender(profile: StaffProfileModel): 'm' | 'f' | null {
  const raw = profile.rawRegistration as Record<string, unknown> | null
  const reg = profile.registration as Record<string, unknown> | null
  const staffData = profile.rawStaffDetails?.data as Record<string, unknown> | undefined
  const g = raw?.gender ?? reg?.gender ?? staffData?.gender
  if (g === 'm' || g === 'f') return g
  return null
}

/** Текст пустого блока «Требуют внимания», когда все разделы в порядке. */
export function buildStaffOverviewAllClearMessage(profile: StaffProfileModel): string {
  const name = resolveStaffOverviewDisplayName(profile)
  const gender = resolveStaffOverviewGender(profile)
  if (gender === 'f') {
    return `${name} зарегистрировалась и заполняет данные. Действие сейчас не требуется`
  }
  if (gender === 'm') {
    return `${name} зарегистрировался и заполняет данные. Действие сейчас не требуется`
  }
  return `${name} заполняет данные. Действие сейчас не требуется`
}
