/** Имя / фамилия / отчество: кириллица, пробел, дефис, апостроф */
const CYRILLIC_NAME_PATTERN = /^[А-Яа-яЁё]+(?:[ '-][А-Яа-яЁё]+)*$/

/** Разрешённые символы при вводе (без цифр и латиницы). */
const PERSON_NAME_INPUT_ALLOWED = /[^А-Яа-яЁё\s'\-]/g

export const CYRILLIC_NAME_ONLY_MESSAGE = 'Используйте только кириллицу'

/**
 * Убирает цифры и прочие недопустимые символы из поля ФИО.
 * @param {unknown} value
 * @returns {string}
 */
export function sanitizePersonNameInput(value) {
  return String(value ?? '').replace(PERSON_NAME_INPUT_ALLOWED, '')
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidCyrillicName(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return false
  return CYRILLIC_NAME_PATTERN.test(trimmed)
}

/**
 * @param {string} value
 * @param {{ required?: boolean, emptyMessage?: string }} [options]
 * @returns {string} текст ошибки под полем или ''
 */
export function validateCyrillicName(value, options = {}) {
  const { required = true, emptyMessage = '' } = options
  const trimmed = String(value ?? '').trim()

  if (!trimmed) {
    return required ? emptyMessage : ''
  }

  if (!CYRILLIC_NAME_PATTERN.test(trimmed)) {
    return CYRILLIC_NAME_ONLY_MESSAGE
  }

  return ''
}
