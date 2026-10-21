import {
  ONEC_STATUS_LABELS,
  humanizeOnecErrorMessage,
  onecPrimaryMessage,
  type OnecSyncStatusLike,
} from 'bibli/widgets/Onboarding/lib/onecSyncUtils'
import type { StaffProfileModel } from '../composables/useStaffProfile'

export interface StaffOnecView {
  sync: OnecSyncStatusLike | null
  status: string | null
  statusLabel: string
  attempts: string
  updatedAtLabel: string
  message: string
  canSend: boolean
}

/** REGISTERED = 2, AGENT = 3 — как RoleEnum на бэке. */
export const STAFF_ROLE_AGENT = 3

export function resolveStaffRoleId(profile: StaffProfileModel): number | null {
  const fromStaff = Number(profile.rawStaffDetails?.data?.role_id)
  if (Number.isFinite(fromStaff) && fromStaff > 0) return fromStaff
  const fromReg = Number(profile.rawRegistration?.role_id)
  return Number.isFinite(fromReg) && fromReg > 0 ? fromReg : null
}

export function isStaffHiredAgent(profile: StaffProfileModel): boolean {
  return resolveStaffRoleId(profile) === STAFF_ROLE_AGENT
}

/**
 * Выгрузка в 1С: на подписании (до найма) и уже принятым агентам —
 * если анкета полностью заполнена.
 */
export function canStaffResyncOnec(profile: StaffProfileModel): boolean {
  if (profile.activationComplete !== true) return false
  return profile.onSigning === true || isStaffHiredAgent(profile)
}

const MONTHS_GENITIVE = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
]

/** «19 августа 2026» — без времени, как в макете вкладки 1С. */
export function formatOnecUpdatedAt(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  const day = date.getDate()
  const month = MONTHS_GENITIVE[date.getMonth()] || ''
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

export function buildStaffOnecView(profile: StaffProfileModel): StaffOnecView {
  const raw = profile.rawRegistration
  const sync = asRecord(raw?.onec_sync_status) as OnecSyncStatusLike | null
  const status =
    typeof sync?.status === 'string' && sync.status.trim() ? sync.status.trim() : null
  const statusLabel = status
    ? ONEC_STATUS_LABELS[status] || status
    : 'Не отправлен'

  const attemptsRaw = sync?.attempts
  const attempts =
    attemptsRaw == null || attemptsRaw === ''
      ? '—'
      : String(attemptsRaw)

  const primary = onecPrimaryMessage(sync)
  const humanized = humanizeOnecErrorMessage(primary)
  let message = humanized || primary
  if (!message) {
    message = status
      ? status === 'success'
        ? 'Данные агента успешно переданы в 1С'
        : '—'
      : 'Данные агента ещё не передавались в 1С'
  }

  return {
    sync,
    status,
    statusLabel,
    attempts,
    updatedAtLabel: formatOnecUpdatedAt(sync?.synced_at),
    message,
    canSend: canStaffResyncOnec(profile),
  }
}
