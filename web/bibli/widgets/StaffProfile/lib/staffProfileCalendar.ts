/** Мини-календарь (RangePicker) для модалки «Продлить/Выдать доступ».
 * Логика выбора диапазона как у DateRangePicker.
 */

export interface StaffCalendarDayCell {
  key: string
  date: Date
  day: number
  isOtherMonth: boolean
  isToday: boolean
  isStart: boolean
  isEnd: boolean
  isInRange: boolean
  isDisabled: boolean
}

/** Как в DateRangePicker: неделя с понедельника. */
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const

const MONTHS_RU = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
]

export function staffCalendarWeekdays(): readonly string[] {
  return WEEKDAYS
}

export function staffCalendarMonthLabel(year: number, monthIndex: number): string {
  return `${MONTHS_RU[monthIndex] || ''}, ${year}`
}

export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addCalendarDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return startOfDay(d)
}

export function diffCalendarDays(from: Date, to: Date): number {
  const a = startOfDay(from).getTime()
  const b = startOfDay(to).getTime()
  return Math.round((b - a) / 86_400_000)
}

export function formatStaffDateInput(date: Date | null | undefined): string {
  if (!date || Number.isNaN(date.getTime())) return ''
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${dd}.${mm}.${yyyy}`
}

export function parseStaffDateInput(value: string): Date | null {
  const m = value.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (!m) return null
  const day = Number(m[1])
  const month = Number(m[2]) - 1
  const year = Number(m[3])
  const date = new Date(year, month, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null
  }
  return startOfDay(date)
}

export function clampStaffCalendarDate(
  date: Date,
  minDate?: Date | null,
  maxDate?: Date | null,
): Date {
  let next = startOfDay(date)
  if (minDate) {
    const min = startOfDay(minDate)
    if (next.getTime() < min.getTime()) next = min
  }
  if (maxDate) {
    const max = startOfDay(maxDate)
    if (next.getTime() > max.getTime()) next = max
  }
  return next
}

/**
 * Выбор границ диапазона — копия логики DateRangePicker.selectDate.
 */
export function pickStaffCalendarRange(
  clicked: Date,
  current: { from: Date | null; to: Date | null },
  bounds?: { minDate?: Date | null; maxDate?: Date | null },
): { from: Date | null; to: Date | null } {
  const date = clampStaffCalendarDate(clicked, bounds?.minDate, bounds?.maxDate)
  const dateTime = date.getTime()

  let newFrom = current.from ? startOfDay(current.from) : null
  let newTo = current.to ? startOfDay(current.to) : null

  if (newFrom && newTo) {
    const fromTime = newFrom.getTime()
    const toTime = newTo.getTime()

    if (dateTime === fromTime) {
      newFrom = null
    } else if (dateTime === toTime) {
      newTo = null
    } else if (dateTime > fromTime && dateTime < toTime) {
      const sameMonthAsFrom =
        date.getMonth() === newFrom.getMonth() && date.getFullYear() === newFrom.getFullYear()
      const sameMonthAsTo =
        date.getMonth() === newTo.getMonth() && date.getFullYear() === newTo.getFullYear()

      if (sameMonthAsFrom && !sameMonthAsTo) {
        newTo = date
      } else if (!sameMonthAsFrom && !sameMonthAsTo) {
        newFrom = date
        newTo = null
      } else {
        const distToFrom = Math.abs(dateTime - fromTime)
        const distToTo = Math.abs(dateTime - toTime)
        if (distToFrom < distToTo) newFrom = date
        else newTo = date
      }
    } else if (dateTime < fromTime) {
      newFrom = date
    } else if (dateTime > toTime) {
      newTo = date
    }
  } else if (newFrom && !newTo) {
    const fromTime = newFrom.getTime()
    if (dateTime === fromTime) {
      newFrom = null
    } else if (dateTime < fromTime) {
      newTo = newFrom
      newFrom = date
    } else {
      newTo = date
    }
  } else if (!newFrom && newTo) {
    const toTime = newTo.getTime()
    if (dateTime === toTime) {
      newTo = null
    } else if (dateTime > toTime) {
      newFrom = newTo
      newTo = date
    } else {
      newFrom = date
    }
  } else {
    newFrom = date
    newTo = null
  }

  if (newFrom && newTo && newFrom.getTime() > newTo.getTime()) {
    const temp = newFrom
    newFrom = newTo
    newTo = temp
  }

  return { from: newFrom, to: newTo }
}

export function buildStaffCalendarDays(options: {
  viewYear: number
  viewMonth: number
  rangeFrom: Date | null
  rangeTo: Date | null
  minDate?: Date | null
  maxDate?: Date | null
}): StaffCalendarDayCell[] {
  const { viewYear, viewMonth, rangeFrom, rangeTo, minDate, maxDate } = options
  const first = new Date(viewYear, viewMonth, 1)
  // Как DateRangePicker: сетка с понедельника
  const startPad = first.getDay() === 0 ? 6 : first.getDay() - 1
  const gridStart = addCalendarDays(first, -startPad)
  const today = startOfDay(new Date())
  const from = rangeFrom ? startOfDay(rangeFrom) : null
  const to = rangeTo ? startOfDay(rangeTo) : null
  const min = minDate ? startOfDay(minDate) : null
  const max = maxDate ? startOfDay(maxDate) : null

  const cells: StaffCalendarDayCell[] = []
  for (let i = 0; i < 42; i += 1) {
    const date = addCalendarDays(gridStart, i)
    const dayStart = startOfDay(date)
    const t = dayStart.getTime()
    const disabled =
      (min != null && t < min.getTime()) || (max != null && t > max.getTime())

    let isStart = false
    let isEnd = false
    let isInRange = false
    if (from && to) {
      isStart = t === from.getTime()
      isEnd = t === to.getTime()
      isInRange = t > from.getTime() && t < to.getTime()
    } else if (from) {
      isStart = t === from.getTime()
    } else if (to) {
      isEnd = t === to.getTime()
    }

    cells.push({
      key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${i}`,
      date: dayStart,
      day: date.getDate(),
      isOtherMonth: date.getMonth() !== viewMonth,
      isToday: t === today.getTime(),
      isStart,
      isEnd,
      isInRange,
      isDisabled: disabled,
    })
  }
  return cells
}
