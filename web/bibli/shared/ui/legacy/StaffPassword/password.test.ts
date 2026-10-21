import { describe, expect, it } from 'vitest'
import {
  canSubmitStaffPasswordForm,
  setUserPasswordErrorMessage,
  validateStaffPassword,
  validateStaffPasswordForm,
} from './password'
import { isPasswordRulesValid } from 'bibli/shared/ui/rr/composables/usePasswordRules.js'

describe('validateStaffPassword', () => {
  it('rejects empty and short passwords', () => {
    expect(validateStaffPassword('')).toMatch(/Введите|минимум 8/i)
    expect(validateStaffPassword('Ab1!')).toMatch(/минимум 8/)
    expect(validateStaffPassword('abcdefg1!')).toMatch(/заглавн|строчн/i)
  })

  it('requires latin upper+lower, digit and allowed special', () => {
    expect(validateStaffPassword('abcdefgh')).toBeTruthy()
    expect(validateStaffPassword('ABCDEFGH')).toBeTruthy()
    expect(validateStaffPassword('Abcdefgh')).toMatch(/цифр/i)
    expect(validateStaffPassword('Abcdefg1')).toMatch(/спецсимвол/i)
    expect(validateStaffPassword('Abcdefg1*')).toMatch(/спецсимвол/i)
    expect(validateStaffPassword('Abcdefg1!')).toBeNull()
    expect(validateStaffPassword('Abcdefg1@')).toBeNull()
    expect(validateStaffPassword('Abcdefg1#')).toBeNull()
    expect(validateStaffPassword('Abcdefg1$')).toBeNull()
    expect(validateStaffPassword('Abcdefg1%')).toBeNull()
    expect(validateStaffPassword('Abcdefg1&')).toBeNull()
  })

  it('matches shared RR isPasswordRulesValid', () => {
    const samples = [
      '',
      'short',
      'alllowercase1!',
      'ALLUPPERCASE1!',
      'NoDigits!!',
      'NoSpecial1Aa',
      'ValidPass1!',
      'Good#Pass2',
    ]
    for (const sample of samples) {
      const err = validateStaffPassword(sample)
      expect(err === null).toBe(isPasswordRulesValid(sample))
    }
  })
})

describe('validateStaffPasswordForm', () => {
  it('reports password and confirm errors together', () => {
    expect(validateStaffPasswordForm('', '')).toEqual({
      passwordError: 'Введите новый пароль',
      confirmError: 'Повторите новый пароль',
    })
    expect(validateStaffPasswordForm('ValidPass1!', 'other')).toEqual({
      passwordError: '',
      confirmError: 'Пароли не совпадают',
    })
    expect(validateStaffPasswordForm('ValidPass1!', 'ValidPass1!')).toEqual({
      passwordError: '',
      confirmError: '',
    })
  })
})

describe('canSubmitStaffPasswordForm', () => {
  it('requires valid password and matching confirmation', () => {
    expect(canSubmitStaffPasswordForm('ValidPass1!', '')).toBe(false)
    expect(canSubmitStaffPasswordForm('ValidPass1!', 'ValidPass1')).toBe(false)
    expect(canSubmitStaffPasswordForm('weak', 'weak')).toBe(false)
    expect(canSubmitStaffPasswordForm('ValidPass1!', 'ValidPass1!')).toBe(true)
  })
})

describe('setUserPasswordErrorMessage', () => {
  it('maps api statuses', () => {
    expect(
      setUserPasswordErrorMessage({ response: { status: 400, data: { data: 'x' } } }),
    ).toBe('x')
    expect(setUserPasswordErrorMessage({ response: { status: 401 } })).toMatch(/API/)
    expect(
      setUserPasswordErrorMessage({ response: { status: 403, data: { data: 'deny' } } }),
    ).toBe('deny')
    expect(setUserPasswordErrorMessage({ response: { status: 422 } })).toMatch(/отклонён/)
    expect(setUserPasswordErrorMessage({ message: 'network' })).toBe('network')
    expect(setUserPasswordErrorMessage({})).toMatch(/смене пароля/)
  })
})
