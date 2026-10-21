import { describe, expect, it } from 'vitest'
import { getStaffProfileActionErrorMessage } from './staffProfileActionError'

describe('getStaffProfileActionErrorMessage', () => {
  it('shows field errors instead of generic validation data', () => {
    const message = getStaffProfileActionErrorMessage({
      response: {
        status: 422,
        data: {
          data: 'Ошибка валидации данных',
          errors: {
            passport: ['Серия и номер паспорта должны содержать ровно 10 цифр'],
          },
        },
      },
    })

    expect(message).toContain('10 цифр')
    expect(message).not.toBe('Ошибка валидации данных')
  })
})
