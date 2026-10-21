function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const GENERIC_AXIOS_MESSAGE = /^Request failed with status code \d+$/

function isGenericAxiosMessage(message: string): boolean {
  const trimmed = message.trim()
  return (
    !trimmed ||
    GENERIC_AXIOS_MESSAGE.test(trimmed) ||
    trimmed === 'Network Error' ||
    /timeout of \d+ms exceeded/i.test(trimmed)
  )
}

function flattenValidationErrors(errors: unknown): string {
  if (!errors || typeof errors !== 'object') return ''

  const messages = Object.values(errors as Record<string, unknown>)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => value.trim())

  return messages.join('; ')
}

/** Извлекает человекочитаемый текст из тела ответа API. */
export function extractApiPayloadMessage(payload: unknown): string {
  if (typeof payload === 'string' && payload.trim()) {
    return payload.trim()
  }

  if (Array.isArray(payload)) {
    const parts = payload
      .map((item) => extractApiPayloadMessage(item))
      .filter((item) => item.length > 0)
    return parts.join('; ')
  }

  if (!isRecord(payload)) return ''

  const validation = flattenValidationErrors(payload.errors)
  if (validation) return validation

  for (const key of ['message', 'error', 'detail'] as const) {
    const value = payload[key]
    if (typeof value === 'string' && value.trim() && !isGenericAxiosMessage(value)) {
      return value.trim()
    }
  }

  if (typeof payload.data === 'string' && payload.data.trim()) {
    return payload.data.trim()
  }

  if (isRecord(payload.data)) {
    const nested = extractApiPayloadMessage(payload.data)
    if (nested) return nested
  }

  return ''
}

/** Сообщения валидации из тела ответа API (поле `errors` или текст). */
export function parseApiValidationError(
  error: unknown,
  fallback = '',
): string {
  const axiosError = error as { response?: { data?: unknown } }
  const payload = axiosError?.response?.data ?? error

  if (isRecord(payload)) {
    const validation = flattenValidationErrors(payload.errors)
    if (validation) return validation
  }

  return extractApiPayloadMessage(payload) || fallback
}

/** Ответ API с `status: false` без axios-ошибки. */
export function parseApiSoftFailure(payload: unknown, fallback = ''): string {
  if (!isRecord(payload)) return fallback

  const status = payload.status
  if (status !== false && status !== 'false') return fallback

  return extractApiPayloadMessage(payload.data) || extractApiPayloadMessage(payload) || fallback
}

/** Первое понятное сообщение из axios-ошибки или Error. */
export function parseApiErrorDetail(error: unknown, fallback = ''): string {
  if (typeof error === 'string' && error.trim()) {
    return error.trim()
  }

  const softFailure = parseApiSoftFailure(error, '')
  if (softFailure) return softFailure

  const axiosError = error as {
    response?: { data?: unknown }
    data?: unknown
    message?: string
  }

  const candidates: unknown[] = []
  if (axiosError?.response?.data !== undefined) candidates.push(axiosError.response.data)
  if (axiosError?.data !== undefined) candidates.push(axiosError.data)

  for (const candidate of candidates) {
    const message = extractApiPayloadMessage(candidate)
    if (message) return message
  }

  const directMessage = extractApiPayloadMessage(error)
  if (directMessage) return directMessage

  const message = typeof axiosError?.message === 'string' ? axiosError.message.trim() : ''
  if (axiosError?.code === 'ECONNABORTED' || /timeout of \d+ms exceeded/i.test(message)) {
    return fallback
  }
  if (message && !isGenericAxiosMessage(message)) {
    return message
  }

  return fallback
}

export type ParseApiErrorOptions = {
  defaultMessage?: string
  includeStatusPrefix?: boolean
}

/** Расширенный парсер с HTTP-префиксом и сетевыми подсказками (Home.vue). */
export function parseApiError(
  error: unknown,
  options: ParseApiErrorOptions = {},
): string {
  const defaultMessage = options.defaultMessage ?? 'Произошла ошибка'

  if (typeof error === 'string' && error.trim()) {
    return error.trim()
  }

  const axiosError = error as {
    response?: { status?: number; data?: unknown }
    message?: string
    code?: string
  }

  const status =
    typeof axiosError?.response?.status === 'number' ? axiosError.response.status : null
  const statusPrefix =
    options.includeStatusPrefix !== false && status != null ? `HTTP ${status}. ` : ''

  const detail = parseApiErrorDetail(error, '')
  if (detail) {
    return `${statusPrefix}${detail}`.trim()
  }

  if (axiosError?.message && !axiosError?.response) {
    let hint = ''
    if (axiosError.code === 'ECONNABORTED') {
      hint =
        'Не удалось дождаться ответа от сервера. Проверьте интернет и попробуйте ещё раз. '
    } else if (
      axiosError.code === 'ERR_NETWORK' ||
      axiosError.message === 'Network Error'
    ) {
      hint =
        'Сеть: запрос не дошёл до сервера (интернет, CORS или сервер недоступен). '
    }
    const message = isGenericAxiosMessage(axiosError.message)
      ? defaultMessage
      : axiosError.message.trim()
    return `${hint}${statusPrefix}${message}`.trim()
  }

  if (status != null) {
    return `${statusPrefix}${defaultMessage}`.trim()
  }

  return defaultMessage
}

// --- Маппинг validation errors на поля формы (перенесено из dev-версии при сведении
// разошедшегося parseApiError: эти экспорты нужны agents/lib/staffValidation.ts и др.) ---

export type ApiErrorLike = {
  response?: { data?: unknown; status?: number }
  message?: string
  code?: string
  validationErrors?: Record<string, string[] | string>
}

function normalizeValidationErrors(
  raw: Record<string, string[] | string>,
): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  for (const key of Object.keys(raw)) {
    const val = raw[key]
    result[key] = Array.isArray(val) ? val : [String(val)]
  }
  return result
}

/** Извлекает объект validation errors из axios-ошибки (нормализованный к string[]). */
export function extractValidationErrors(
  error: unknown,
): Record<string, string[]> {
  const e = error as ApiErrorLike
  if (e?.validationErrors && typeof e.validationErrors === 'object') {
    return normalizeValidationErrors(e.validationErrors)
  }
  const data = e?.response?.data
  if (isRecord(data) && data.errors && typeof data.errors === 'object') {
    return normalizeValidationErrors(data.errors as Record<string, string[] | string>)
  }
  return {}
}

export type ValidationFieldMap = Record<
  string,
  { formField: string; label: string }
>

export type MappedValidationError = {
  fieldErrors: Record<string, string>
  messages: string[]
}

/**
 * Маппит validation errors с бэка на поля формы.
 * Спец-правило: `points_id.*` → `point_id`.
 */
export function mapValidationErrorsToFields(
  error: unknown,
  fieldMap: ValidationFieldMap,
): MappedValidationError {
  const validationErrors = extractValidationErrors(error)
  const fieldErrors: Record<string, string> = {}
  const messages: string[] = []

  for (const field of Object.keys(validationErrors)) {
    const errors = validationErrors[field]
    const errorText = errors[0] ?? ''

    if (field.startsWith('points_id.')) {
      fieldErrors.point_id = errorText
      messages.push(`Точки: ${errorText}`)
      continue
    }

    const mapping = fieldMap[field]
    if (mapping) {
      fieldErrors[mapping.formField] = errorText
      messages.push(`${mapping.label}: ${errorText}`)
    } else {
      fieldErrors[field] = errorText
      messages.push(`${field}: ${errorText}`)
    }
  }

  return { fieldErrors, messages }
}
