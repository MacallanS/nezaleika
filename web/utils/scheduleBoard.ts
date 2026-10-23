import type { CalendarDay } from '~/stores/plants'
import { addDays, formatDayMonth, formatWeekday, isoDate, parseIsoDate } from '~/utils/dates'

export interface BoardRow {
  key: string
  plantId: number
  done: boolean
  wateringId?: number
  doneBy: string
  wateredAt: string
  tone: 'overdue' | 'today' | 'normal'
  dueLabel: string
  snoozable: boolean
  past: boolean
  /** False for future planned days — view only until due. */
  checkable: boolean
}

export interface BoardGroup {
  iso: string
  title: string
  aside: string
  rows: BoardRow[]
}

function unique(ids: number[]): number[] {
  return [...new Set(ids)]
}

function heading(iso: string, today: string): { title: string; aside: string } {
  const diff = Math.round((parseIsoDate(iso).getTime() - parseIsoDate(today).getTime()) / 86400000)
  const date = formatDayMonth(iso)
  if (diff === 0) return { title: 'Сегодня', aside: date }
  if (diff === 1) return { title: 'Завтра', aside: date }
  if (diff === -1) return { title: 'Вчера', aside: date }
  if (diff > 1 && diff < 7) return { title: formatWeekday(iso), aside: date }
  return { title: date, aside: formatWeekday(iso) }
}

/** Day-by-day watering board. Empty days are omitted so the list is the schedule itself. */
export function buildBoard(args: {
  days: Record<string, CalendarDay>
  from: string
  to: string
  today: string
  snoozed?: number[]
  /** Home screen: overdue plants once, at the top. Calendar: keep them on their dates. */
  overdueBanner?: boolean
}): { overdue: BoardRow[]; groups: BoardGroup[] } {
  const { days, today } = args
  const overdueBanner = args.overdueBanner ?? false
  const snoozed = new Set(args.snoozed ?? [])
  const tomorrow = isoDate(addDays(parseIsoDate(today), 1))
  const doneToday = new Set((days[today]?.done ?? []).map((d) => d.plant_id))

  const overdueIds = unique(Object.values(days).flatMap((d) => d.overdue ?? [])).filter(
    (id) => !doneToday.has(id) && !snoozed.has(id),
  )

  const overdue: BoardRow[] = overdueBanner
    ? overdueIds.map((id) => ({
        key: `overdue-${id}`,
        plantId: id,
        done: false,
        doneBy: '',
        wateredAt: '',
        tone: 'overdue',
        dueLabel: 'просрочено',
        snoozable: true,
        past: false,
        checkable: true,
      }))
    : []

  const hiddenOverdue = new Set(overdueBanner ? overdueIds : [])
  const groups: BoardGroup[] = []
  let cursor = parseIsoDate(args.from)
  const end = parseIsoDate(args.to)

  while (cursor.getTime() <= end.getTime()) {
    const iso = isoDate(cursor)
    const bucket = days[iso]
    const past = iso < today
    const doneItems = bucket?.done ?? []
    const doneIds = new Set(doneItems.map((d) => d.plant_id))
    const rows: BoardRow[] = []

    const showOverdueHere = !overdueBanner || iso === today
    if (showOverdueHere) {
      for (const id of unique(bucket?.overdue ?? [])) {
        if (doneIds.has(id) || hiddenOverdue.has(id) || snoozed.has(id)) continue
        rows.push({
          key: `o-${iso}-${id}`,
          plantId: id,
          done: false,
          doneBy: '',
          wateredAt: '',
          tone: 'overdue',
          dueLabel: past ? 'пропущено' : 'полить сегодня',
          snoozable: iso === today,
          past,
          checkable: true,
        })
      }
    }

    if (!past) {
      const isFuture = iso > today
      for (const id of unique(bucket?.planned ?? [])) {
        if (doneIds.has(id) || (overdueBanner && snoozed.has(id))) continue
        rows.push({
          key: `p-${iso}-${id}`,
          plantId: id,
          done: false,
          doneBy: '',
          wateredAt: '',
          tone: iso === today ? 'today' : 'normal',
          dueLabel: '',
          snoozable: iso === today,
          past: false,
          checkable: !isFuture,
        })
      }
    }

    if (overdueBanner && iso === tomorrow) {
      for (const id of snoozed) {
        if (rows.some((r) => r.plantId === id && !r.done)) continue
        rows.unshift({
          key: `s-${iso}-${id}`,
          plantId: id,
          done: false,
          doneBy: '',
          wateredAt: '',
          tone: 'normal',
          dueLabel: 'отложено',
          snoozable: false,
          past: false,
          checkable: true,
        })
      }
    }

    for (const item of doneItems) {
      rows.push({
        key: `d-${item.watering_id}`,
        plantId: item.plant_id,
        done: true,
        wateringId: item.watering_id,
        doneBy: item.watered_by_name,
        wateredAt: item.watered_at,
        tone: 'normal',
        dueLabel: '',
        snoozable: false,
        past,
        checkable: true,
      })
    }

    if (rows.length) {
      const h = heading(iso, today)
      groups.push({ iso, ...h, rows })
    }
    cursor = addDays(cursor, 1)
  }

  return { overdue, groups }
}
