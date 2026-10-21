import {
  AGENT_TYPE_IE,
  AGENT_TYPE_SELF_EMPLOYED,
} from 'bibli/widgets/Profile/rr/lib/agentTypeWizard'
import type { StaffProfileModel } from '../composables/useStaffProfile'

export interface StaffAgentTypeDocRow {
  field: string
  label: string
  value: string
}

export interface StaffAgentTypeDocImage {
  url: string
  label: string
  key: string
}

function pickRecord(...sources: unknown[]): Record<string, unknown> | null {
  for (const source of sources) {
    if (source && typeof source === 'object') {
      return source as Record<string, unknown>
    }
  }
  return null
}

function textValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  const trimmed = String(value).trim()
  return trimmed || '—'
}

export function resolveStaffAccountType(profile: StaffProfileModel): number | null {
  const reg = profile.rawRegistration
  const staffData = profile.rawStaffDetails?.data
  const raw = reg?.account_type ?? staffData?.account_type
  const parsed = Number(raw)
  if (Number.isFinite(parsed) && parsed > 0) return parsed

  if (pickRecord(profile.rawStaffDetails?.self_employed, reg?.self_employed, reg?.SelfEmployed)) {
    return AGENT_TYPE_SELF_EMPLOYED
  }
  if (
    pickRecord(
      profile.rawStaffDetails?.individual_enterepreneur,
      reg?.individual_enterepreneur,
      reg?.IndividualEnterepreneur,
    )
  ) {
    return AGENT_TYPE_IE
  }

  return null
}

const IE_FIELD_ROWS: Array<{ field: string; label: string }> = [
  { field: 'name', label: 'ФИО ИП' },
  { field: 'inn', label: 'ИНН ИП' },
  { field: 'ogrnip', label: 'ОГРНИП' },
  { field: 'payment_account', label: 'Расчётный счёт' },
  { field: 'bank', label: 'Банк' },
  { field: 'bank_bik', label: 'БИК банка' },
  { field: 'bank_inn', label: 'ИНН банка' },
  { field: 'correspondent_account', label: 'Корреспондентский счёт' },
]

export function buildStaffAgentTypePanel(
  profile: StaffProfileModel,
  getFileUrl: (file: string | null | undefined) => string,
): {
  rows: StaffAgentTypeDocRow[]
  images: StaffAgentTypeDocImage[]
  columns: 1 | 2
} {
  const accountType = resolveStaffAccountType(profile)
  const rows: StaffAgentTypeDocRow[] = []
  const images: StaffAgentTypeDocImage[] = []

  if (accountType === AGENT_TYPE_SELF_EMPLOYED) {
    const se = pickRecord(
      profile.rawStaffDetails?.self_employed,
      profile.rawRegistration?.self_employed,
      profile.rawRegistration?.SelfEmployed,
    )

    const registrationFile = se?.file_self_employed
    images.push({
      key: 'file_self_employed',
      label: 'Справка о постановке на учёт',
      url:
        typeof registrationFile === 'string' && registrationFile.trim()
          ? getFileUrl(registrationFile)
          : '',
    })

    const incomeFile = se?.file_income_statement
    images.push({
      key: 'file_income_statement',
      label: 'Справка о доходах',
      url:
        typeof incomeFile === 'string' && incomeFile.trim()
          ? getFileUrl(incomeFile)
          : '',
    })

    return { rows, images, columns: 1 }
  }

  if (accountType === AGENT_TYPE_IE) {
    const ie = pickRecord(
      profile.rawStaffDetails?.individual_enterepreneur,
      profile.rawRegistration?.individual_enterepreneur,
      profile.rawRegistration?.IndividualEnterepreneur,
    )

    const ogrnipFile = ie?.file_ogrnip
    images.push({
      key: 'file_ogrnip',
      label: 'Лист записи ЕГРИП',
      url:
        typeof ogrnipFile === 'string' && ogrnipFile.trim()
          ? getFileUrl(ogrnipFile)
          : '',
    })

    for (const { field, label } of IE_FIELD_ROWS) {
      rows.push({
        field,
        label,
        value: textValue(ie?.[field]),
      })
    }

    return { rows, images, columns: 2 }
  }

  return { rows, images, columns: 1 }
}
