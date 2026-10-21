import { isValidBik, validateKs, validateRs } from 'bibli/shared/utils/russianBankAccount'
import { isValidInn10, isValidInn12, isValidOgrnip } from 'bibli/shared/utils/russianTaxIds'
import {
  isValidCyrillicName,
  validateCyrillicName,
} from 'bibli/shared/ui/rr/form/composables/useCyrillicNameValidation.js'

/** account_type ids from user_types / UserTypesEnum */
export const AGENT_TYPE_SELF_EMPLOYED = 2
export const AGENT_TYPE_IE = 3

export const AGENT_TYPE_BASE = '/profile/agent-type'
export const SE_WIZARD_TOTAL = 3
export const IE_WIZARD_TOTAL = 3

export function agentTypeChoicePath(): string {
  return AGENT_TYPE_BASE
}

export function seWizardPath(step: number): string {
  return `${AGENT_TYPE_BASE}/self-employed/${step}`
}

export function ieWizardPath(step: number): string {
  return `${AGENT_TYPE_BASE}/ie/${step}`
}

export function parseWizardStep(raw: unknown, total: number): number {
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 1 || n > total) return 1
  return n
}

export type AgentKind = 'self-employed' | 'ie'

export interface SeWizardForm {
  registrationFile: File | null
  registrationPreviewUrl: string | null
  registrationServerPath: string | null
  registrationIsPdf: boolean
  incomeFile: File | null
  incomePreviewUrl: string | null
  incomeServerPath: string | null
  incomeIsPdf: boolean
  dataConfirmed: boolean
}

export function createEmptySeForm(): SeWizardForm {
  return {
    registrationFile: null,
    registrationPreviewUrl: null,
    registrationServerPath: null,
    registrationIsPdf: false,
    incomeFile: null,
    incomePreviewUrl: null,
    incomeServerPath: null,
    incomeIsPdf: false,
    dataConfirmed: false,
  }
}

export function isSeRegistrationValid(form: SeWizardForm): boolean {
  return Boolean(form.registrationFile || form.registrationServerPath || form.registrationPreviewUrl)
}

export function isSeIncomeValid(form: SeWizardForm): boolean {
  return Boolean(form.incomeFile || form.incomeServerPath || form.incomePreviewUrl)
}

export function isSeReadyToSubmit(form: SeWizardForm): boolean {
  return isSeRegistrationValid(form) && isSeIncomeValid(form) && form.dataConfirmed
}

export interface IeWizardForm {
  ogrnipFile: File | null
  ogrnipPreviewUrl: string | null
  ogrnipServerPath: string | null
  ogrnipIsPdf: boolean
  name: string
  inn: string
  ogrnip: string
  paymentAccount: string
  bank: string
  bankBik: string
  bankInn: string
  correspondentAccount: string
  dataConfirmed: boolean
}

export function createEmptyIeForm(): IeWizardForm {
  return {
    ogrnipFile: null,
    ogrnipPreviewUrl: null,
    ogrnipServerPath: null,
    ogrnipIsPdf: false,
    name: '',
    inn: '',
    ogrnip: '',
    paymentAccount: '',
    bank: '',
    bankBik: '',
    bankInn: '',
    correspondentAccount: '',
    dataConfirmed: false,
  }
}

export function digitsOnly(value: string, max: number): string {
  return String(value || '').replace(/\D/g, '').slice(0, max)
}

export function isIeOgrnipFileValid(form: IeWizardForm): boolean {
  return Boolean(form.ogrnipFile || form.ogrnipServerPath || form.ogrnipPreviewUrl)
}

export function isIeFormValid(form: IeWizardForm): boolean {
  const bik = digitsOnly(form.bankBik, 9)
  return (
    isValidCyrillicName(form.name) &&
    isValidInn12(form.inn) &&
    isValidOgrnip(form.ogrnip) &&
    isValidBik(bik) &&
    validateRs(form.paymentAccount, bik) &&
    form.bank.trim().length > 0 &&
    isValidInn10(form.bankInn) &&
    validateKs(form.correspondentAccount, bik)
  )
}

export function getIeNameFieldError(value: string, touched = false): string {
  if (!touched) return ''
  return validateCyrillicName(value, { emptyMessage: 'Укажите ФИО ИП' })
}

export function isIeReadyToSubmit(form: IeWizardForm): boolean {
  return isIeOgrnipFileValid(form) && isIeFormValid(form) && form.dataConfirmed
}

/** Ошибка поля ИНН ИП (пусто = без ошибки). */
export function getIeInnFieldError(inn: string, touched = false): string {
  const digits = digitsOnly(inn, 12)
  if (!digits) return touched ? 'Укажите ИНН ИП' : ''
  if (digits.length < 12) return touched ? 'ИНН ИП должен содержать 12 цифр' : ''
  if (!isValidInn12(digits)) return 'Некорректный ИНН ИП'
  return ''
}

/** Ошибка поля ОГРНИП (пусто = без ошибки). */
export function getIeOgrnipFieldError(ogrnip: string, touched = false): string {
  const digits = digitsOnly(ogrnip, 15)
  if (!digits) return touched ? 'Укажите ОГРНИП' : ''
  if (digits.length < 15) return touched ? 'ОГРНИП должен содержать 15 цифр' : ''
  if (!isValidOgrnip(digits)) return 'Некорректный ОГРНИП'
  return ''
}

/** Ошибка поля БИК (пусто = без ошибки). */
export function getIeBikFieldError(
  bik: string,
  paymentAccount: string,
  correspondentAccount: string,
  touched = false,
): string {
  const digits = digitsOnly(bik, 9)
  if (!digits) return touched ? 'Укажите БИК банка' : ''
  if (digits.length < 9) return touched ? 'БИК банка должен содержать 9 цифр' : ''
  if (!isValidBik(digits)) return 'Укажите корректный БИК банка'
  const rs = digitsOnly(paymentAccount, 20)
  if (rs.length === 20 && !validateRs(rs, digits)) {
    return 'Такой БИК не может существовать с этим расчётным счётом'
  }
  const ks = digitsOnly(correspondentAccount, 20)
  if (ks.length === 20 && !validateKs(ks, digits)) {
    return 'Такой БИК не может существовать с этим корреспондентским счётом'
  }
  return ''
}

/** Ошибка поля расчётного счёта (пусто = без ошибки). */
export function getIePaymentAccountFieldError(
  account: string,
  bik: string,
  touched = false,
): string {
  const acc = digitsOnly(account, 20)
  if (!acc) return touched ? 'Укажите расчётный счёт' : ''
  if (acc.length < 20) return touched ? 'Расчётный счёт должен содержать 20 цифр' : ''
  const digits = digitsOnly(bik, 9)
  if (!isValidBik(digits)) return 'Укажите корректный БИК банка'
  if (!validateRs(acc, digits)) {
    return 'Такой расчётный счёт не может существовать с этим БИК'
  }
  return ''
}

/** Ошибка поля ИНН банка (пусто = без ошибки). */
export function getIeBankInnFieldError(inn: string, touched = false): string {
  const digits = digitsOnly(inn, 10)
  if (!digits) return touched ? 'Укажите ИНН банка' : ''
  if (digits.length < 10) return touched ? 'ИНН банка должен содержать 10 цифр' : ''
  if (!isValidInn10(digits)) return 'Некорректный ИНН банка'
  return ''
}

/** Ошибка поля корреспондентского счёта (пусто = без ошибки). */
export function getIeCorrespondentAccountFieldError(
  account: string,
  bik: string,
  touched = false,
): string {
  const acc = digitsOnly(account, 20)
  if (!acc) return touched ? 'Укажите корреспондентский счёт' : ''
  if (acc.length < 20) return touched ? 'Корреспондентский счёт должен содержать 20 цифр' : ''
  const digits = digitsOnly(bik, 9)
  if (!isValidBik(digits)) return 'Укажите корректный БИК банка'
  if (!validateKs(acc, digits)) {
    return 'Такой корреспондентский счёт не может существовать с этим БИК'
  }
  return ''
}

export function getIeBankNameFieldError(value: string, touched = false): string {
  if (!touched) return ''
  return value.trim() ? '' : 'Укажите название банка'
}
