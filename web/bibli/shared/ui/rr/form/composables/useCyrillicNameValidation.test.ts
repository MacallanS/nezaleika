import { describe, expect, it } from 'vitest'
import {
  CYRILLIC_NAME_ONLY_MESSAGE,
  isValidCyrillicName,
  sanitizePersonNameInput,
  validateCyrillicName,
} from './useCyrillicNameValidation.js'

describe('sanitizePersonNameInput', () => {
  it('strips digits and latin', () => {
    expect(sanitizePersonNameInput('Иван123')).toBe('Иван')
    expect(sanitizePersonNameInput('Ivan')).toBe('')
    expect(sanitizePersonNameInput("О'Нил-Петров")).toBe("О'Нил-Петров")
  })
})

describe('validateCyrillicName', () => {
  it('rejects numbers', () => {
    expect(validateCyrillicName('Иван2', { emptyMessage: 'Укажите имя' })).toBe(
      CYRILLIC_NAME_ONLY_MESSAGE,
    )
  })

  it('accepts cyrillic with hyphen/space', () => {
    expect(isValidCyrillicName('Анна-Мария')).toBe(true)
    expect(isValidCyrillicName('Иванов Иван')).toBe(true)
  })

  it('requires value when required', () => {
    expect(validateCyrillicName('', { emptyMessage: 'Укажите имя' })).toBe('Укажите имя')
    expect(validateCyrillicName('', { required: false })).toBe('')
  })
})
