/** PWA SW update helpers — keep installed app on the latest build. */

const SW_UPDATE_APPLIED_KEY = 'nz_pwa_sw_update_applied_at'
const SW_UPDATE_COOLDOWN_MS = 5 * 60 * 1000

export function hasCacheBustParam(href?: string): boolean {
  if (typeof window === 'undefined') return false
  const target = href ?? window.location.href
  try {
    const query = target.includes('?') ? target.split('?')[1]?.split('#')[0] ?? '' : ''
    return /(?:^|&)_cb=/.test(query)
  } catch {
    return false
  }
}

export function appendCacheBustToUrl(href: string, timestamp = Date.now()): string {
  const hashIdx = href.indexOf('#')
  const hash = hashIdx >= 0 ? href.slice(hashIdx) : ''
  const withoutHash = hashIdx >= 0 ? href.slice(0, hashIdx) : href
  const queryIdx = withoutHash.indexOf('?')
  const base = queryIdx >= 0 ? withoutHash.slice(0, queryIdx) : withoutHash
  const query = queryIdx >= 0 ? withoutHash.slice(queryIdx + 1) : ''
  const parts = query
    ? query.split('&').filter((part) => part && !part.startsWith('_cb='))
    : []
  parts.push(`_cb=${timestamp}`)
  return `${base}?${parts.join('&')}${hash}`
}

export function hardReloadWithCacheBust(): void {
  if (typeof window === 'undefined') return
  window.location.replace(appendCacheBustToUrl(window.location.href))
}

/** Drop `_cb` from the address bar after a successful update reload. */
export function stripCacheBustParam(): void {
  if (typeof window === 'undefined' || !hasCacheBustParam()) return
  try {
    const url = new URL(window.location.href)
    url.searchParams.delete('_cb')
    const next = `${url.pathname}${url.search}${url.hash}`
    window.history.replaceState(window.history.state, '', next || url.pathname)
  } catch {
    // ignore
  }
}

export function wasSwUpdateAppliedRecently(): boolean {
  try {
    const at = parseInt(localStorage.getItem(SW_UPDATE_APPLIED_KEY) || '0', 10) || 0
    return at > 0 && Date.now() - at < SW_UPDATE_COOLDOWN_MS
  } catch {
    return false
  }
}

export function markSwUpdateApplied(): void {
  try {
    localStorage.setItem(SW_UPDATE_APPLIED_KEY, String(Date.now()))
  } catch {
    // ignore
  }
}

export async function probeServiceWorkerUpdate(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  try {
    const registration = await navigator.serviceWorker.getRegistration()
    await registration?.update()
  } catch (error) {
    console.warn('[pwa] probeServiceWorkerUpdate failed:', error)
  }
}

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari installed PWA
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  )
}
