import { isValidSnils } from 'bibli/shared/utils/russianTaxIds'

export const SNILS_WIZARD_TOTAL = 3
export const SNILS_WIZARD_BASE_PATH = '/profile/snils'

export function snilsWizardPath(step: number): string {
  return `${SNILS_WIZARD_BASE_PATH}/${step}`
}

export function parseSnilsWizardStep(raw: unknown): number {
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 1 || n > SNILS_WIZARD_TOTAL) return 1
  return n
}

export interface SnilsWizardForm {
  snils: string
  photoFile: File | null
  photoPreviewUrl: string | null
  photoServerPath: string | null
  dataConfirmed: boolean
  /** Existing passport fields kept for PUT compatibility */
  passport: string
  passportIssued: string
  passportDate: string
  passportCode: string
  birthday: string
  birthdayPlace: string
  registrationAddress: string
  inn: string
  bankAccount: string
  bankBik: string
  bankName: string
}

export function createEmptySnilsForm(): SnilsWizardForm {
  return {
    snils: '',
    photoFile: null,
    photoPreviewUrl: null,
    photoServerPath: null,
    dataConfirmed: false,
    passport: '',
    passportIssued: '',
    passportDate: '',
    passportCode: '',
    birthday: '',
    birthdayPlace: '',
    registrationAddress: '',
    inn: '',
    bankAccount: '',
    bankBik: '',
    bankName: '',
  }
}

export function snilsDigits(value: string): string {
  return String(value || '').replace(/\D/g, '').slice(0, 11)
}

/** Только цифры, без визуальной маски XXX-XXX-XXX YY. */
export function maskSnils(raw: string): string {
  return snilsDigits(raw)
}

export function isSnilsValid(form: SnilsWizardForm): boolean {
  return isValidSnils(form.snils)
}

export function isSnilsPhotoValid(form: SnilsWizardForm): boolean {
  return Boolean(form.photoServerPath || form.photoFile || form.photoPreviewUrl)
}

export function isSnilsReadyToSubmit(form: SnilsWizardForm): boolean {
  return isSnilsPhotoValid(form) && isSnilsValid(form) && form.dataConfirmed
}

export function getSnilsFieldError(value: string, touched = false): string {
  if (!touched) return ''
  const digits = snilsDigits(value)
  if (!digits) return 'Укажите СНИЛС'
  if (digits.length < 11) return 'СНИЛС должен содержать 11 цифр'
  if (!isValidSnils(digits)) return 'Некорректный СНИЛС'
  return ''
}
