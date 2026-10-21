import { describe, expect, it } from 'vitest'
import {
  applyBankMapped,
  applyInnMapped,
  applyPassportMapped,
  applySnilsMapped,
  normalizeBirthdayUi,
  pickMappedForKind,
} from './applyMappedFields'

describe('normalizeBirthdayUi', () => {
  it('parses compact issue date 26082024', () => {
    expect(normalizeBirthdayUi('26082024', 'issue')).toBe('26.08.2024')
  })

  it('rejects absurd birthday year 3984', () => {
    expect(normalizeBirthdayUi('03.09.3984', 'birthday')).toBe('')
    expect(normalizeBirthdayUi('3984-09-03', 'birthday')).toBe('')
  })

  it('accepts a plausible birthday', () => {
    expect(normalizeBirthdayUi('15.03.1990', 'birthday')).toBe('15.03.1990')
  })
})

describe('applyPassportMapped', () => {
  it('does not overwrite user-filled fields with OCR', () => {
    const form: Record<string, unknown> = {
      passport: '1234 567890',
      passportDate: '26.08.2024',
      passportCode: '',
      passportIssued: '',
      birthday: '15.03.1990',
      birthdayPlace: '',
      issuedManual: false,
    }
    applyPassportMapped(form, {
      passport: '9999 999999',
      passportDate: '01.01.2020',
      passportCode: '123-456',
      birthday: '03.09.3984',
      birthdayPlace: 'МОСКВА',
    })
    expect(form.passport).toBe('1234 567890')
    expect(form.passportDate).toBe('26.08.2024')
    expect(form.birthday).toBe('15.03.1990')
    expect(form.passportCode).toBe('123-456')
    expect(form.birthdayPlace).toBe('МОСКВА')
  })

  it('fills empty passportDate from compact OCR', () => {
    const form: Record<string, unknown> = {
      passport: '',
      passportDate: '',
      passportCode: '',
      passportIssued: '',
      birthday: '',
      birthdayPlace: '',
      issuedManual: false,
    }
    applyPassportMapped(form, { passportDate: '26082024' })
    expect(form.passportDate).toBe('26.08.2024')
  })

  it('swaps OCR birth/issue when they are inverted', () => {
    const form: Record<string, unknown> = {
      passport: '',
      passportDate: '',
      passportCode: '',
      passportIssued: '',
      birthday: '',
      birthdayPlace: '',
      issuedManual: false,
    }
    applyPassportMapped(form, {
      birthday: '26.08.2024',
      passportDate: '15.03.2004',
    })
    expect(form.birthday).toBe('15.03.2004')
    expect(form.passportDate).toBe('26.08.2024')
  })

  it('never changes a pre-filled birthday even if OCR dates look swapped', () => {
    const form: Record<string, unknown> = {
      passport: '',
      passportDate: '',
      passportCode: '',
      passportIssued: '',
      birthday: '14.08.2004',
      birthdayPlace: '',
      issuedManual: false,
    }
    applyPassportMapped(form, {
      birthday: '26.08.2024',
      passportDate: '14.08.2004',
    })
    expect(form.birthday).toBe('14.08.2004')
  })
})

describe('pickMappedForKind', () => {
  it('keeps only inn for inn kind', () => {
    expect(
      pickMappedForKind('inn', {
        inn: '772403683004',
        birthday: '01.01.2020',
        surname: 'ИВАНОВ',
      }),
    ).toEqual({ inn: '772403683004' })
  })

  it('keeps only snils for snils kind', () => {
    expect(
      pickMappedForKind('snils', {
        snils: '11223344595',
        birthday: '15.03.2004',
        name: 'ИВАН',
      }),
    ).toEqual({ snils: '11223344595' })
  })

  it('keeps only bank BIK/account for bank kind', () => {
    expect(
      pickMappedForKind('bank', {
        bankBik: '044525974',
        bankAccount: '40817810099910004312',
        bankInn: '7707083893',
        recipient: 'ИВАНОВ',
      }),
    ).toEqual({
      bankBik: '044525974',
      bankAccount: '40817810099910004312',
    })
  })
})

describe('applyInnMapped / applySnilsMapped', () => {
  it('inn apply ignores birthday', () => {
    const form: Record<string, unknown> = { inn: '', birthday: '' }
    applyInnMapped(form, { inn: '772403683004', birthday: '01.01.2020' })
    expect(form.inn).toBe('772403683004')
    expect(form.birthday).toBe('')
  })

  it('snils apply ignores personal fields', () => {
    const form: Record<string, unknown> = { snils: '', birthday: '', name: '' }
    applySnilsMapped(form, { snils: '112-233-445 95', birthday: '15.03.2004', name: 'ИВАН' })
    expect(String(form.snils).replace(/\D/g, '')).toBe('11223344595')
    expect(form.birthday).toBe('')
    expect(form.name).toBe('')
  })
})

describe('applyBankMapped', () => {
  it('fills BIK and account but never bankName from OCR', () => {
    const form: Record<string, unknown> = {
      bankBik: '',
      bankAccount: '',
      bankName: '',
    }
    applyBankMapped(form, {
      bankBik: '044525677',
      bankAccount: '40817810820001428615',
      bankName: 'АO кЯндекс Банкъ Корр счёт',
    })
    expect(form.bankBik).toBe('044525677')
    expect(form.bankAccount).toBe('40817810820001428615')
    expect(form.bankName).toBe('')
  })

  it('does not overwrite a name the agent already typed', () => {
    const form: Record<string, unknown> = {
      bankBik: '',
      bankAccount: '',
      bankName: 'АО «Яндекс Банк»',
    }
    applyBankMapped(form, {
      bankBik: '044525677',
      bankName: 'garbage',
    })
    expect(form.bankName).toBe('АО «Яндекс Банк»')
    expect(form.bankBik).toBe('044525677')
  })
})
