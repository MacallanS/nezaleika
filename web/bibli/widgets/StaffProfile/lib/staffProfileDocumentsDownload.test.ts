import { describe, expect, it } from 'vitest'
import {
  compactFioForDocumentFileName,
  listStaffProfileAllDocumentFiles,
} from './staffProfileDocumentsDownload'

describe('compactFioForDocumentFileName', () => {
  it('builds surname + initials for full FIO', () => {
    expect(compactFioForDocumentFileName('Мелихова Ева Борисовна')).toBe('МелиховаЕБ')
  })

  it('keeps surname only when no given name', () => {
    expect(compactFioForDocumentFileName('Мелихова')).toBe('Мелихова')
  })

  it('falls back for empty name', () => {
    expect(compactFioForDocumentFileName('')).toBe('user')
    expect(compactFioForDocumentFileName('—')).toBe('user')
  })
})

describe('listStaffProfileAllDocumentFiles', () => {
  it('includes passport and agent-type (оформление) files in one pack', () => {
    const files = listStaffProfileAllDocumentFiles({
      passport: {
        file_passport: 'passport.jpg',
        file_inn: 'inn.pdf',
        file_passport_registration: null,
        file_agent_with_passport: null,
        file_snils: null,
        file_banking_details: null,
      } as never,
      rawRegistration: {
        self_employed: {
          file_self_employed: 'se.pdf',
          file_income_statement: 'income.pdf',
        },
      },
      rawStaffDetails: null,
    })

    expect(files.map((f) => f.key)).toEqual([
      'file_passport',
      'file_inn',
      'file_self_employed',
      'file_income_statement',
    ])
  })

  it('picks IE file from staff details', () => {
    const files = listStaffProfileAllDocumentFiles({
      passport: null,
      rawRegistration: null,
      rawStaffDetails: {
        individual_enterepreneur: { file_ogrnip: 'ogrnip.pdf' },
      } as never,
    })

    expect(files).toEqual([
      { key: 'file_ogrnip', label: 'Лист записи ЕГРИП', path: 'ogrnip.pdf' },
    ])
  })
})
