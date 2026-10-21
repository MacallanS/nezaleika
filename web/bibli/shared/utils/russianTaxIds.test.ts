import { describe, expect, it } from 'vitest'
import { isValidInn10, isValidInn12, isValidSnils } from './russianTaxIds'

describe('isValidInn12', () => {
  it('accepts a known valid 12-digit INN', () => {
    expect(isValidInn12('053202450095')).toBe(true)
  })

  it('rejects wrong checksum', () => {
    expect(isValidInn12('053202450096')).toBe(false)
  })

  it('rejects short values', () => {
    expect(isValidInn12('05320245009')).toBe(false)
  })
})

describe('isValidInn10', () => {
  it('accepts a known valid 10-digit INN', () => {
    expect(isValidInn10('7707083893')).toBe(true)
  })

  it('rejects wrong checksum', () => {
    expect(isValidInn10('7707083894')).toBe(false)
  })
})

describe('isValidSnils', () => {
  it('accepts valid SNILS with checksum', () => {
    expect(isValidSnils('11223344595')).toBe(true)
    expect(isValidSnils('112-233-445 95')).toBe(true)
  })

  it('rejects wrong checksum', () => {
    expect(isValidSnils('11223344596')).toBe(false)
  })

  it('accepts legacy numbers without checksum (≤ 001001998)', () => {
    expect(isValidSnils('00100199800')).toBe(true)
  })

  it('rejects short values', () => {
    expect(isValidSnils('1122334459')).toBe(false)
  })
})
