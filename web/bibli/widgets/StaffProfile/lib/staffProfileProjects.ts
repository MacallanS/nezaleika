import type { TraineeInfo } from '@/shared/types/trainee'
import { isTraineeExpired } from '@/shared/composables/trainee/useTrainee'
import {
  ONEC_STATUS_LABELS,
  type OnecSyncStatusLike,
} from 'bibli/widgets/Onboarding/lib/onecSyncUtils'
import type { StaffProfileModel } from '../composables/useStaffProfile'
import { canStaffResyncOnec } from './staffProfileOnec'

export type StaffTraineeCardState = 'empty' | 'active' | 'expired'

export interface StaffProjectsPointItem {
  id: number | null
  name: string
  address: string | null
  projectId: number | null
}

export interface StaffProjectsView {
  projectName: string
  pointName: string
  pointExtraCount: number
  projectExtraCount: number
  points: StaffProjectsPointItem[]
  projectId: number | null
  pointId: number | null
  referalProjectName: string
  referalPointName: string
  referalProjectId: number | null
  referalPointId: number | null
  joinedAt: string | null
  joinedLabel: string
  linkCreatedBy: string | null
  trainee: TraineeInfo | null
  traineeState: StaffTraineeCardState
  traineeDaysLeft: number | null
  traineeDaysLabel: string | null
  traineeUntilLabel: string | null
  traineeEndedLabel: string | null
  traineeActionLabel: string | null
  canGrantTrainee: boolean
  canHirePermanent: boolean
  onec: OnecSyncStatusLike | null
  onecStatusLabel: string
  onecReason: string
  onecAttempts: string
  onecResyncLabel: string
  canResyncOnec: boolean
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function readName(value: unknown): string {
  const rec = asRecord(value)
  const name = rec?.name
  return typeof name === 'string' && name.trim() ? name.trim() : ''
}

function readId(value: unknown): number | null {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : null
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

/** «20 июля 2026, 10:02» */
export function formatStaffJoinedLabel(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  const day = date.getDate()
  const month = MONTHS_GENITIVE[date.getMonth()] || ''
  const year = date.getFullYear()
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${day} ${month} ${year}, ${hh}:${mm}`
}

/** «до 21.08 23:59» / «до 19 августа, 23:59» */
export function formatStaffTraineeUntilLabel(
  iso: string | null | undefined,
  opts?: { longMonth?: boolean },
): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  const day = date.getDate()
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  if (opts?.longMonth) {
    const month = MONTHS_GENITIVE[date.getMonth()] || ''
    return `до ${day} ${month}, ${hh}:${mm}`
  }
  const mo = String(date.getMonth() + 1).padStart(2, '0')
  return `до ${day}.${mo} ${hh}:${mm}`
}

/** «Доступ закончился 15 августа, 23:59» */
export function formatStaffTraineeEndedLabel(iso: string | null | undefined): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  const day = date.getDate()
  const month = MONTHS_GENITIVE[date.getMonth()] || ''
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `Доступ закончился ${day} ${month}, ${hh}:${mm}`
}

function collectAttachedProjects(
  profile: StaffProfileModel,
): Array<{ id: number | null; name: string }> {
  const attached = profile.attached
  const items: Array<{ id: number | null; name: string }> = []
  const seen = new Set<string>()

  const push = (source: unknown) => {
    const rec = asRecord(source)
    if (!rec) return
    const name = readName(rec)
    if (!name) return
    const id = readId(rec.id)
    const key = id ? `id:${id}` : `name:${name}`
    if (seen.has(key)) return
    seen.add(key)
    items.push({ id, name })
  }

  if (Array.isArray(attached?.projects)) {
    for (const project of attached.projects) push(project)
  }
  if (attached?.project) push(attached.project)

  return items
}

function collectAttachedPoints(profile: StaffProfileModel): StaffProjectsPointItem[] {
  const attached = profile.attached
  const items: StaffProjectsPointItem[] = []
  const seen = new Set<string>()

  const push = (source: unknown) => {
    const rec = asRecord(source)
    if (!rec) return
    const name =
      readName(rec) ||
      (typeof rec.city === 'string' && rec.city.trim() ? rec.city.trim() : '')
    if (!name) return
    const id = readId(rec.id)
    const key = id ? `id:${id}` : `name:${name}`
    if (seen.has(key)) return
    seen.add(key)
    const address =
      (typeof rec.address === 'string' && rec.address.trim()) ||
      (typeof rec.city === 'string' && rec.city.trim() && rec.city.trim() !== name
        ? rec.city.trim()
        : null) ||
      null
    items.push({ id, name, address, projectId: readId(rec.project_id) || readId(asRecord(rec.project)?.id) })
  }

  if (Array.isArray(attached?.points)) {
    for (const point of attached.points) push(point)
  }
  if (attached?.point) push(attached.point)

  return items
}

/** Подпись кнопки выгрузки в 1С — единая для «Проекты» и меню «⋯». */
export function resolveOnecResyncLabel(status?: string | null): string {
  if (status === 'needs_resync') return 'Выгрузить в 1С'
  if (
    !status ||
    status === 'failed_validation' ||
    status === 'failed_transport' ||
    status === 'failed_onec'
  ) {
    return 'Синхронизировать с 1С'
  }
  return 'Повторить синхронизацию с 1С'
}

export function buildStaffProjectsView(profile: StaffProfileModel): StaffProjectsView {
  const raw = profile.rawRegistration
  const attached = profile.attached
  const referal = asRecord(raw?.referal)
  const referalProject = asRecord(referal?.project)

  const points = collectAttachedPoints(profile)
  const projects = collectAttachedProjects(profile)
  const primaryPoint = points[0] ?? null

  // Операционный «текущий проект» — по точкам (project_id), не по первому membership.
  // Иначе после перепривязки точка уже новая, а название проекта остаётся старым.
  const pointProjectIds = [
    ...new Set(
      points
        .map((pt) => pt.projectId)
        .filter((id): id is number => typeof id === 'number' && id > 0),
    ),
  ]

  const attachedProject = (() => {
    for (const projectId of pointProjectIds) {
      const matched = projects.find((project) => project.id === projectId)
      if (matched) return matched
    }
    if (attached?.project) {
      const rec = asRecord(attached.project)
      if (rec) {
        return { id: readId(rec.id), name: readName(rec) }
      }
    }
    return projects[0] ?? null
  })()

  const projectName =
    (attachedProject && attachedProject.name) ||
    (pointProjectIds[0] != null ? `Проект #${pointProjectIds[0]}` : '') ||
    'Без проекта'

  const projectId =
    attachedProject?.id || pointProjectIds[0] || projects[0]?.id || null

  const referalPointRec = asRecord(referal?.point) || referal
  const referalPointName =
    readName(referalPointRec) ||
    (typeof referalPointRec?.city === 'string' && referalPointRec.city.trim()
      ? referalPointRec.city.trim()
      : '') ||
    '—'
  const referalProjectName = readName(referalProject) || '—'
  const referalProjectId = readId(referalProject?.id) || readId(referal?.project_id)
  const referalPointId = readId(referalPointRec?.id) || readId(referal?.id)

  const pointId = primaryPoint?.id || null

  const joinedAt =
    (typeof raw?.registered_at === 'string' && raw.registered_at) ||
    (typeof raw?.created_at === 'string' && raw.created_at) ||
    null

  const invitedBy = asRecord(raw?.invited_by)
  const linkCreatedBy = (() => {
    const fromName =
      (typeof invitedBy?.invited_by_name === 'string' && invitedBy.invited_by_name.trim()) ||
      (typeof invitedBy?.name === 'string' && invitedBy.name.trim()) ||
      ''
    return fromName || null
  })()

  const traineeRaw = asRecord(raw?.trainee) as TraineeInfo | null
  let traineeState: StaffTraineeCardState = 'empty'
  let traineeDaysLeft: number | null = null
  let traineeDaysLabel: string | null = null
  let traineeUntilLabel: string | null = null
  let traineeEndedLabel: string | null = null
  let traineeActionLabel: string | null = 'Выдать'

  if (traineeRaw?.active) {
    traineeState = 'active'
    traineeDaysLeft =
      typeof traineeRaw.days_left === 'number' && Number.isFinite(traineeRaw.days_left)
        ? Math.max(0, Math.round(traineeRaw.days_left))
        : null
    traineeDaysLabel =
      traineeDaysLeft != null ? `${traineeDaysLeft} дн.` : null
    traineeUntilLabel = formatStaffTraineeUntilLabel(traineeRaw.expires_at)
    traineeActionLabel = 'Продлить'
  } else if (isTraineeExpired(traineeRaw)) {
    traineeState = 'expired'
    traineeEndedLabel =
      formatStaffTraineeEndedLabel(traineeRaw?.trainee_ended_at || traineeRaw?.expires_at) ||
      'Доступ закончился'
    traineeActionLabel = 'Выдать доступ'
  }

  const onec = asRecord(raw?.onec_sync_status) as OnecSyncStatusLike | null
  const onecStatus = typeof onec?.status === 'string' ? onec.status.trim() : ''
  const onecStatusLabel = onecStatus
    ? ONEC_STATUS_LABELS[onecStatus] || onecStatus
    : 'Не отправлен'
  const onecReason =
    (typeof onec?.error_message === 'string' && onec.error_message.trim()) ||
    'Отсутствует'
  const attempts = onec?.attempts
  const onecAttempts =
    attempts == null || attempts === ''
      ? '—'
      : String(attempts)

  const operationalProjectCount =
    pointProjectIds.length > 0 ? pointProjectIds.length : projects.length

  return {
    projectName,
    pointName: primaryPoint?.name || '—',
    pointExtraCount: Math.max(0, points.length - 1),
    projectExtraCount: Math.max(0, operationalProjectCount - 1),
    points,
    projectId,
    pointId,
    referalProjectName,
    referalPointName,
    referalProjectId,
    referalPointId,
    joinedAt,
    joinedLabel: formatStaffJoinedLabel(joinedAt),
    linkCreatedBy,
    trainee: traineeRaw,
    traineeState,
    traineeDaysLeft,
    traineeDaysLabel,
    traineeUntilLabel,
    traineeEndedLabel,
    traineeActionLabel,
    canGrantTrainee: traineeState !== 'active',
    canHirePermanent:
      profile.onSigning === true
      && (
        onecStatus === 'success'
        || onecStatus === 'skipped_not_smz'
      ),
    onec,
    onecStatusLabel,
    onecReason,
    onecAttempts,
    onecResyncLabel: resolveOnecResyncLabel(onecStatus || null),
    canResyncOnec: canStaffResyncOnec(profile),
  }
}
