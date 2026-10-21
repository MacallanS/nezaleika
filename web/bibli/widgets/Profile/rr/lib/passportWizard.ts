import {
  BIRTHDAY_MIN_AGE,
  ageOnApiDate,
  birthdayFromApi,
  birthdayToApi,
  isApiDateNotFuture,
  isBirthdayAgeAllowed,
  maskBirthdayInput,
} from './personalWizard'

export const PASSPORT_WIZARD_TOTAL = 4
export const PASSPORT_WIZARD_BASE_PATH = '/profile/passport'

export function passportWizardPath(step: number): string {
  return `${PASSPORT_WIZARD_BASE_PATH}/${step}`
}

export function parsePassportWizardStep(raw: unknown): number {
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 1 || n > PASSPORT_WIZARD_TOTAL) return 1
  return n
}

export interface PassportWizardForm {
  passport: string
  passportDate: string
  passportCode: string
  passportIssued: string
  issuedManual: boolean
  birthday: string
  birthdayPlace: string
  registrationAddress: string
  /** OCR stamp date — stored for future use, not shown in the wizard yet */
  registrationDate: string
  sameAsResidence: boolean
  residenceAddress: string
  mainPhotoFile: File | null
  mainPhotoPreviewUrl: string | null
  mainPhotoServerPath: string | null
  regPhotoFile: File | null
  regPhotoPreviewUrl: string | null
  regPhotoServerPath: string | null
  /** Existing inn/bank kept for PUT compatibility when present */
  inn: string
  bankAccount: string
  bankBik: string
  bankName: string
  /** Галочка «Данные верны» на шаге ревью — ключ к статусу «На проверке» */
  dataConfirmed: boolean
}

export function createEmptyPassportForm(): PassportWizardForm {
  return {
    passport: '',
    passportDate: '',
    passportCode: '',
    passportIssued: '',
    issuedManual: false,
    birthday: '',
    birthdayPlace: '',
    registrationAddress: '',
    registrationDate: '',
    sameAsResidence: true,
    residenceAddress: '',
    mainPhotoFile: null,
    mainPhotoPreviewUrl: null,
    mainPhotoServerPath: null,
    regPhotoFile: null,
    regPhotoPreviewUrl: null,
    regPhotoServerPath: null,
    inn: '',
    bankAccount: '',
    bankBik: '',
    bankName: '',
    dataConfirmed: false,
  }
}

/** #### ###### */
export function maskPassportNumber(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 4) return digits
  return `${digits.slice(0, 4)} ${digits.slice(4)}`
}

export function passportDigits(value: string): string {
  return String(value || '').replace(/\D/g, '').slice(0, 10)
}

/** ###-### */
export function maskPassportCode(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '').slice(0, 6)
  if (digits.length <= 3) return digits
  return `${digits.slice(0, 3)}-${digits.slice(3)}`
}

export function passportCodeDigits(value: string): string {
  return String(value || '').replace(/\D/g, '').slice(0, 6)
}

/** Имя из справочника ФМС, без учёта регистра и крайних пробелов. */
export function findFmsIssuedName(names: string[], value: string): string | null {
  const needle = String(value || '').trim().toLowerCase()
  if (!needle) return null
  return names.find((name) => String(name || '').trim().toLowerCase() === needle) ?? null
}

export { birthdayFromApi, birthdayToApi, isBirthdayAgeAllowed, maskBirthdayInput }

/**
 * OCR sometimes swaps Birth_date / Issue_date. If issue < birth but swapping
 * yields a plausible birth (14–90) and issue date, fix the fields in place.
 */
export function repairSwappedPassportDates(
  form: { birthday?: unknown; passportDate?: unknown },
  now = new Date(),
): boolean {
  const birthRaw = String(form.birthday ?? '').trim()
  const issueRaw = String(form.passportDate ?? '').trim()
  if (!birthRaw || !issueRaw) return false

  const birthUi = birthdayFromApi(birthRaw) || birthRaw
  const issueUi = birthdayFromApi(issueRaw) || issueRaw
  const birthApi = birthdayToApi(birthUi)
  const issueApi = birthdayToApi(issueUi)
  if (!birthApi || !issueApi) return false
  if (issueApi >= birthApi) return false

  // Candidate swap: current "issue" is actually birth, current "birth" is issue.
  if (!isBirthdayAgeAllowed(issueUi, now)) return false
  const issueYear = Number(birthApi.slice(0, 4))
  if (!isApiDateNotFuture(birthApi, now) || issueYear < 1990) return false
  const ageAtIssue = ageOnApiDate(issueApi, birthApi)
  if (ageAtIssue === null || ageAtIssue < BIRTHDAY_MIN_AGE) return false

  form.birthday = issueUi
  form.passportDate = birthUi
  return true
}

/** Дата выдачи: формат, не будущее, ≥ даты рождения и не раньше 14 лет. */
export function isPassportIssueDateAllowed(
  passportDateUi: string,
  birthdayUi = '',
  now = new Date(),
): boolean {
  const issueApi = birthdayToApi(birthdayFromApi(passportDateUi) || passportDateUi)
  if (!issueApi || !isApiDateNotFuture(issueApi, now)) return false

  const birthRaw = (birthdayFromApi(birthdayUi) || birthdayUi).trim()
  if (!birthRaw || !isBirthdayAgeAllowed(birthRaw, now)) return true

  const birthApi = birthdayToApi(birthRaw)
  if (!birthApi) return true

  if (issueApi < birthApi) return false
  const ageAtIssue = ageOnApiDate(birthApi, issueApi)
  if (ageAtIssue === null) return false
  return ageAtIssue >= BIRTHDAY_MIN_AGE
}

export function isPassportFormValid(form: PassportWizardForm): boolean {
  if (passportDigits(form.passport).length !== 10) return false
  if (!isPassportIssueDateAllowed(form.passportDate, form.birthday)) return false
  if (passportCodeDigits(form.passportCode).length !== 6) return false
  if (!form.passportIssued.trim()) return false
  if (!form.birthdayPlace.trim()) return false
  if (!form.registrationAddress.trim()) return false
  if (!form.sameAsResidence && !form.residenceAddress.trim()) return false
  return true
}

export function isPassportReadyToSubmit(form: PassportWizardForm): boolean {
  return (
    isPassportFormValid(form) &&
    isBirthdayAgeAllowed(form.birthday) &&
    form.dataConfirmed
  )
}

export function isMainPhotoValid(form: PassportWizardForm): boolean {
  return Boolean(form.mainPhotoServerPath || form.mainPhotoFile || form.mainPhotoPreviewUrl)
}

export function isRegPhotoValid(form: PassportWizardForm): boolean {
  return Boolean(form.regPhotoServerPath || form.regPhotoFile || form.regPhotoPreviewUrl)
}

export function formatPassportDateForApi(value: string): string | null {
  return birthdayToApi(value)
}

export function getPassportNumberFieldError(value: string, touched = false): string {
  const digits = passportDigits(value)
  if (!digits) return touched ? 'Укажите серию и номер паспорта' : ''
  if (digits.length < 10) return 'Серия и номер должны содержать 10 цифр'
  return ''
}

export function getPassportDateFieldError(
  value: string,
  touched = false,
  birthdayUi = '',
): string {
  const raw = (birthdayFromApi(value) || value).trim()
  if (!raw) return touched ? 'Укажите дату выдачи' : ''
  const issueApi = birthdayToApi(raw)
  if (!issueApi) return 'Укажите дату в формате ДД.ММ.ГГГГ'
  if (!isApiDateNotFuture(issueApi)) return 'Дата выдачи не может быть в будущем'

  const birthRaw = (birthdayFromApi(birthdayUi) || birthdayUi).trim()
  // Ignore OCR garbage birthday (hidden on this step) — it caused false
  // "issue before birth" when year was misread as 2024/2040/etc.
  if (birthRaw && isBirthdayAgeAllowed(birthRaw)) {
    const birthApi = birthdayToApi(birthRaw)
    if (birthApi) {
      if (issueApi < birthApi) {
        return 'Дата выдачи не может быть раньше даты рождения'
      }
      const ageAtIssue = ageOnApiDate(birthApi, issueApi)
      if (ageAtIssue === null) return 'Укажите дату в формате ДД.ММ.ГГГГ'
      if (ageAtIssue < BIRTHDAY_MIN_AGE) {
        return `Паспорт выдают с ${BIRTHDAY_MIN_AGE} лет — дата выдачи слишком ранняя`
      }
    }
  }

  return ''
}

export function getPassportCodeFieldError(value: string, touched = false): string {
  const digits = passportCodeDigits(value)
  if (!digits) return touched ? 'Укажите код подразделения' : ''
  if (digits.length < 6) return 'Код подразделения должен содержать 6 цифр'
  return ''
}

export function getPassportIssuedFieldError(value: string, touched = false): string {
  if (value.trim()) return ''
  return touched ? 'Укажите, кем выдан паспорт' : ''
}

export function getPassportBirthdayPlaceFieldError(value: string, touched = false): string {
  if (value.trim()) return ''
  return touched ? 'Укажите место рождения' : ''
}

export function getPassportRegistrationFieldError(value: string, touched = false): string {
  if (value.trim()) return ''
  return touched ? 'Укажите адрес регистрации' : ''
}

export function getPassportResidenceFieldError(
  value: string,
  sameAsResidence: boolean,
  touched = false,
): string {
  if (sameAsResidence || value.trim()) return ''
  return touched ? 'Укажите адрес фактического проживания' : ''
}
