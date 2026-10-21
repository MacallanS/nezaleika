export type StaffPassportFieldSource = Record<string, unknown> | null | undefined

const PASSPORT_VIEW_KEYS = [
  'passport',
  'passport_issued',
  'passport_date',
  'passport_code',
  'birthday',
  'birthday_place',
  'registration_address',
  'inn',
  'snils',
  'bank_account',
  'bank_bik',
  'bank_name',
  'file_passport',
  'file_passport_registration',
  'file_agent_with_passport',
  'file_inn',
  'file_snils',
  'file_banking_details',
  'updated_at',
  'created_at',
] as const

const BANK_VIEW_KEYS = ['bank_account', 'bank_bik', 'bank_name'] as const

export type StaffPassportMergedView = {
  [K in (typeof PASSPORT_VIEW_KEYS)[number]]: string | null
}

function isEmptyPassportValue(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (typeof value === 'number') return false
  return String(value).trim() === ''
}

function asPassportString(value: unknown): string | null {
  if (isEmptyPassportValue(value)) return null
  return String(value)
}

function sourceHasAnyBankField(source: StaffPassportFieldSource): boolean {
  if (!source) return false
  return BANK_VIEW_KEYS.some((key) => !isEmptyPassportValue(source[key]))
}

/**
 * Пополевое слияние passport из staff details и registration.data.
 * Staff wins when non-empty; иначе берём registration (сканы/поля не теряются).
 * Банковские поля (РС/БИК/название) берутся одним блоком из одного источника,
 * чтобы не склеивать несовместимую пару БИК+РС.
 */
export function mergeStaffPassportSources(
  primary: StaffPassportFieldSource,
  fallback: StaffPassportFieldSource,
): StaffPassportMergedView | null {
  if (!primary && !fallback) return null

  const result = {} as StaffPassportMergedView
  const bankSource = sourceHasAnyBankField(primary) ? primary : fallback

  for (const key of PASSPORT_VIEW_KEYS) {
    if ((BANK_VIEW_KEYS as readonly string[]).includes(key)) {
      result[key] = asPassportString(bankSource?.[key])
      continue
    }

    const fromPrimary = primary?.[key]
    const fromFallback = fallback?.[key]
    result[key] = asPassportString(
      !isEmptyPassportValue(fromPrimary) ? fromPrimary : fromFallback,
    )
  }

  return result
}

export function buildMergedStaffPassportView(
  registrationPayload: Record<string, unknown> | null | undefined,
  staffPassport: StaffPassportFieldSource,
): StaffPassportMergedView | null {
  const regData =
    (registrationPayload?.data as Record<string, unknown> | undefined) ?? null

  return mergeStaffPassportSources(staffPassport, regData)
}
