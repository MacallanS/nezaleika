import { describe, expect, it } from 'vitest'
import {
  addCalendarDays,
  buildStaffCalendarDays,
  diffCalendarDays,
  formatStaffDateInput,
  parseStaffDateInput,
  pickStaffCalendarRange,
  staffCalendarWeekdays,
  startOfDay,
} from './staffProfileCalendar'

describe('staffProfileCalendar', () => {
  it('parses and formats dd.mm.yyyy', () => {
    const date = parseStaffDateInput('15.07.2026')
    expect(date).not.toBeNull()
    expect(formatStaffDateInput(date)).toBe('15.07.2026')
  })

  it('diffs calendar days', () => {
    const a = startOfDay(new Date(2026, 6, 1))
    const b = addCalendarDays(a, 15)
    expect(diffCalendarDays(a, b)).toBe(15)
  })

  it('uses Monday-first weekdays like DateRangePicker', () => {
    expect(staffCalendarWeekdays()[0]).toBe('Пн')
    expect(staffCalendarWeekdays()[6]).toBe('Вс')
  })

  it('builds range cells with start/end/in-range', () => {
    const from = startOfDay(new Date(2026, 8, 10))
    const to = startOfDay(new Date(2026, 8, 12))
    const cells = buildStaffCalendarDays({
      viewYear: 2026,
      viewMonth: 8,
      rangeFrom: from,
      rangeTo: to,
    })
    const d10 = cells.find((c) => c.day === 10 && !c.isOtherMonth)
    const d11 = cells.find((c) => c.day === 11 && !c.isOtherMonth)
    const d12 = cells.find((c) => c.day === 12 && !c.isOtherMonth)
    expect(d10?.isStart).toBe(true)
    expect(d11?.isInRange).toBe(true)
    expect(d12?.isEnd).toBe(true)
  })

  it('picks range in two clicks like DateRangePicker', () => {
    const a = startOfDay(new Date(2026, 8, 5))
    const b = startOfDay(new Date(2026, 8, 9))
    const first = pickStaffCalendarRange(a, { from: null, to: null })
    expect(first.from?.getTime()).toBe(a.getTime())
    expect(first.to).toBeNull()
    const second = pickStaffCalendarRange(b, first)
    expect(second.from?.getTime()).toBe(a.getTime())
    expect(second.to?.getTime()).toBe(b.getTime())
  })

  it('extends end when clicking after a complete range', () => {
    const from = startOfDay(new Date(2026, 8, 5))
    const to = startOfDay(new Date(2026, 8, 9))
    const later = startOfDay(new Date(2026, 8, 15))
    const next = pickStaffCalendarRange(later, { from, to })
    expect(next.from?.getTime()).toBe(from.getTime())
    expect(next.to?.getTime()).toBe(later.getTime())
  })
})
