/** PWA icon badge for overdue/today count (Android Chrome / some desktop). */
export function useAppBadge() {
  function setBadge(count: number) {
    if (!import.meta.client) return
    const nav = navigator as Navigator & {
      setAppBadge?: (n?: number) => Promise<void>
      clearAppBadge?: () => Promise<void>
    }
    try {
      if (count > 0 && typeof nav.setAppBadge === 'function') {
        void nav.setAppBadge(count)
      } else if (count <= 0 && typeof nav.clearAppBadge === 'function') {
        void nav.clearAppBadge()
      }
    } catch {
      /* unsupported / denied */
    }
  }

  function clearBadge() {
    setBadge(0)
  }

  return { setBadge, clearBadge }
}
