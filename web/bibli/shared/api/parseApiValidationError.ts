/** Русские подписи полей staff / документов для тостов и inline-ошибок. */
export const STAFF_FIELD_LABELS: Record<string, string> = {
  name: 'Имя',
  surname: 'Фамилия',
  patronymic: 'Отчество',
  phone: 'Телефон',
  telegram_username: 'Telegram',
  gender: 'Пол',
  birthday: 'Дата рождения',
  passport: 'Серия и номер паспорта',
  passport_issued: 'Кем выдан',
  passport_date: 'Дата выдачи',
  passport_code: 'Код подразделения',
  birthday_place: 'Место рождения',
  registration_address: 'Адрес регистрации',
  inn: 'ИНН',
  snils: 'СНИЛС',
  bank_account: 'Расчётный счёт',
  bank_bik: 'БИК',
  bank_name: 'Название банка',
  payment_account: 'Расчётный счёт',
  correspondent_account: 'Корреспондентский счёт',
  ogrnip: 'ОГРНИП',
  bank_inn: 'ИНН банка',
  role_id: 'Роль',
  point_ids: 'Точки',
  project_id: 'Проект',
  core_project_role: 'Роль проекта',
}

export type StaffDocSectionId =
  | 'personal'
  | 'passport'
  | 'inn'
  | 'snils'
  | 'bank'
  | 'agent-type'
  | 'other'

const FIELD_TO_SECTION: Record<string, StaffDocSectionId> = {
  name: 'personal',
  surname: 'personal',
  patronymic: 'personal',
  phone: 'personal',
  telegram_username: 'personal',
  gender: 'personal',
  birthday: 'personal',
  passport: 'passport',
  passport_issued: 'passport',
  passport_date: 'passport',
  passport_code: 'passport',
  birthday_place: 'passport',
  registration_address: 'passport',
  inn: 'inn',
  snils: 'snils',
  bank_account: 'bank',
  bank_bik: 'bank',
  bank_name: 'bank',
  payment_account: 'agent-type',
  correspondent_account: 'agent-type',
  ogrnip: 'agent-type',
  bank_inn: 'agent-type',
}

const SECTION_TITLES: Record<StaffDocSectionId, string> = {
  personal: 'Личные данные',
  passport: 'Паспорт РФ',
  inn: 'ИНН',
  snils: 'СНИЛС',
  bank: 'Банковские реквизиты',
  'agent-type': 'Тип занятости',
  other: 'Данные',
}

const GENERIC_VALIDATION_MESSAGES = new Set([
  'ошибка валидации данных',
  'ошибка валидации данных.',
  'validation failed',
  'the given data was invalid.',
])

export type ParsedApiValidationError = {
  summary: string
  detailLines: string[]
  fieldErrors: Record<string, string>
  status?: number
}

function firstString(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (Array.isArray(value)) {
    for (const item of value) {
      const s = firstString(item)
      if (s) return s
    }
  }
  return ''
}

function isGenericValidationMessage(text: string): boolean {
  return GENERIC_VALIDATION_MESSAGES.has(text.trim().toLowerCase())
}

function extractFieldErrors(errors: unknown): Record<string, string> {
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) return {}
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(errors as Record<string, unknown>)) {
    const message = firstString(value)
    if (message) result[key] = message
  }
  return result
}

export function mapValidationToDocSection(field: string): StaffDocSectionId {
  return FIELD_TO_SECTION[field] ?? 'other'
}

export function staffFieldLabel(field: string): string {
  return STAFF_FIELD_LABELS[field] ?? field
}

export function formatValidationToast(options: {
  sectionTitle?: string
  fieldErrors?: Record<string, string>
  detailLines?: string[]
  fallback?: string
}): string {
  const { sectionTitle, fieldErrors = {}, detailLines = [], fallback = '' } = options
  const fromFields = Object.entries(fieldErrors).map(([field, message]) => {
    const label = staffFieldLabel(field)
    return `${label} — ${message}`
  })
  const lines = fromFields.length > 0 ? fromFields : detailLines.filter(Boolean)
  if (lines.length === 0) {
    return sectionTitle ? `${sectionTitle}: ${fallback || 'Проверьте введённые данные'}` : fallback
  }
  const body = lines.join('; ')
  return sectionTitle ? `${sectionTitle}: ${body}` : body
}

/**
 * Разбор ответа API (Laravel 422 и похожие).
 * Приоритет: errors → message/detail → data (не-generic) → fallback.
 */
export function parseApiValidationError(
  error: unknown,
  fallback = 'Не удалось сохранить данные',
): ParsedApiValidationError {
  const err = error as {
    message?: string
    response?: { status?: number; data?: unknown }
  }
  const status = err?.response?.status
  const data = err?.response?.data

  if (typeof data === 'string' && data.trim()) {
    const text = data.trim()
    if (!isGenericValidationMessage(text)) {
      return { summary: text, detailLines: [text], fieldErrors: {}, status }
    }
  }

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>
    const fieldErrors = extractFieldErrors(record.errors)

    if (Object.keys(fieldErrors).length > 0) {
      const detailLines = Object.entries(fieldErrors).map(
        ([field, message]) => `${staffFieldLabel(field)} — ${message}`,
      )
      return {
        summary: formatValidationToast({ fieldErrors }),
        detailLines,
        fieldErrors,
        status,
      }
    }

    for (const key of ['message', 'detail'] as const) {
      const text = firstString(record[key])
      if (text && !isGenericValidationMessage(text)) {
        return { summary: text, detailLines: [text], fieldErrors: {}, status }
      }
    }

    if (record.data != null && typeof record.data !== 'object') {
      const text = String(record.data).trim()
      if (text && !isGenericValidationMessage(text)) {
        return { summary: text, detailLines: [text], fieldErrors: {}, status }
      }
    }
  }

  if (status === 500) {
    const text = 'Ошибка сервера (500). Попробуйте позже или обратитесь к администратору.'
    return { summary: text, detailLines: [text], fieldErrors: {}, status }
  }

  if (err?.message && !isGenericValidationMessage(err.message)) {
    const text = String(err.message)
    return { summary: text, detailLines: [text], fieldErrors: {}, status }
  }

  return { summary: fallback, detailLines: fallback ? [fallback] : [], fieldErrors: {}, status }
}

export function sectionTitleForFieldErrors(fieldErrors: Record<string, string>): string | undefined {
  const sections = new Set(
    Object.keys(fieldErrors).map((field) => mapValidationToDocSection(field)),
  )
  if (sections.size === 1) {
    const only = [...sections][0]
    return SECTION_TITLES[only]
  }
  return undefined
}
