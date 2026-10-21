/** Refcount for html.app-overlay-open — safe-area fillers: quaternary + тот же scrim, что у dimmer. */

let overlayOpenCount = 0

export function acquireAppOverlay(): void {
  if (typeof document === 'undefined') return
  overlayOpenCount += 1
  document.documentElement.classList.add('app-overlay-open')
}

export function releaseAppOverlay(): void {
  if (typeof document === 'undefined') return
  overlayOpenCount = Math.max(0, overlayOpenCount - 1)
  if (overlayOpenCount === 0) {
    document.documentElement.classList.remove('app-overlay-open')
  }
}

export function resetAppOverlay(): void {
  overlayOpenCount = 0
  if (typeof document === 'undefined') return
  document.documentElement.classList.remove('app-overlay-open')
}
