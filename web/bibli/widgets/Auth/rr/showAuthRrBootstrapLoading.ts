import { AUTH_RR_LOADING_COPY, type AuthRrLoadingCopy } from './authRrLoadingCopy'
import { syncAuthRrLoadingThemeColor } from './syncAuthRrThemeColor'

export type AuthRrBootstrapLoadingCopy = AuthRrLoadingCopy | string

type BootstrapShellWindow = Window & {
  __showBootstrapShell?: (message?: AuthRrBootstrapLoadingCopy | AuthRrLoadingCopy) => void
}

function normalizeCopy(
  copy?: AuthRrBootstrapLoadingCopy,
): AuthRrLoadingCopy {
  if (typeof copy === 'string') {
    return { title: copy, subtitle: '' }
  }

  return {
    title: copy?.title ?? AUTH_RR_LOADING_COPY.title,
    subtitle: copy?.subtitle ?? AUTH_RR_LOADING_COPY.subtitle,
  }
}

function blurActiveField(): void {
  if (typeof document === 'undefined') {
    return
  }

  try {
    const active = document.activeElement
    if (active instanceof HTMLElement && active !== document.body) {
      active.blur()
    }
  } catch {
    // ignore
  }
}

function afterKeyboardSettle(apply: () => void): void {
  blurActiveField()
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(apply)
    return
  }
  apply()
}

/**
 * Единая точка показа Auth RR loading — всегда `#app-bootstrap-shell`.
 * Vue-страницы не рисуют второй loading-layout (иначе safe-area / Island расходятся).
 */
export function showAuthRrBootstrapLoading(copy?: AuthRrBootstrapLoadingCopy): void {
  if (typeof window === 'undefined') {
    return
  }

  const payload = normalizeCopy(copy)

  try {
    document.documentElement.setAttribute('data-rr-bootstrap', '1')
    document.documentElement.classList.remove('app-overlay-open')
  } catch {
    // ignore
  }

  afterKeyboardSettle(() => {
    const win = window as BootstrapShellWindow
    const show = win.__showBootstrapShell

    if (show) {
      show(payload)
    } else {
      applyBootstrapCopyToDom(payload)
    }

    syncAuthRrLoadingThemeColor()
  })
}

function applyBootstrapCopyToDom(copy: AuthRrLoadingCopy): void {
  if (typeof document === 'undefined') {
    return
  }

  const shell = document.getElementById('app-bootstrap-shell')
  if (!shell) {
    return
  }

  const title = document.getElementById('bootstrap-rr-title')
  const subtitle = document.getElementById('bootstrap-rr-subtitle')
  const body = document.getElementById('bootstrap-rr-body')

  if (title) {
    title.textContent = copy.title
  }
  if (subtitle) {
    subtitle.textContent = copy.subtitle
  }

  shell.style.opacity = '1'
  shell.style.pointerEvents = 'auto'
  shell.style.display = 'flex'

  if (body) {
    body.style.display = 'flex'
  }
}
