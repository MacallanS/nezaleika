import type { UpdatePassportData } from '@/pages/agents/api'
import type { StaffProfilePassportView } from '../composables/useStaffProfile'

const PASSPORT_PAYLOAD_KEYS: (keyof UpdatePassportData)[] = [
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
]

/**
 * Partial passport PUT: only keys from `patch`.
 * Server mergeField keeps missing fields from UserData — do not re-send bank/inn/etc.
 */
export function buildUpdatePassportPayload(
  _passport: StaffProfilePassportView | null,
  patch: Partial<UpdatePassportData> = {},
): Partial<UpdatePassportData> {
  const result: Partial<UpdatePassportData> = {}

  for (const key of PASSPORT_PAYLOAD_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(patch, key)) continue
    result[key] = patch[key] ?? ''
  }

  return result
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}
