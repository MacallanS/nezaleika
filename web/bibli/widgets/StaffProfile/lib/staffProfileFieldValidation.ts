import {
  sanitizePersonNameInput,
  validateCyrillicName,
} from 'bibli/shared/ui/rr/form/composables/useCyrillicNameValidation.js'
import {
  getPassportCodeFieldError,
  getPassportDateFieldError,
  getPassportIssuedFieldError,
  getPassportNumberFieldError,
  getPassportBirthdayPlaceFieldError,
  getPassportRegistrationFieldError,
  maskPassportCode,
  maskPassportNumber,
  passportCodeDigits,
  passportDigits,
} from 'bibli/widgets/Profile/rr/lib/passportWizard'
import { birthdayFromApi, birthdayToApi, maskBirthdayInput } from 'bibli/widgets/Profile/rr/lib/personalWizard'
import {
  getBankAccountValidationError,
  getCorrespondentAccountValidationError,
  isValidBik,
} from 'bibli/shared/utils/russianBankAccount'
import { isValidInn10, isValidInn12, taxDigitsOnly } from 'bibli/shared/utils/russianTaxIds'
import {
  getIeBikFieldError,
  getIeInnFieldError,
  getIeOgrnipFieldError,
  getIeBankInnFieldError,
} from 'bibli/widgets/Profile/rr/lib/agentTypeWizard'

export {
  maskPassportCode,
  maskPassportNumber,
  maskBirthdayInput,
  birthdayFromApi,
  birthdayToApi,
  passportDigits,
  passportCodeDigits,
}

export type StaffDocFieldValidationCtx = {
  birthday?: string
  bankBik?: string
  bankAccount?: string
  paymentAccount?: string
  correspondentAccount?: string
  /** ИП: поле `name` — ФИО ИП, не личное имя */
  ieMode?: boolean
}

export function validateStaffDocField(
  field: string,
  value: string,
  ctx: StaffDocFieldValidationCtx = {},
): string {
  const raw = value.trim() === '—' ? '' : value.trim()

  switch (field) {
    case 'passport':
      return getPassportNumberFieldError(raw, true)
    case 'passport_date':
      return getPassportDateFieldError(raw, true, birthdayFromApi(ctx.birthday || ''))
    case 'passport_code':
      return getPassportCodeFieldError(raw, true)
    case 'passport_issued':
      return getPassportIssuedFieldError(raw, true)
    case 'birthday_place':
      return getPassportBirthdayPlaceFieldError(raw, true)
    case 'registration_address':
      return getPassportRegistrationFieldError(raw, true)
    case 'birthday':
      return getBirthdayError(raw)
    case 'inn': {
      if (ctx.ieMode) return getIeInnFieldError(raw, true)
      const digits = taxDigitsOnly(raw)
      if (!digits) return 'Укажите ИНН'
      if (digits.length !== 10 && digits.length !== 12) return 'ИНН должен содержать 10 или 12 цифр'
      if (digits.length === 10 && !isValidInn10(digits)) return 'Некорректный ИНН'
      if (digits.length === 12 && !isValidInn12(digits)) return 'Некорректный ИНН'
      return ''
    }
    case 'ogrnip':
      return getIeOgrnipFieldError(raw, true)
    case 'bank_bik': {
      if (ctx.ieMode || ctx.paymentAccount != null || ctx.correspondentAccount != null) {
        return getIeBikFieldError(
          raw,
          ctx.paymentAccount || '',
          ctx.correspondentAccount || '',
          true,
        )
      }
      if (!raw) return 'Укажите БИК банка'
      if (!isValidBik(raw)) return 'БИК банка должен содержать ровно 9 цифр'
      if (ctx.bankAccount && ctx.bankAccount.replace(/\D/g, '').length === 20) {
        return getBankAccountValidationError(ctx.bankAccount, raw) ?? ''
      }
      return ''
    }
    case 'bank_account':
      return getBankAccountValidationError(raw, ctx.bankBik) ?? ''
    case 'payment_account':
      return getBankAccountValidationError(raw, ctx.bankBik) ?? ''
    case 'correspondent_account':
      return getCorrespondentAccountValidationError(raw, ctx.bankBik) ?? ''
    case 'bank_inn':
      return getIeBankInnFieldError(raw, true)
    case 'bank_name':
    case 'bank':
      return raw ? '' : 'Укажите название банка'
    case 'surname':
      return validateCyrillicName(raw, { emptyMessage: 'Укажите фамилию' })
    case 'name':
      return validateCyrillicName(raw, {
        emptyMessage: ctx.ieMode ? 'Укажите ФИО ИП' : 'Укажите имя',
      })
    case 'patronymic':
      return validateCyrillicName(raw, { required: false })
    case 'phone': {
      const digits = raw.replace(/\D/g, '')
      if (!digits) return 'Укажите телефон'
      if (digits.length < 10) return 'Телефон должен содержать 10 цифр номера'
      return ''
    }
    case 'email':
      if (!raw) return ''
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) ? '' : 'Некорректный email'
    case 'telegram_username':
      if (!raw) return ''
      return /^@?[a-zA-Z0-9_]{5,32}$/.test(raw) ? '' : 'Некорректный ник Telegram'
    default:
      return ''
  }
}

function getBirthdayError(raw: string): string {
  if (!raw) return 'Укажите дату рождения'
  const api = birthdayToApi(raw) || (/^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0, 10) : null)
  if (!api) return 'Укажите дату в формате ДД.ММ.ГГГГ'
  return ''
}

export function toApiDate(value: string): string {
  const trimmed = value.trim()
  if (!trimmed || trimmed === '—') return ''
  return birthdayToApi(trimmed) || trimmed
}

export function applyStaffFieldMask(field: string, value: string): string {
  switch (field) {
    case 'passport':
      return maskPassportNumber(value)
    case 'passport_code':
      return maskPassportCode(value)
    case 'passport_date':
    case 'birthday':
      return maskBirthdayInput(value)
    case 'inn':
      return taxDigitsOnly(value).slice(0, 12)
    case 'bank_bik':
      return String(value || '').replace(/\D/g, '').slice(0, 9)
    case 'bank_account':
    case 'payment_account':
    case 'correspondent_account':
      return String(value || '').replace(/\D/g, '').slice(0, 20)
    case 'bank_inn':
      return taxDigitsOnly(value).slice(0, 10)
    case 'ogrnip':
      return String(value || '').replace(/\D/g, '').slice(0, 15)
    case 'surname':
    case 'name':
    case 'patronymic':
      return sanitizePersonNameInput(value)
    default:
      return value
  }
}
