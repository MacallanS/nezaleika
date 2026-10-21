import { ref, type Ref } from 'vue'
import { getDocumentUrl } from '@/shared/api/http/http'
import { fetchStaffRegistrationById, fetchStaffActivationStatus } from '@/pages/onboarding/api'
import { GetStaffDetails, type StaffDetailsResponse } from '@/pages/agents/api'
import { parseApiErrorDetail } from '@/shared/lib/errors/parseApiError'
import {
  normalizeActivationSteps,
  type ActivationStepId,
  type ActivationStepsMap,
} from 'bibli/widgets/Profile/rr/lib/activationSteps'
import {
  getRegistrationSystemStatusForUser,
  type RegistrationSystemStatus,
} from 'bibli/widgets/Onboarding/lib/registrationSystemStatus'
import {
  buildStaffFullName,
  buildStaffInitials,
  resolveStaffLocationLabel,
} from '../lib/staffProfileFormat'
import { buildMergedStaffPassportView } from '../lib/staffProfilePassportMerge'

export interface StaffProfilePassportView {
  passport: string | null
  passport_issued: string | null
  passport_date: string | null
  passport_code: string | null
  birthday: string | null
  birthday_place: string | null
  registration_address: string | null
  inn: string | null
  snils: string | null
  bank_account: string | null
  bank_bik: string | null
  bank_name: string | null
  file_passport: string | null
  file_passport_registration: string | null
  file_agent_with_passport: string | null
  file_inn: string | null
  file_snils: string | null
  file_banking_details: string | null
  updated_at: string | null
  created_at: string | null
}

export interface StaffProfileStepRejection {
  reason: string
  comment: string | null
  count: number
}

export interface StaffProfileModel {
  id: number
  fullName: string
  initials: string
  phone: string | null
  email: string | null
  telegram_username: string | null
  locationLabel: string
  systemStatus: RegistrationSystemStatus
  onecSyncStatus: string | null
  activationSteps: ActivationStepsMap
  activationComplete: boolean
  onSigning: boolean
  activationRejections: Partial<Record<ActivationStepId, StaffProfileStepRejection>>
  passport: StaffProfilePassportView | null
  attached: StaffDetailsResponse['attached'] | null
  registration: Record<string, unknown> | null
  rawRegistration: Record<string, unknown> | null
  rawStaffDetails: StaffDetailsResponse | null
}

function buildPassportView(
  registrationData: Record<string, unknown> | null | undefined,
  staffDetails: StaffDetailsResponse | null,
): StaffProfilePassportView | null {
  return buildMergedStaffPassportView(registrationData, staffDetails?.passport ?? null)
}

function parseActivationRejections(source: unknown): Partial<Record<ActivationStepId, StaffProfileStepRejection>> {
  if (!source || typeof source !== 'object') return {}
  const result: Partial<Record<ActivationStepId, StaffProfileStepRejection>> = {}
  for (const [step, value] of Object.entries(source as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue
    const record = value as Record<string, unknown>
    if (typeof record.reason !== 'string' || !record.reason) continue
    result[step as ActivationStepId] = {
      reason: record.reason,
      comment: typeof record.comment === 'string' ? record.comment : null,
      count: Number(record.count) || 0,
    }
  }
  return result
}

function resolveOnecSyncStatus(source: unknown): string | null {
  if (!source || typeof source !== 'object') return null
  const status = (source as Record<string, unknown>).status
  if (typeof status !== 'string' || !status.trim()) return null
  return status.trim()
}

function mergeProfileModel(
  registration: Record<string, unknown> | null,
  staffDetails: StaffDetailsResponse | null,
): StaffProfileModel | null {
  if (!registration && !staffDetails?.data) return null

  const reg = registration ?? {}
  const staffData = staffDetails?.data
  const activation = (reg.activation as {
    steps?: Record<string, string>
    complete?: boolean
    on_signing?: boolean
    rejections?: unknown
  } | undefined) ?? {}

  const id = Number(reg.id ?? reg.user_id ?? staffData?.id)
  if (!Number.isFinite(id) || id <= 0) return null

  const userLike = {
    surname: (reg.surname as string | undefined) ?? staffData?.surname,
    name: (reg.name as string | undefined) ?? staffData?.name,
    patronymic: (reg.patronymic as string | undefined) ?? staffData?.patronymic,
  }

  return {
    id,
    fullName: buildStaffFullName(userLike),
    initials: buildStaffInitials(userLike),
    phone: (reg.phone as string | undefined) ?? staffData?.phone ?? null,
    email: (reg.email as string | undefined) ?? staffData?.email ?? null,
    telegram_username:
      (reg.telegram_username as string | undefined) ?? staffData?.telegram_username ?? null,
    locationLabel: resolveStaffLocationLabel({
      core_field_role:
        (staffData as { core_field_role?: string | null } | undefined)?.core_field_role ?? null,
      core_field_role_label:
        (staffData as { core_field_role_label?: string | null } | undefined)
          ?.core_field_role_label ?? null,
      attached: staffDetails?.attached ?? null,
      referal: (reg.referal as StaffProfileModel['rawRegistration']) ?? null,
    }),
    systemStatus: getRegistrationSystemStatusForUser({
      system_status: reg.system_status as RegistrationSystemStatus | undefined,
      activation,
    }),
    onecSyncStatus: resolveOnecSyncStatus(reg.onec_sync_status),
    activationSteps: normalizeActivationSteps(activation.steps),
    activationComplete: activation.complete === true,
    onSigning: activation.on_signing === true,
    activationRejections: parseActivationRejections(activation.rejections),
    passport: buildPassportView(reg, staffDetails),
    attached: staffDetails?.attached ?? null,
    registration: (reg.registration as Record<string, unknown> | null) ?? null,
    rawRegistration: reg,
    rawStaffDetails: staffDetails,
  }
}

export function useStaffProfile(userId: Ref<number | null>) {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const profile = ref<StaffProfileModel | null>(null)

  function resolveStaffProfileLoadError(reason: unknown): string {
    const status = (reason as { response?: { status?: number } })?.response?.status
    if (status === 401 || status === 403) {
      const detail = parseApiErrorDetail(reason, '')
      return detail
        ? `Нет доступа к карточке сотрудника. ${detail}`
        : 'Нет доступа к карточке сотрудника.'
    }
    return parseApiErrorDetail(reason, 'Ошибка загрузки профиля')
  }

  async function load(opts?: { soft?: boolean }) {
    const id = userId.value
    if (!id || id <= 0) {
      profile.value = null
      error.value = 'Некорректный идентификатор пользователя'
      return
    }

    const soft = opts?.soft === true && profile.value != null
    if (!soft) {
      loading.value = true
      error.value = null
    }

    try {
      const [registrationResult, staffResult] = await Promise.allSettled([
        fetchStaffRegistrationById(id),
        GetStaffDetails(id),
      ])

      const registration =
        registrationResult.status === 'fulfilled'
          ? (registrationResult.value as Record<string, unknown>)
          : null

      const staffDetails =
        staffResult.status === 'fulfilled' ? staffResult.value : null

      if (!registration && !staffDetails) {
        const primaryReason = staffResult.status === 'rejected'
          ? staffResult.reason
          : registrationResult.status === 'rejected'
            ? registrationResult.reason
            : null
        throw new Error(
          primaryReason
            ? resolveStaffProfileLoadError(primaryReason)
            : 'Не удалось загрузить профиль пользователя',
        )
      }

      profile.value = mergeProfileModel(registration, staffDetails)
      if (!profile.value) {
        throw new Error('Профиль пользователя не найден')
      }
      void refreshNotesCount()
    } catch (e) {
      if (!soft) {
        profile.value = null
        error.value = e instanceof Error ? e.message : 'Ошибка загрузки профиля'
      }
      /* soft: keep previous profile */
    } finally {
      if (!soft) loading.value = false
    }
  }

  async function applyActivationPayload(activation: Record<string, unknown> | null | undefined) {
    if (!profile.value || !activation) return false
    const rawSteps = (activation.steps as Partial<Record<string, string>> | undefined) ?? null
    if (!rawSteps) return false
    const steps = normalizeActivationSteps(rawSteps)
    profile.value = {
      ...profile.value,
      activationSteps: { ...steps },
      activationComplete: activation.complete === true,
      onSigning: activation.on_signing === true,
      systemStatus: getRegistrationSystemStatusForUser({
        system_status: activation.system_status as RegistrationSystemStatus | undefined,
        activation: {
          complete: activation.complete === true,
          on_signing: activation.on_signing === true,
          steps,
        },
      }),
      activationRejections: parseActivationRejections(activation.rejections),
    }
    return true
  }

  async function refreshActivationStatuses() {
    const id = userId.value
    if (!id || id <= 0 || !profile.value) return

    const activation = await fetchStaffActivationStatus(id)
    await applyActivationPayload(activation as Record<string, unknown>)
  }

  function getFileUrl(file: string | null | undefined): string {
    return getDocumentUrl(file)
  }

  const notesCount = ref(0)

  async function refreshNotesCount() {
    const id = userId.value
    if (!id || id <= 0) {
      notesCount.value = 0
      return
    }
    try {
      const { fetchStaffNotes } = await import('../api/notes')
      const notes = await fetchStaffNotes(id, 1)
      notesCount.value = notes.total
    } catch {
      /* keep previous */
    }
  }

  function setNotesCount(count: number) {
    notesCount.value = Math.max(0, Number(count) || 0)
  }

  return {
    loading,
    error,
    profile,
    notesCount,
    load,
    refreshActivationStatuses,
    applyActivationPayload,
    getFileUrl,
    refreshNotesCount,
    setNotesCount,
  }
}
