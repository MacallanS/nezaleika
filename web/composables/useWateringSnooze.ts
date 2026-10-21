const SNOOZE_PREFIX = 'nezaleika_snooze_'

/** Hidden for the rest of today; tomorrow the plant is due again. */
function todayEnd(): string {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

export function useWateringSnooze() {
  function isSnoozed(plantId: number): boolean {
    if (!import.meta.client) return false
    const until = localStorage.getItem(`${SNOOZE_PREFIX}${plantId}`)
    if (!until) return false
    if (new Date(until).getTime() < Date.now()) {
      localStorage.removeItem(`${SNOOZE_PREFIX}${plantId}`)
      return false
    }
    return true
  }

  function snoozeUntilTomorrow(plantId: number) {
    if (!import.meta.client) return
    localStorage.setItem(`${SNOOZE_PREFIX}${plantId}`, todayEnd())
  }

  function filterSnoozed<T extends { id: number }>(items: T[]): T[] {
    return items.filter((p) => !isSnoozed(p.id))
  }

  return { isSnoozed, snoozeUntilTomorrow, filterSnoozed }
}
