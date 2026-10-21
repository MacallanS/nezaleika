import {
  birthdayFromApi,
  birthdayToApi,
  isBirthdayAgeAllowed,
  maskBirthdayInput,
  maskPassportCode,
  maskPassportNumber,
  repairSwappedPassportDates,
} from 'bibli/widgets/Profile/rr/lib/passportWizard'
import {
  isApiDateNotFuture,
} from 'bibli/widgets/Profile/rr/lib/personalWizard'
import { maskSnils } from 'bibli/widgets/Profile/rr/lib/snilsWizard'
import { maskInn } from 'bibli/widgets/Profile/rr/lib/innWizard'
import {
  bankAccountDigits,
  bankBikDigits,
} from 'bibli/widgets/Profile/rr/lib/bankWizard'
import type { PersonalOcrPatch } from './types'

/** Fields OCR may fill per document kind — never cross-apply. */
export const OCR_MAPPED_KEYS_BY_KIND: Record<string, readonly string[]> = {
  passport: [
    'surname',
    'name',
    'patronymic',
    'gender',
    'birthday',
    'birthdayPlace',
    'passport',
    'passportDate',
    'passportCode',
    'passportIssued',
  ],
  registration: ['registrationAddress', 'registrationDate', 'addressHasHandwritten'],
  snils: ['snils'],
  inn: ['inn'],
  bank: ['bankBik', 'bankAccount'],
}

export function pickMappedForKind(
  kind: string,
  mapped: Record<string, string> | null | undefined,
): Record<string, string> {
  const allow = OCR_MAPPED_KEYS_BY_KIND[String(kind || '').trim().toLowerCase()]
  if (!allow || !mapped) return {}
  const out: Record<string, string> = {}
  for (const key of allow) {
    const v = mapped[key]
    if (v == null) continue
    const text = String(v).trim()
    if (text) out[key] = text
  }
  return out
}

function str(mapped: Record<string, string>, key: string): string {
  const v = mapped[key]
  return v == null ? '' : String(v).trim()
}

function isEmptyField(form: Record<string, unknown>, key: string): boolean {
  return !String(form[key] ?? '').trim()
}

/** Fill only when the form field is still empty — user / server data wins over OCR. */
function setIfEmpty(form: Record<string, unknown>, key: string, value: string): boolean {
  if (!value || !isEmptyField(form, key)) return false
  form[key] = value
  return true
}

/**
 * OCR date → UI DD.MM.YYYY. Rejects incomplete / absurd years (e.g. 3984).
 * `kind`: birthday — age 14–90; issue — not future, year ≥ 1990; any — calendar + not future.
 */
export function normalizeBirthdayUi(
  raw: string,
  kind: 'birthday' | 'issue' | 'any' = 'any',
): string {
  if (!raw) return ''
  let ui = birthdayFromApi(raw)
  if (!ui) {
    const digits = String(raw).replace(/\D/g, '')
    if (digits.length === 8) {
      ui = maskBirthdayInput(digits)
    } else if (digits.length === 6) {
      const dd = digits.slice(0, 2)
      const mm = digits.slice(2, 4)
      const yy = Number(digits.slice(4, 6))
      if (!Number.isFinite(yy)) return ''
      const yyyy = yy <= 30 ? 2000 + yy : 1900 + yy
      ui = `${dd}.${mm}.${String(yyyy)}`
    } else {
      ui = maskBirthdayInput(raw)
    }
  }

  const api = birthdayToApi(ui)
  if (!api) return ''

  const year = Number(api.slice(0, 4))
  if (!Number.isFinite(year) || year < 1900 || year > 2100) return ''

  if (kind === 'birthday') {
    return isBirthdayAgeAllowed(ui) ? ui : ''
  }
  if (kind === 'issue') {
    if (!isApiDateNotFuture(api)) return ''
    if (year < 1990) return ''
    return ui
  }
  return isApiDateNotFuture(api) ? ui : ''
}

function normalizeGender(raw: string): 'm' | 'f' | undefined {
  const v = raw.trim().toLowerCase()
  if (v === 'm' || v === 'м' || v === 'male') return 'm'
  if (v === 'f' || v === 'ж' || v === 'female') return 'f'
  return undefined
}

export function personalPatchFromMapped(mapped: Record<string, string>): PersonalOcrPatch {
  const patch: PersonalOcrPatch = {}
  const surname = str(mapped, 'surname')
  const name = str(mapped, 'name')
  const patronymic = str(mapped, 'patronymic')
  const gender = normalizeGender(str(mapped, 'gender'))
  const birthday = normalizeBirthdayUi(str(mapped, 'birthday'), 'birthday')

  if (surname) patch.surname = surname
  if (name) patch.name = name
  if (patronymic) {
    patch.patronymic = patronymic
    patch.noPatronymic = false
  } else if (surname || name) {
    patch.noPatronymic = true
  }
  if (gender) patch.gender = gender
  if (birthday) patch.birthday = birthday
  return patch
}

export function hasPersonalOcrPatch(patch: PersonalOcrPatch): boolean {
  return Boolean(
    patch.surname ||
      patch.name ||
      patch.patronymic ||
      patch.birthday ||
      patch.gender ||
      patch.noPatronymic,
  )
}

/** Mutates passport wizard fields; personal FIO/gender returned separately. */
export function applyPassportMapped(
  form: Record<string, unknown>,
  mapped: Record<string, string>,
): PersonalOcrPatch {
  // Manual / API birthday always wins — OCR and date-swap repair must not clobber it.
  const hadBirthday = !isEmptyField(form, 'birthday')
  const lockedBirthday = hadBirthday ? String(form.birthday) : ''

  const passport = str(mapped, 'passport')
  const passportDate = normalizeBirthdayUi(str(mapped, 'passportDate'), 'issue')
  const passportCode = str(mapped, 'passportCode')
  const passportIssued = str(mapped, 'passportIssued')
  // Keep calendar date even if age looks wrong — OCR often swaps birth↔issue;
  // repairSwappedPassportDates needs both sides before we age-filter.
  const birthday = normalizeBirthdayUi(str(mapped, 'birthday'), 'any')
  const birthdayPlace = str(mapped, 'birthdayPlace')

  if (passport) setIfEmpty(form, 'passport', maskPassportNumber(passport))
  if (passportDate) setIfEmpty(form, 'passportDate', passportDate)
  if (passportCode) setIfEmpty(form, 'passportCode', maskPassportCode(passportCode))
  if (passportIssued && isEmptyField(form, 'passportIssued')) {
    form.passportIssued = passportIssued
    form.issuedManual = true
  }
  if (birthday) setIfEmpty(form, 'birthday', birthday)
  if (birthdayPlace) setIfEmpty(form, 'birthdayPlace', birthdayPlace)

  // OCR often swaps Birth_date ↔ Issue_date — fix before the form shows a false error.
  repairSwappedPassportDates(form)

  if (hadBirthday) {
    form.birthday = lockedBirthday
  } else {
    // Drop absurd OCR birthdays (e.g. year 2040) — field is hidden on passport step.
    const birthUi = String(form.birthday || '').trim()
    if (birthUi && !isBirthdayAgeAllowed(birthUi)) {
      form.birthday = ''
    }
  }

  const patch = personalPatchFromMapped({
    ...mapped,
    birthday: String(form.birthday || ''),
    passportDate: String(form.passportDate || mapped.passportDate || ''),
  })
  // If birthday was already set, seed draft with that value (not OCR) so a later
  // empty personal form does not pick up a wrong OCR date.
  if (hadBirthday) {
    if (lockedBirthday) patch.birthday = lockedBirthday
    else delete patch.birthday
  }
  return patch
}

export function applyRegistrationMapped(
  form: Record<string, unknown>,
  mapped: Record<string, string>,
): void {
  const address = str(mapped, 'registrationAddress') || str(mapped, 'address')
  if (address && isEmptyField(form, 'registrationAddress')) {
    form.registrationAddress = address
      .replace(/\[рукопись\]/gi, '')
      .replace(/\n+/g, ', ')
      .replace(/\s+,/g, ',')
      .replace(/,\s*,+/g, ', ')
      .replace(/^[\s,]+|[\s,]+$/g, '')
      .trim()
  }
  const regDate = normalizeBirthdayUi(str(mapped, 'registrationDate'), 'any')
  if (regDate && 'registrationDate' in form && isEmptyField(form, 'registrationDate')) {
    form.registrationDate = regDate
  }
}

export function applySnilsMapped(
  form: Record<string, unknown>,
  mapped: Record<string, string>,
): void {
  const snils = str(mapped, 'snils')
  if (snils) setIfEmpty(form, 'snils', maskSnils(snils))
}

export function applyInnMapped(
  form: Record<string, unknown>,
  mapped: Record<string, string>,
): void {
  // INN step only fills the tax id. Certificate dates (постановка на учёт)
  // must not overwrite birthday — backend then rejects with «возраст ≥ 14».
  const inn = str(mapped, 'inn')
  if (inn) setIfEmpty(form, 'inn', maskInn(inn))
}

export function applyBankMapped(
  form: Record<string, unknown>,
  mapped: Record<string, string>,
): void {
  // Bank step only needs BIK + account. Org INN / corr. account / recipient
  // are not profile fields and must not leak into the form.
  const bik = bankBikDigits(str(mapped, 'bankBik'))
  const account = bankAccountDigits(str(mapped, 'bankAccount'))
  if (bik) setIfEmpty(form, 'bankBik', bik)
  if (account) setIfEmpty(form, 'bankAccount', account)
}
