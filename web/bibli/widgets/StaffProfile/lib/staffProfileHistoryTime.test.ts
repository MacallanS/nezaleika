import { describe, expect, it } from 'vitest'
import { formatStaffHistoryTimeLabel } from './staffProfileHistoryTime'

describe('formatStaffHistoryTimeLabel', () => {
  const now = new Date('2026-08-25T16:40:00+03:00')

  it('rounds hours for today without fractions', () => {
    expect(
      formatStaffHistoryTimeLabel('2026-08-25T14:08:40+03:00', now),
    ).toBe('3 ч назад')
  })

  it('rounds minutes under one hour', () => {
    expect(
      formatStaffHistoryTimeLabel('2026-08-25T16:25:00+03:00', now),
    ).toBe('15 мин назад')
  })

  it('uses yesterday with time for ~1 day', () => {
    expect(
      formatStaffHistoryTimeLabel('2026-08-24T15:29:28+03:00', now),
    ).toBe('вчера, 15:29')
  })

  it('uses days for recent week', () => {
    expect(
      formatStaffHistoryTimeLabel('2026-08-22T15:29:28+03:00', now),
    ).toBe('3 дн назад')
  })

  it('formats older same-year date', () => {
    expect(
      formatStaffHistoryTimeLabel('2026-08-01T15:29:28+03:00', now),
    ).toBe('01.08')
  })

  it('never returns fractional hour strings', () => {
    const label = formatStaffHistoryTimeLabel('2026-08-25T14:08:40+03:00', now)
    expect(label).not.toMatch(/[.,]\d/)
  })
})
