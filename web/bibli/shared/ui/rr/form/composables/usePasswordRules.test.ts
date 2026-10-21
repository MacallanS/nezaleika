import { describe, expect, it } from 'vitest'
import {
  getPasswordRulesList,
  getPasswordRulesState,
  isPasswordRulesValid,
  PASSWORD_SPECIAL_CHARS,
} from './usePasswordRules.js'

describe('usePasswordRules', () => {
  it('exposes allowed special chars for RussAuth', () => {
    expect(PASSWORD_SPECIAL_CHARS).toBe('!@#$%&')
  })

  it('marks rules independently', () => {
    expect(getPasswordRulesState('Ab1!xxxx')).toEqual({
      minLength: true,
      upperLower: true,
      hasDigit: true,
      hasSpecial: true,
    })
    expect(getPasswordRulesState('ab1!xxxx')).toMatchObject({
      upperLower: false,
      hasDigit: true,
      hasSpecial: true,
    })
    expect(getPasswordRulesState('AB1!XXXX')).toMatchObject({ upperLower: false })
    expect(getPasswordRulesState('Abcdefgh!')).toMatchObject({ hasDigit: false })
    expect(getPasswordRulesState('Abcdefgh1')).toMatchObject({ hasSpecial: false })
    expect(getPasswordRulesState('Abc1*xxxx')).toMatchObject({ hasSpecial: false })
  })

  it('isPasswordRulesValid matches all rules met', () => {
    expect(isPasswordRulesValid('Valid1!a')).toBe(true)
    expect(isPasswordRulesValid('invalid')).toBe(false)
    const list = getPasswordRulesList('Valid1!a')
    expect(list.every((r) => r.met)).toBe(true)
  })
})
