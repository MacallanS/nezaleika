export function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseIsoDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  out.setDate(out.getDate() + n)
  return out
}

export function startOfWeek(d: Date): Date {
  const shift = (d.getDay() + 6) % 7
  return addDays(d, -shift)
}

const dayMonth = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })
const weekdayLong = new Intl.DateTimeFormat('ru-RU', { weekday: 'long' })
const weekdayShort = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' })
const time = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })
const monthYear = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' })

export function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s
}

export function formatDayMonth(iso: string): string {
  return dayMonth.format(parseIsoDate(iso))
}

export function formatWeekday(iso: string): string {
  return capitalize(weekdayLong.format(parseIsoDate(iso)))
}

export function formatWeekdayShort(d: Date): string {
  return weekdayShort.format(d).replace('.', '')
}

export function formatTime(isoDateTime: string): string {
  return time.format(new Date(isoDateTime))
}

export function formatMonthYear(d: Date): string {
  return capitalize(monthYear.format(d).replace(' г.', ''))
}

export function relativeDayLabel(iso: string, todayIso: string): string {
  const diff = Math.round((parseIsoDate(iso).getTime() - parseIsoDate(todayIso).getTime()) / 86400000)
  if (diff === 0) return 'Сегодня'
  if (diff === 1) return 'Завтра'
  if (diff === -1) return 'Вчера'
  if (diff < 0) return `${formatDayMonth(iso)} · ${-diff} дн. назад`
  if (diff < 7) return formatWeekday(iso)
  return formatDayMonth(iso)
}

export function pluralDays(n: number): string {
  const a = Math.abs(n) % 100
  const b = a % 10
  if (a > 10 && a < 20) return `${n} дней`
  if (b === 1) return `${n} день`
  if (b >= 2 && b <= 4) return `${n} дня`
  return `${n} дней`
}
