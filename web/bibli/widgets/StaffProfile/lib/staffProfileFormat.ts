import { formatPhoneRuDisplay } from '@/shared/utils/russia/phoneDisplay'

export function buildStaffFullName(user: {
  surname?: string | null
  name?: string | null
  patronymic?: string | null
  fio?: string | null
} | null | undefined): string {
  if (!user) return '—'
  if (user.fio?.trim()) return user.fio.trim()
  return [user.surname, user.name, user.patronymic].filter(Boolean).join(' ').trim() || '—'
}

export function buildStaffInitials(user: {
  surname?: string | null
  name?: string | null
} | null | undefined): string {
  if (!user) return '?'
  const s = user.surname?.trim()?.charAt(0)?.toUpperCase() || ''
  const n = user.name?.trim()?.charAt(0)?.toUpperCase() || ''
  return `${s}${n}` || '?'
}

export function formatPassportSeriesNumber(passport: string | null | undefined): {
  series: string
  number: string
  display: string
} {
  if (!passport) {
    return { series: '', number: '', display: '—' }
  }

  const digits = String(passport).replace(/\D/g, '')
  if (digits.length === 10) {
    const series = digits.slice(0, 4)
    const number = digits.slice(4)
    return {
      series,
      number,
      display: `${series} ${number}`,
    }
  }

  return { series: '', number: digits, display: passport.trim() || '—' }
}

export function formatStaffContactPhone(phone: string | null | undefined): string {
  return formatPhoneRuDisplay(phone)
}

export function formatStaffSnils(snils: string | null | undefined): string {
  if (!snils?.trim()) return '—'
  const digits = snils.replace(/\D/g, '')
  if (digits.length !== 11) return snils.trim()
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 9)} ${digits.slice(9, 11)}`
}

export function formatTelegramHandle(username: string | null | undefined): string {
  if (!username?.trim()) return '—'
  const value = username.trim()
  return value.startsWith('@') ? value : `@${value}`
}

export function formatUploadMeta(dateValue: string | null | undefined): string {
  if (!dateValue) return ''
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return ''
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `загружен ${day}.${month}`
}

export const STAFF_ACTIVATION_REJECT_REASON_LABELS: Record<string, string> = {
  illegible_scan: 'Нечитаемый скан',
  data_mismatch: 'Данные не совпадают',
  expired_document: 'Документ просрочен',
  cropped_document: 'Обрезанный документ',
  other: 'Другое',
}

export function formatStaffRejectReason(reason: string | null | undefined): string {
  if (!reason?.trim()) return ''
  return STAFF_ACTIVATION_REJECT_REASON_LABELS[reason] || reason.trim()
}

export function resolveStaffDocVersion(options: {
  stepStatus?: string | null
  rejectCount?: number
}): number {
  const count = Math.max(0, options.rejectCount ?? 0)
  if (options.stepStatus === 'error') return Math.max(1, count)
  return count + 1
}

const FIELD_ROLE_SHORT_LABELS: Record<string, string> = {
  supervisor: 'СВ',
  promoter: 'Консультант',
}

export function resolveStaffFieldRoleLabel(profile: {
  core_field_role?: string | null
  core_field_role_label?: string | null
} | null | undefined): string | null {
  if (!profile) return null
  const code = String(profile.core_field_role || '').trim()
  if (code && FIELD_ROLE_SHORT_LABELS[code]) {
    return FIELD_ROLE_SHORT_LABELS[code]
  }
  const label = String(profile.core_field_role_label || '').trim()
  if (!label) return null
  if (label.includes('СВ') || /супервайзер/i.test(label)) return 'СВ'
  if (/консультант|промоутер/i.test(label)) return 'Консультант'
  return label
}

export function resolveStaffLocationLabel(profile: {
  core_field_role?: string | null
  core_field_role_label?: string | null
  attached?: {
    project?: { id?: number | null; name?: string | null }
    point?: { name?: string | null; city?: string | null; project_id?: number | null }
    projects?: Array<{ id?: number | null; name?: string | null }>
    points?: Array<{ name?: string | null; city?: string | null; project_id?: number | null }>
  } | null
  referal?: { project?: { name?: string | null }; name?: string | null } | null
} | null | undefined): string {
  if (!profile) return '—'

  const points = Array.isArray(profile.attached?.points)
    ? profile.attached.points
    : profile.attached?.point
      ? [profile.attached.point]
      : []
  const pointProjectId = (() => {
    for (const point of points) {
      const id = Number(point?.project_id)
      if (Number.isFinite(id) && id > 0) return id
    }
    return null
  })()

  const matchedProject =
    pointProjectId != null && Array.isArray(profile.attached?.projects)
      ? profile.attached.projects.find((project) => Number(project?.id) === pointProjectId)
      : null

  const projectName =
    matchedProject?.name ||
    profile.attached?.project?.name ||
    profile.attached?.projects?.[0]?.name ||
    profile.referal?.project?.name ||
    null

  const pointName =
    profile.attached?.point?.name ||
    profile.attached?.points?.[0]?.name ||
    profile.referal?.name ||
    null

  const city =
    profile.attached?.point?.city ||
    profile.attached?.points?.[0]?.city ||
    null

  const fieldRole = resolveStaffFieldRoleLabel(profile)

  const parts = [projectName, fieldRole, pointName || city].filter(Boolean)
  return parts.length ? parts.join(' · ') : '—'
}
