import { describe, expect, it } from 'vitest'
import {
  formatValidationToast,
  mapValidationToDocSection,
  parseApiValidationError,
  sectionTitleForFieldErrors,
} from './parseApiValidationError'

describe('parseApiValidationError', () => {
  it('prefers Laravel errors over generic data message', () => {
    const parsed = parseApiValidationError({
      response: {
        status: 422,
        data: {
          status: false,
          data: 'Ошибка валидации данных',
          errors: {
            passport: ['Серия и номер паспорта должны содержать ровно 10 цифр'],
          },
        },
      },
    })

    expect(parsed.fieldErrors.passport).toContain('10 цифр')
    expect(parsed.summary).toContain('Серия и номер паспорта')
    expect(parsed.summary).not.toBe('Ошибка валидации данных')
  })

  it('joins several field errors', () => {
    const parsed = parseApiValidationError({
      response: {
        status: 422,
        data: {
          errors: {
            phone: ['Телефон должен содержать 11 цифр и начинаться с 7.'],
            surname: ['Укажите фамилию'],
          },
        },
      },
    })

    expect(Object.keys(parsed.fieldErrors)).toHaveLength(2)
    expect(parsed.detailLines.length).toBe(2)
    expect(parsed.summary).toContain('Телефон')
    expect(parsed.summary).toContain('Фамилия')
  })

  it('falls back when errors is empty and data is generic', () => {
    const parsed = parseApiValidationError(
      {
        response: {
          status: 422,
          data: { status: false, data: 'Ошибка валидации данных', errors: {} },
        },
      },
      'Не удалось сохранить',
    )

    expect(parsed.fieldErrors).toEqual({})
    expect(parsed.summary).toBe('Не удалось сохранить')
  })

  it('uses non-generic data string', () => {
    const parsed = parseApiValidationError({
      response: { status: 400, data: 'Пользователь не найден' },
    })
    expect(parsed.summary).toBe('Пользователь не найден')
  })

  it('handles 500 specially', () => {
    const parsed = parseApiValidationError({ response: { status: 500, data: {} } })
    expect(parsed.summary).toContain('500')
  })
})

describe('formatValidationToast', () => {
  it('prefixes section title', () => {
    expect(
      formatValidationToast({
        sectionTitle: 'Паспорт РФ',
        fieldErrors: { passport: 'Должен содержать 10 цифр' },
      }),
    ).toBe('Паспорт РФ: Серия и номер паспорта — Должен содержать 10 цифр')
  })
})

describe('mapValidationToDocSection', () => {
  it('maps known fields', () => {
    expect(mapValidationToDocSection('passport')).toBe('passport')
    expect(mapValidationToDocSection('inn')).toBe('inn')
    expect(mapValidationToDocSection('unknown_x')).toBe('other')
  })
})

describe('sectionTitleForFieldErrors', () => {
  it('returns section when all fields belong to one section', () => {
    expect(sectionTitleForFieldErrors({ passport: 'x', passport_date: 'y' })).toBe('Паспорт РФ')
  })

  it('returns undefined for mixed sections', () => {
    expect(sectionTitleForFieldErrors({ passport: 'x', inn: 'y' })).toBeUndefined()
  })
})
