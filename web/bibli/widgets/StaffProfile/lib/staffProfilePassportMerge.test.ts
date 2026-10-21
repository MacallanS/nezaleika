import { describe, expect, it } from 'vitest'
import {
  buildMergedStaffPassportView,
  mergeStaffPassportSources,
} from './staffProfilePassportMerge'

describe('mergeStaffPassportSources', () => {
  it('returns null when both sources empty', () => {
    expect(mergeStaffPassportSources(null, null)).toBeNull()
  })

  it('keeps registration file when staff passport omits it', () => {
    const merged = mergeStaffPassportSources(
      {
        bank_account: '40817810300106898943',
        bank_bik: '044525974',
        bank_name: 'Т-банк',
        file_banking_details: null,
      },
      {
        bank_account: 'old',
        file_banking_details: 'doc-bank-1',
        snils: '12345678900',
      },
    )

    expect(merged?.bank_account).toBe('40817810300106898943')
    expect(merged?.bank_bik).toBe('044525974')
    expect(merged?.bank_name).toBe('Т-банк')
    expect(merged?.file_banking_details).toBe('doc-bank-1')
    expect(merged?.snils).toBe('12345678900')
  })

  it('prefers non-empty staff values over registration', () => {
    const merged = mergeStaffPassportSources(
      { inn: '7707083893', file_inn: 'staff-inn' },
      { inn: '123456789012', file_inn: 'reg-inn' },
    )

    expect(merged?.inn).toBe('7707083893')
    expect(merged?.file_inn).toBe('staff-inn')
  })

  it('takes bank fields as one block from primary when any bank field is set', () => {
    const merged = mergeStaffPassportSources(
      { bank_bik: '044525974' },
      {
        bank_account: '40817810300106898943',
        bank_bik: '044525225',
        bank_name: 'Сбербанк',
      },
    )

    expect(merged?.bank_bik).toBe('044525974')
    expect(merged?.bank_account).toBeNull()
    expect(merged?.bank_name).toBeNull()
  })

  it('falls back to registration bank block when staff has no bank fields', () => {
    const merged = mergeStaffPassportSources(
      { inn: '7707083893' },
      {
        bank_account: '40817810300106898943',
        bank_bik: '044525974',
        bank_name: 'Т-банк',
      },
    )

    expect(merged?.bank_account).toBe('40817810300106898943')
    expect(merged?.bank_bik).toBe('044525974')
    expect(merged?.bank_name).toBe('Т-банк')
  })
})

describe('buildMergedStaffPassportView', () => {
  it('reads registration.data and merges with staff passport', () => {
    const view = buildMergedStaffPassportView(
      {
        data: {
          file_passport: 'reg-pass',
          passport: '1234567890',
        },
      },
      {
        passport: '9988776655',
        file_passport: '',
      },
    )

    expect(view?.passport).toBe('9988776655')
    expect(view?.file_passport).toBe('reg-pass')
  })
})
