import { syncAuthRrThemeColorForVisibleShell } from './syncAuthRrThemeColor'

const OVERLAY_ID = 'app-bootstrap-shell'
const HIDE_MS = 200

type OverlayWindow = Window & {
  __hideBootstrapShell?: () => void
  __bootstrapShellHideTimer?: ReturnType<typeof setTimeout> | null
}

function overlayElement(doc?: Document): HTMLElement | null {
  const target = doc ?? (typeof document !== 'undefined' ? document : null)
  return target?.getElementById(OVERLAY_ID) as HTMLElement | null
}

/** Прячет HTML-близнец Auth RR (SSO splash / auto-authorize / fintech spa overlay). */
export function hideAuthRrLoadingOverlay(doc?: Document): void {
  if (typeof window !== 'undefined') {
    const hide = (window as OverlayWindow).__hideBootstrapShell
    if (hide) {
      hide()
      window.setTimeout(() => {
        syncAuthRrThemeColorForVisibleShell(doc)
      }, HIDE_MS)
      return
    }
  }

  const shell = overlayElement(doc)
  if (!shell) return
  shell.style.opacity = '0'
  shell.style.pointerEvents = 'none'
  window.setTimeout(() => {
    shell.style.display = 'none'
    try {
      (doc ?? document).documentElement.removeAttribute('data-rr-bootstrap')
    } catch {
      // ignore
    }
    syncAuthRrThemeColorForVisibleShell(doc)
  }, HIDE_MS)
}

export function isAuthRrLoadingOverlayVisible(doc?: Document): boolean {
  const shell = overlayElement(doc)
  if (!shell) return false
  return shell.style.display !== 'none'
}
