import { defineStore } from 'pinia'
import { ensureAuth, getApi } from '~/utils/api'

export type PlantStatus = 'ok' | 'due_soon' | 'due_today' | 'overdue'

export interface PlantInfo {
  id: number
  name: string
  species_name: string
  room: string
  photo_url: string | null
  interval_days: number
  last_watered_at: string | null
  last_watered_by: string
}

export interface AgendaItem {
  plant_id: number
  due: string
  days_until: number
}

export interface DoneItem {
  plant_id: number
  watering_id: number
  watered_at: string
  watered_by_name: string
}

export type AgendaSectionKey = 'overdue' | 'today' | 'tomorrow' | 'week' | 'later'

export interface Agenda {
  today: string
  plants: Record<string, PlantInfo>
  sections: Record<AgendaSectionKey, AgendaItem[]>
  done_today: DoneItem[]
}

export interface CalendarDay {
  done: DoneItem[]
  planned: number[]
  overdue: number[]
}

export interface CalendarRange {
  from: string
  to: string
  today: string
  plants: Record<string, PlantInfo>
  days: Record<string, CalendarDay>
}

export interface PlantDetail {
  id: number
  name: string
  room: string
  note: string
  photo_url: string | null
  status: PlantStatus
  next_due: string
  days_until: number
  season_hint: string
  interval_days: number
  added_at: string
  last_watered_at: string
  last_watered_by: string
  species_detail: {
    id: number
    name_ru: string
    name_lat: string
    category: string
    care_hint: string
  }
}

export interface WateringRecord {
  id: number
  watered_at: string
  note: string
  watered_by_name: string
}

export interface PlantStats {
  heatmap: { date: string; count: number }[]
  streak: number
  on_time_rate: number
  total: number
  interval_days: number
}

const emptySections = (): Agenda['sections'] => ({
  overdue: [],
  today: [],
  tomorrow: [],
  week: [],
  later: [],
})

/** Only the latest calendar request may write to the store (fast month swiping). */
let calendarSeq = 0

export const usePlantsStore = defineStore('plants', {
  state: () => ({
    agenda: null as Agenda | null,
    calendar: null as CalendarRange | null,
    list: [] as PlantDetail[],
    pending: {} as Record<number, boolean>,
  }),
  getters: {
    todoCount: (s) => (s.agenda ? s.agenda.sections.overdue.length + s.agenda.sections.today.length : 0),
    plantById: (s) => (id: number): PlantInfo | undefined =>
      s.agenda?.plants[String(id)] ?? s.calendar?.plants[String(id)],
  },
  actions: {
    async fetchAgenda() {
      await ensureAuth()
      const { data } = await getApi().get<Agenda>('/api/agenda')
      this.agenda = { ...data, sections: { ...emptySections(), ...data.sections } }
    },
    async fetchCalendar(from: string, to: string) {
      const seq = ++calendarSeq
      await ensureAuth()
      const { data } = await getApi().get<CalendarRange>('/api/calendar', { params: { from, to } })
      if (seq === calendarSeq) this.calendar = data
    },
    async fetchList() {
      await ensureAuth()
      const { data } = await getApi().get<{ results?: PlantDetail[] } | PlantDetail[]>('/api/plants/')
      this.list = Array.isArray(data) ? data : (data.results ?? [])
    },
    async fetchPlant(id: number) {
      await ensureAuth()
      const { data } = await getApi().get<PlantDetail>(`/api/plants/${id}/`)
      return data
    },
    async fetchWaterings(id: number) {
      await ensureAuth()
      const { data } = await getApi().get<WateringRecord[]>(`/api/plants/${id}/waterings/`)
      return data
    },
    async fetchStats(id: number) {
      await ensureAuth()
      const { data } = await getApi().get<PlantStats>(`/api/plants/${id}/stats/`)
      return data
    },
    /** Optimistically ticks the plant off the schedule and returns the new watering id. */
    async water(plantId: number, wateredAt?: string): Promise<number | null> {
      if (this.pending[plantId]) return null
      this.pending[plantId] = true
      const agendaSnapshot = this.agenda ? (JSON.parse(JSON.stringify(this.agenda)) as Agenda) : null
      const calendarSnapshot = this.calendar ? (JSON.parse(JSON.stringify(this.calendar)) as CalendarRange) : null
      const today = this.calendar?.today ?? this.agenda?.today
      const whenIso = wateredAt ? wateredAt.slice(0, 10) : today
      const wateringNow = !wateredAt || whenIso === today
      const by = useAuthStore().user?.first_name || ''
      if (this.agenda && wateringNow) {
        for (const key of Object.keys(this.agenda.sections) as AgendaSectionKey[]) {
          this.agenda.sections[key] = this.agenda.sections[key].filter((i) => i.plant_id !== plantId)
        }
        this.agenda.done_today.unshift({
          plant_id: plantId,
          watering_id: -1,
          watered_at: new Date().toISOString(),
          watered_by_name: by,
        })
      }
      if (this.calendar && whenIso) {
        const days: CalendarRange['days'] = JSON.parse(JSON.stringify(this.calendar.days))
        for (const [iso, bucket] of Object.entries(days)) {
          if (wateringNow || iso === whenIso) bucket.planned = bucket.planned.filter((id) => id !== plantId)
          if (wateringNow || iso === whenIso || iso === today) bucket.overdue = bucket.overdue.filter((id) => id !== plantId)
        }
        const bucket = days[whenIso] ?? { done: [], planned: [], overdue: [] }
        bucket.done.unshift({
          plant_id: plantId,
          watering_id: -1,
          watered_at: new Date().toISOString(),
          watered_by_name: by,
        })
        days[whenIso] = bucket
        this.calendar = { ...this.calendar, days }
      }
      try {
        await ensureAuth()
        const body = wateredAt ? { watered_at: wateredAt } : {}
        const { data } = await getApi().post<WateringRecord>(`/api/plants/${plantId}/waterings/`, body)
        void this.refreshAll()
        return data.id
      } catch (e) {
        if (agendaSnapshot) this.agenda = agendaSnapshot
        if (calendarSnapshot) this.calendar = calendarSnapshot
        throw e
      } finally {
        delete this.pending[plantId]
      }
    },
    async undoWatering(wateringId: number) {
      await ensureAuth()
      await getApi().delete(`/api/waterings/${wateringId}`)
      await this.refreshAll()
    },
    async refreshAll() {
      const tasks: Promise<unknown>[] = [this.fetchAgenda()]
      if (this.calendar) tasks.push(this.fetchCalendar(this.calendar.from, this.calendar.to))
      await Promise.allSettled(tasks)
    },
  },
})
