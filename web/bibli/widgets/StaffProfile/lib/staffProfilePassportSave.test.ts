import { describe, expect, it } from 'vitest'
import { buildUpdatePassportPayload } from './staffProfilePassportSave'
import type { StaffProfilePassportView } from '../composables/useStaffProfile'

const passport: StaffProfilePassportView = {
  passport: '1234567890',
  passport_issued: 'УФМС',
  passport_date: '2020-01-01',
  passport_code: '123456',
  birthday: '1990-01-01',
  birthday_place: 'Москва',
  registration_address: 'ул. Пример',
  inn: '1234567890',
  snils: null,
  bank_account: '40817810000000000001',
  bank_bik: '044525225',
  bank_name: 'Сбербанк',
  file_passport: null,
  file_passport_registration: null,
  file_agent_with_passport: null,
  file_inn: null,
  file_snils: null,
  file_banking_details: null,
  updated_at: null,
  created_at: null,
}

describe('buildUpdatePassportPayload', () => {
  it('sends only patch keys when updating inn', () => {
    const payload = buildUpdatePassportPayload(passport, { inn: '9876543210' })

    expect(payload).toEqual({ inn: '9876543210' })
    expect(payload).not.toHaveProperty('bank_account')
    expect(payload).not.toHaveProperty('bank_bik')
    expect(payload).not.toHaveProperty('passport')
  })

  it('includes empty patch values so the key is present in the body', () => {
    const payload = buildUpdatePassportPayload(passport, { bank_bik: '' })

    expect(payload).toEqual({ bank_bik: '' })
  })

  it('sends only birthday for personal-data style patch', () => {
    const payload = buildUpdatePassportPayload(passport, { birthday: '1980-06-19' })

    expect(payload).toEqual({ birthday: '1980-06-19' })
  })

  it('sends only snils for snils-style patch', () => {
    const payload = buildUpdatePassportPayload(passport, { snils: '12345678901' })

    expect(payload).toEqual({ snils: '12345678901' })
  })
})
