import { defineStore } from 'pinia'
import { ensureAuth, getApi } from '~/utils/api'

export interface FeedPlant {
  id: number
  name: string
  species_name: string
  photo_url: string | null
  status: 'ok' | 'due_soon' | 'due_today' | 'overdue'
  next_due: string
  days_until: number
  season_hint: string
  room?: string
}

export interface PlantDetail extends FeedPlant {
  species_detail: {
    id: number
    name_ru: string
    category: string
  }
  note: string
  added_at: string
  last_watered_at: string
}

export const usePlantsStore = defineStore('plants', {
  state: () => ({
    feed: [] as FeedPlant[],
    widget: [] as FeedPlant[],
    list: [] as PlantDetail[],
    dashboard: { overdue: 0, due_today: 0, due_soon: 0, ok: 0, total: 0 },
  }),
  actions: {
    async refreshFeed() {
      await ensureAuth()
      const api = getApi()
      const [feed, widget, dashboard] = await Promise.all([
        api.get<FeedPlant[]>('/api/feed/watering'),
        api.get<FeedPlant[]>('/api/widget/next'),
        api.get('/api/dashboard'),
      ])
      this.feed = feed.data
      this.widget = widget.data
      this.dashboard = dashboard.data
    },
    async fetchList() {
      await ensureAuth()
      const { data } = await getApi().get<{ results?: PlantDetail[] } | PlantDetail[]>('/api/plants/')
      this.list = Array.isArray(data) ? data : (data.results ?? [])
    },
    async waterPlant(id: number, wateredAt?: string) {
      await ensureAuth()
      await getApi().post(`/api/plants/${id}/waterings/`, {
        watered_at: wateredAt || new Date().toISOString(),
      })
      await this.refreshFeed()
    },
    async fetchPlant(id: number) {
      await ensureAuth()
      const { data } = await getApi().get<PlantDetail>(`/api/plants/${id}/`)
      return data
    },
  },
})
