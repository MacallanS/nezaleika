import { ensureAuth, getApi } from '~/utils/api'

const SNOOZE_PREFIX = 'nezaleika_snooze_'

/** Hidden for the rest of today; tomorrow the plant is due again. */
function todayEnd(): string {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

function readLocal(plantId: number): string | null {
  if (!import.meta.client) return null
  return localStorage.getItem(`${SNOOZE_PREFIX}${plantId}`)
}

function writeLocal(plantId: number, until: string) {
  if (!import.meta.client) return
  localStorage.setItem(`${SNOOZE_PREFIX}${plantId}`, until)
}

function clearLocal(plantId: number) {
  if (!import.meta.client) return
  localStorage.removeItem(`${SNOOZE_PREFIX}${plantId}`)
}

export function useWateringSnooze() {
  function isSnoozed(plantId: number): boolean {
    if (!import.meta.client) return false
    const until = readLocal(plantId)
    if (!until) return false
    if (new Date(until).getTime() < Date.now()) {
      clearLocal(plantId)
      return false
    }
    return true
  }

  async function syncFromServer() {
    if (!import.meta.client) return
    try {
      await ensureAuth()
      const { data } = await getApi().get<Array<{ plant_id: number; until: string }>>('/api/snoozes')
      const active = new Set<number>()
      for (const row of data) {
        active.add(row.plant_id)
        writeLocal(row.plant_id, row.until)
      }
      // Drop stale local-only entries that server no longer has.
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key?.startsWith(SNOOZE_PREFIX)) continue
        const id = Number(key.slice(SNOOZE_PREFIX.length))
        if (!Number.isFinite(id) || active.has(id)) continue
        // Keep local entries that are still in the future if sync race; clear expired.
        const until = localStorage.getItem(key)
        if (!until || new Date(until).getTime() < Date.now()) clearLocal(id)
      }
    } catch {
      /* offline / unauth — keep local cache */
    }
  }

  async function snoozeUntilTomorrow(plantId: number) {
    if (!import.meta.client) return
    const until = todayEnd()
    writeLocal(plantId, until)
    try {
      await ensureAuth()
      const { data } = await getApi().post<{ until: string }>(`/api/plants/${plantId}/snooze`, { until })
      if (data?.until) writeLocal(plantId, data.until)
    } catch {
      /* local cache still hides the plant in UI */
    }
  }

  async function clearSnooze(plantId: number) {
    clearLocal(plantId)
    try {
      await ensureAuth()
      await getApi().delete(`/api/plants/${plantId}/snooze`)
    } catch {
      /* ignore */
    }
  }

  function filterSnoozed<T extends { id: number }>(items: T[]): T[] {
    return items.filter((p) => !isSnoozed(p.id))
  }

  return { isSnoozed, snoozeUntilTomorrow, clearSnooze, filterSnoozed, syncFromServer }
}
