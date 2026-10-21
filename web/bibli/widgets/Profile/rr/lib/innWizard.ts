import { isValidInn12 } from 'bibli/shared/utils/russianTaxIds'

export const INN_WIZARD_TOTAL = 3
export const INN_WIZARD_BASE_PATH = '/profile/inn'

export function innWizardPath(step: number): string {
  return `${INN_WIZARD_BASE_PATH}/${step}`
}

export function parseInnWizardStep(raw: unknown): number {
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 1 || n > INN_WIZARD_TOTAL) return 1
  return n
}

export interface InnWizardForm {
  inn: string
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
  bankAccount: string
  bankBik: string
  bankName: string
}

export function createEmptyInnForm(): InnWizardForm {
  return {
    inn: '',
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
    bankAccount: '',
    bankBik: '',
    bankName: '',
  }
}

export function innDigits(value: string): string {
  return String(value || '').replace(/\D/g, '').slice(0, 12)
}

/** Только цифры, без визуальной маски. */
export function maskInn(raw: string): string {
  return innDigits(raw)
}

export function isInnValid(form: InnWizardForm): boolean {
  return isValidInn12(form.inn)
}

export function isInnPhotoValid(form: InnWizardForm): boolean {
  return Boolean(form.photoServerPath || form.photoFile || form.photoPreviewUrl)
}

export function isInnReadyToSubmit(form: InnWizardForm): boolean {
  return isInnPhotoValid(form) && isInnValid(form) && form.dataConfirmed
}

export function getInnFieldError(value: string, touched = false): string {
  if (!touched) return ''
  const digits = innDigits(value)
  if (!digits) return 'Укажите ИНН'
  if (digits.length < 12) return 'ИНН должен содержать 12 цифр'
  if (!isValidInn12(digits)) return 'Некорректный ИНН'
  return ''
}
