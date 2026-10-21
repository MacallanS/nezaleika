import {
  ACTIVATION_PROGRESS_TOTAL,
  ACTIVATION_STEPS,
  normalizeActivationSteps,
  type ActivationStepStatus,
} from 'bibli/widgets/Profile/rr/lib/activationSteps'
import {
  resolveRrStatusPreset,
  rrStatusPresetToInlineStyle,
  type RrStatusPreset,
} from 'bibli/shared/ui/rr/lib/rrStatusPresets'

export type RegistrationSystemStatusId =
  | 'new'
  | 'filling'
  | 'review'
  | 'remarks'
  | 'accepted'
  | 'waiting'
  | 'waiting_send'
  | 'on_signing'
  | 'signed'
  | 'suspended'

export interface RegistrationSystemStatus {
  id: RegistrationSystemStatusId
  name: string
}

export interface RegistrationSystemStatusStyle {
  background: string
  color: string
  border: string
}

export const REGISTRATION_SYSTEM_STATUSES: RegistrationSystemStatus[] = [
  { id: 'new', name: 'Новая' },
  { id: 'filling', name: 'Заполняет данные' },
  { id: 'review', name: 'Проверить' },
  { id: 'remarks', name: 'Есть замечания' },
  { id: 'accepted', name: 'Готов к приёму' },
]

/** Системные статусы вкладки «На подписании» — ставятся вручную. */
export const SIGNING_SYSTEM_STATUSES: RegistrationSystemStatus[] = [
  { id: 'waiting', name: 'Ожидает' },
  { id: 'waiting_send', name: 'Ждет отправки' },
  { id: 'on_signing', name: 'На подписании' },
  { id: 'signed', name: 'Подписан' },
  { id: 'suspended', name: 'Приостановлено' },
]

const ALL_ACTIVATION_STEP_IDS = ACTIVATION_STEPS.map((step) => step.id)

const PROGRESS_STEP_IDS = ACTIVATION_STEPS.filter((step) => step.countsTowardProgress).map(
  (step) => step.id,
)

const REGISTRATION_STATUS_BY_ID = Object.fromEntries(
  REGISTRATION_SYSTEM_STATUSES.map((item) => [item.id, item]),
) as Record<string, RegistrationSystemStatus>

const SIGNING_STATUS_BY_ID = Object.fromEntries(
  SIGNING_SYSTEM_STATUSES.map((item) => [item.id, item]),
) as Record<string, RegistrationSystemStatus>

const STATUS_BY_ID: Record<string, RegistrationSystemStatus> = {
  ...REGISTRATION_STATUS_BY_ID,
  ...SIGNING_STATUS_BY_ID,
}

function activationProgress(steps: Record<string, ActivationStepStatus>): number {
  let completed = 0
  for (const stepId of PROGRESS_STEP_IDS) {
    const status = steps[stepId]
    if (status === 'partial' || status === 'review' || status === 'done') completed += 1
  }
  return completed
}

function hasActivationErrors(steps: Record<string, ActivationStepStatus>): boolean {
  return Object.values(steps).some((status) => status === 'error')
}

function hasActivationReviewSteps(steps: Record<string, ActivationStepStatus>): boolean {
  return Object.values(steps).some((status) => status === 'review')
}

function allActivationStepsDone(steps: Record<string, ActivationStepStatus>): boolean {
  return ALL_ACTIVATION_STEP_IDS.every((stepId) => steps[stepId] === 'done')
}

function isRegistrationStatusId(value: unknown): value is RegistrationSystemStatusId {
  return typeof value === 'string' && value in REGISTRATION_STATUS_BY_ID
}

function isSigningStatusId(value: unknown): value is RegistrationSystemStatusId {
  return typeof value === 'string' && value in SIGNING_STATUS_BY_ID
}

function isSystemStatusId(value: unknown): value is RegistrationSystemStatusId {
  return typeof value === 'string' && value in STATUS_BY_ID
}

function isOnSigningUser(user: {
  activation?: { on_signing?: boolean } | null
  registration?: { on_signing?: boolean | number | null } | null
  on_signing?: boolean | number | null
} | null | undefined): boolean {
  if (user?.activation?.on_signing === true) return true
  if (user?.on_signing === true || Number(user?.on_signing) === 1) return true
  if (user?.registration?.on_signing === true || Number(user?.registration?.on_signing) === 1) {
    return true
  }
  return false
}

/** Авто-статус только по прогрессу активации (без ручного override). */
export function resolveRegistrationAutoSystemStatus(user: {
  activation?: {
    complete?: boolean
    on_signing?: boolean
    steps?: Partial<Record<string, string>>
  } | null
  registration?: { on_signing?: boolean | number | null } | null
  on_signing?: boolean | number | null
} | null | undefined): RegistrationSystemStatus {
  if (isOnSigningUser(user)) {
    return SIGNING_STATUS_BY_ID.on_signing
  }

  const activation = user?.activation
  const steps = normalizeActivationSteps(activation?.steps)

  if (hasActivationErrors(steps)) {
    return REGISTRATION_STATUS_BY_ID.remarks
  }

  if (allActivationStepsDone(steps)) {
    return REGISTRATION_STATUS_BY_ID.accepted
  }

  const complete = activation?.complete === true

  if (complete && hasActivationReviewSteps(steps)) {
    return REGISTRATION_STATUS_BY_ID.review
  }

  if (activationProgress(steps) > 0) {
    return REGISTRATION_STATUS_BY_ID.filling
  }

  return REGISTRATION_STATUS_BY_ID.new
}

/**
 * Fallback, если API ещё без system_status.
 * Ручной override учитывается в рамках текущего этапа (новые / подписание).
 */
export function resolveRegistrationSystemStatus(user: {
  activation?: {
    complete?: boolean
    on_signing?: boolean
    steps?: Partial<Record<string, string>>
  } | null
  registration?: {
    manual_system_status?: string | null
    on_signing?: boolean | number | null
  } | null
  manual_system_status?: string | null
  on_signing?: boolean | number | null
} | null | undefined): RegistrationSystemStatus {
  const onSigning = isOnSigningUser(user)
  const manual =
    user?.manual_system_status ?? user?.registration?.manual_system_status ?? null

  if (onSigning) {
    if (isSigningStatusId(manual)) {
      return SIGNING_STATUS_BY_ID[manual]
    }
    return SIGNING_STATUS_BY_ID.on_signing
  }

  if (isRegistrationStatusId(manual)) {
    return REGISTRATION_STATUS_BY_ID[manual]
  }

  return resolveRegistrationAutoSystemStatus(user)
}

export function getRegistrationSystemStatusPreset(
  status: RegistrationSystemStatus | null | undefined,
): RrStatusPreset {
  const id = status?.id ?? 'new'
  const kind = isSigningStatusId(id) ? 'signing' : 'registration'
  return resolveRrStatusPreset({
    id,
    name: status?.name,
    kind,
  })
}

export function getRegistrationSystemStatusStyle(
  status: RegistrationSystemStatus | null | undefined,
): RegistrationSystemStatusStyle {
  return rrStatusPresetToInlineStyle(getRegistrationSystemStatusPreset(status))
}

export function getRegistrationSystemStatusForUser(user: {
  system_status?: RegistrationSystemStatus | null
  activation?: {
    complete?: boolean
    on_signing?: boolean
    steps?: Partial<Record<string, string>>
  } | null
  registration?: {
    manual_system_status?: string | null
    on_signing?: boolean | number | null
  } | null
  manual_system_status?: string | null
  on_signing?: boolean | number | null
} | null | undefined): RegistrationSystemStatus {
  const fromApi = user?.system_status
  if (fromApi?.id && fromApi?.name && isSystemStatusId(fromApi.id)) {
    // API мог отдать registration-статус при on_signing до деплоя бэка — не доверяем слепо.
    if (isOnSigningUser(user) && !isSigningStatusId(fromApi.id)) {
      return resolveRegistrationSystemStatus(user)
    }
    if (!isOnSigningUser(user) && isSigningStatusId(fromApi.id)) {
      return resolveRegistrationSystemStatus(user)
    }
    return fromApi
  }
  return resolveRegistrationSystemStatus(user)
}

export { ACTIVATION_PROGRESS_TOTAL }
