/** Целое неотрицательное число для подписей времени (без дробных «2,45…»). */
function whole(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.round(n))
}

/** Относительная метка времени: мин → ч → дн, затем дата. */
export function formatStaffHistoryTimeLabel(
  createdAt: string | null | undefined,
  now: Date = new Date(),
): string {
  if (!createdAt) return ''
  const at = new Date(createdAt)
  if (Number.isNaN(at.getTime())) return ''

  const diffMs = Math.max(0, now.getTime() - at.getTime())
  const mins = whole(diffMs / 60_000)
  const hours = whole(diffMs / 3_600_000)
  const days = whole(diffMs / 86_400_000)

  if (mins < 1) return 'только что'
  if (mins < 60) return `${mins} мин назад`
  if (hours < 24) return `${hours} ч назад`
  if (days === 1) {
    const hh = String(at.getHours()).padStart(2, '0')
    const mm = String(at.getMinutes()).padStart(2, '0')
    return `вчера, ${hh}:${mm}`
  }
  if (days < 7) return `${days} дн назад`

  const dd = String(at.getDate()).padStart(2, '0')
  const mo = String(at.getMonth() + 1).padStart(2, '0')
  if (at.getFullYear() === now.getFullYear()) {
    return `${dd}.${mo}`
  }
  return `${dd}.${mo}.${at.getFullYear()}`
}
