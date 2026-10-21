import {
  getRegistrationSystemStatusForUser,
  getRegistrationSystemStatusStyle,
  REGISTRATION_SYSTEM_STATUSES,
  SIGNING_SYSTEM_STATUSES,
  type RegistrationSystemStatus,
} from './registrationSystemStatus'
import type { OnecSyncStatusLike } from './onecSyncUtils'
import {
  ACTIVATION_PROGRESS_TOTAL,
  ACTIVATION_STEPS,
  normalizeActivationSteps,
  type ActivationStepStatus,
} from 'bibli/widgets/Profile/rr/lib/activationSteps'
import { formatPhonePlus } from '@/shared/utils/phoneDisplay'

export type { RegistrationSystemStatus }
export {
  getRegistrationSystemStatusForUser,
  getRegistrationSystemStatusStyle,
  REGISTRATION_SYSTEM_STATUSES,
  SIGNING_SYSTEM_STATUSES,
}

export type OnboardingTab = 'registered' | 'signing' | 'deleted'

export interface OnboardingStatusOption {
  id: number | string
  name: string
  color?: string | null
}

export interface OnboardingListUser {
  id?: number
  user_id?: number
  surname?: string | null
  name?: string | null
  patronymic?: string | null
  phone?: string | null
  role_id?: number | null
  created_at?: string | null
  updated_at?: string | null
  registered_at?: string | null
  on_signing_at?: string | null
  new_user_status_id?: number | null
  type_id?: number | null
  referal?: {
    id?: number
    name?: string
    address?: string
    project_id?: number
    project?: { id?: number; name?: string } | null
    point?: { name?: string; address?: string } | null
  } | null
  registration?: {
    new_user_status?: OnboardingStatusOption | null
    new_user_statuses?: OnboardingStatusOption[] | null
    type?: OnboardingStatusOption | null
    manual_system_status?: string | null
    on_signing_at?: string | null
  } | null
  manual_system_status?: string | null
  activation?: {
    steps?: Partial<Record<string, string>>
    complete?: boolean
    on_signing?: boolean
  } | null
  system_status?: RegistrationSystemStatus | null
  trainee?: {
    active?: boolean
    days_left?: number | null
    expires_at?: string | null
    was_trainee?: boolean
  } | null
  data?: {
    file_agent_with_passport?: string | null
  } | null
  labels?: string[] | null
  onec_sync_status?: OnecSyncStatusLike | null
}

export function getOnboardingFullName(user: OnboardingListUser | null | undefined): string {
  if (!user) return '—'
  const parts = [user.surname, user.name, user.patronymic].filter(Boolean)
  return parts.join(' ') || '—'
}

export function getOnboardingInitials(user: OnboardingListUser | null | undefined): string {
  const surname = user?.surname?.trim()?.[0] ?? ''
  const name = user?.name?.trim()?.[0] ?? ''
  const value = `${surname}${name}`.toUpperCase()
  return value || '?'
}

export function getOnboardingProjectName(user: OnboardingListUser): string {
  const referal = user.referal
  if (!referal) return '—'
  return referal.project?.name?.trim() || '—'
}

export function getOnboardingPointAddress(user: OnboardingListUser): string {
  const referal = user.referal
  if (!referal) return ''
  return referal.point?.address?.trim() || referal.address?.trim() || ''
}

export function getOnboardingPointName(user: OnboardingListUser): string {
  const referal = user.referal
  if (!referal) return '—'
  return referal.point?.name?.trim() || referal.name?.trim() || '—'
}

export function getOnboardingSupportLabels(
  user: OnboardingListUser,
  catalog: OnboardingStatusOption[] = [],
): OnboardingStatusOption[] {
  const fromMany = user.registration?.new_user_statuses
  if (Array.isArray(fromMany) && fromMany.length > 0) {
    return fromMany
      .filter((item) => item?.name)
      .map((item) => ({
        id: item.id ?? item.name,
        name: String(item.name),
      }))
  }

  const fromRelation = user.registration?.new_user_status
  if (fromRelation?.name) {
    return [{
      id: fromRelation.id ?? user.new_user_status_id ?? fromRelation.name,
      name: String(fromRelation.name),
    }]
  }

  const labelId = user.new_user_status_id
  if (labelId != null) {
    const fromCatalog = catalog.find((item) => String(item.id) === String(labelId))
    if (fromCatalog) {
      return [{ id: fromCatalog.id, name: fromCatalog.name }]
    }
  }

  // Legacy: на «Новых» метка могла жить в registration.type до new_user_status.
  const legacyType = user.registration?.type
  if (legacyType?.name) {
    return [{
      id: legacyType.id ?? user.type_id ?? legacyType.name,
      name: String(legacyType.name),
    }]
  }

  return []
}

export function getOnboardingSupportLabel(
  user: OnboardingListUser,
  catalog: OnboardingStatusOption[] = [],
): OnboardingStatusOption | null {
  return getOnboardingSupportLabels(user, catalog)[0] ?? null
}

export function getOnboardingSupportLabelIds(
  user: OnboardingListUser,
  catalog: OnboardingStatusOption[] = [],
): Array<string | number> {
  return getOnboardingSupportLabels(user, catalog).map((item) => item.id)
}

export function getOnboardingSupportLabelName(user: OnboardingListUser): string | null {
  return getOnboardingSupportLabel(user)?.name?.trim() || null
}

export function getOnboardingPointId(user: OnboardingListUser): string | number | null {
  const referal = user.referal
  if (!referal?.id) return null
  return referal.id
}

export function getOnboardingProjectId(user: OnboardingListUser): string | number | null {
  const referal = user.referal
  if (!referal) return null
  return referal.project_id ?? referal.project?.id ?? null
}

export function resolveOnboardingStatus(
  user: OnboardingListUser,
  activeTab: OnboardingTab,
  statuses: OnboardingStatusOption[],
  _newStatuses: OnboardingStatusOption[],
): OnboardingStatusOption | null {
  if (activeTab === 'registered') {
    const systemStatus = getRegistrationSystemStatusForUser(user)
    return { id: systemStatus.id, name: systemStatus.name }
  }

  const fromRelation = user.registration?.type
  if (fromRelation?.name) return fromRelation
  const statusId = user.type_id
  if (statusId == null) return null
  return statuses.find((item) => String(item.id) === String(statusId)) ?? null
}

export function resolveOnboardingSystemStatus(user: OnboardingListUser) {
  return getRegistrationSystemStatusForUser(user)
}

export function resolveOnboardingSystemStatusStyle(user: OnboardingListUser) {
  return getRegistrationSystemStatusStyle(resolveOnboardingSystemStatus(user))
}

export function getActivationProgress(user: OnboardingListUser): { completed: number; total: number } {
  const steps = normalizeActivationSteps(user.activation?.steps)
  let completed = 0

  for (const step of ACTIVATION_STEPS) {
    if (!step.countsTowardProgress) continue
    const status = steps[step.id] as ActivationStepStatus
    if (status === 'review' || status === 'done') {
      completed += 1
    }
  }

  return { completed, total: ACTIVATION_PROGRESS_TOTAL }
}

function formatShortDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`
}

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function parseOnboardingDate(value: string | null | undefined): Date | null {
  if (value == null) return null
  const raw = String(value).trim()
  if (!raw) return null

  const direct = new Date(raw)
  if (!Number.isNaN(direct.getTime())) return direct

  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/)
  if (match) {
    const parsed = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
    )
    if (!Number.isNaN(parsed.getTime())) return parsed
  }

  return null
}

export function getOnboardingRegisteredAt(
  user: Pick<OnboardingListUser, 'registered_at' | 'created_at' | 'updated_at'> | null | undefined,
): string | null {
  if (!user) return null
  const candidates = [user.registered_at, user.created_at, user.updated_at]
  for (const value of candidates) {
    if (value == null) continue
    const raw = String(value).trim()
    if (raw) return raw
  }
  return null
}

export function getOnboardingOnSigningAt(
  user: Pick<OnboardingListUser, 'on_signing_at' | 'registration'> | null | undefined,
): string | null {
  if (!user) return null
  const candidates = [user.on_signing_at, user.registration?.on_signing_at]
  for (const value of candidates) {
    if (value == null) continue
    const raw = String(value).trim()
    if (raw) return raw
  }
  return null
}

export function formatOnboardingJoinedAt(value: string | null | undefined): string {
  const date = parseOnboardingDate(value)
  if (!date) return '—'

  const now = new Date()
  const time = formatTime(date)

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dayDiff = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86400000)

  if (dayDiff === 0) return `сегодня в ${time}`
  if (dayDiff === 1) return `вчера в ${time}`

  return `${formatShortDate(date)} в ${time}`
}

function formatTestAccessDaysLeft(daysLeft: number): string {
  const n = Math.max(0, Math.round(daysLeft))
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return `${n} день`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} дня`
  return `${n} дн.`
}

export function formatOnboardingTestAccess(user: OnboardingListUser): {
  primary: string
  secondary?: string
  tone: 'default' | 'muted' | 'danger'
} {
  const trainee = user.trainee

  if (trainee?.active) {
    const daysLeft = trainee.days_left ?? 0
    const primary = formatTestAccessDaysLeft(daysLeft)
    let secondary = ''
    if (trainee.expires_at) {
      const expires = new Date(trainee.expires_at)
      if (!Number.isNaN(expires.getTime())) {
        secondary = `до ${formatShortDate(expires)}`
      }
    }
    return { primary, secondary, tone: 'default' }
  }

  if (trainee?.was_trainee) {
    return { primary: 'Истёк', tone: 'danger' }
  }

  return { primary: 'Еще не был выдан', tone: 'muted' }
}

export function formatOnboardingRolePhone(
  user: OnboardingListUser,
  roleName?: string | null,
): string {
  const role = roleName?.trim() || 'кандидат'
  const phone = user.phone ? formatPhonePlus(user.phone) : ''
  return phone ? `${role} · ${phone}` : role
}

export function statusBadgeTone(
  user: OnboardingListUser,
  activeTab: OnboardingTab,
  statusName: string,
  color?: string | null,
): {
  background: string
  color: string
  border: string
} {
  if (activeTab === 'registered') {
    return getRegistrationSystemStatusStyle(getRegistrationSystemStatusForUser(user))
  }

  const normalized = statusName.toLowerCase()
  if (normalized.includes('замеч') || normalized.includes('внести правк') || (normalized.includes('требуетс') && normalized.includes('доработ'))) {
    return getRegistrationSystemStatusStyle({ id: 'remarks', name: 'Есть замечания' })
  }
  if (normalized.includes('провер')) {
    return getRegistrationSystemStatusStyle({ id: 'review', name: 'Проверить' })
  }
  if (normalized.includes('нов')) {
    return getRegistrationSystemStatusStyle({ id: 'new', name: 'Новая' })
  }
  if (color) {
    return {
      background: `${color}1a`,
      color,
      border: `${color}33`,
    }
  }
  return getRegistrationSystemStatusStyle({ id: 'filling', name: 'Заполняет данные' })
}
