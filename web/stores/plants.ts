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
      await ensureAuth()
      const { data } = await getApi().get<CalendarRange>('/api/calendar', { params: { from, to } })
      this.calendar = data
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
    /** Optimistically moves the plant to "done today" and returns the new watering id. */
    async water(plantId: number, wateredAt?: string): Promise<number | null> {
      if (this.pending[plantId]) return null
      this.pending[plantId] = true
      const snapshot = this.agenda ? JSON.parse(JSON.stringify(this.agenda)) as Agenda : null
      const isToday = !wateredAt || wateredAt.slice(0, 10) === this.agenda?.today
      if (this.agenda && isToday) {
        for (const key of Object.keys(this.agenda.sections) as AgendaSectionKey[]) {
          this.agenda.sections[key] = this.agenda.sections[key].filter((i) => i.plant_id !== plantId)
        }
        this.agenda.done_today.unshift({
          plant_id: plantId,
          watering_id: -1,
          watered_at: new Date().toISOString(),
          watered_by_name: useAuthStore().user?.first_name || '',
        })
      }
      try {
        await ensureAuth()
        const body = wateredAt ? { watered_at: wateredAt } : {}
        const { data } = await getApi().post<WateringRecord>(`/api/plants/${plantId}/waterings/`, body)
        void this.refreshAll()
        return data.id
      } catch (e) {
        if (snapshot) this.agenda = snapshot
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
