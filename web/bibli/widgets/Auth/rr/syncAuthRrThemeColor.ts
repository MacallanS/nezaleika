const AUTH_FORM_THEME_COLOR = '#ffffff'
const AUTH_LOADING_THEME_COLOR = '#f2f3f7'

function setThemeColor(color: string): void {
  if (typeof document === 'undefined') {
    return
  }

  try {
    const metas = document.querySelectorAll('meta[name="theme-color"]')
    if (metas.length === 0) {
      const meta = document.createElement('meta')
      meta.name = 'theme-color'
      meta.content = color
      document.head.appendChild(meta)
      return
    }

    metas.forEach((meta) => {
      meta.setAttribute('content', color)
    })
  } catch {
    // ignore
  }
}

function hasAuthFormShell(doc: Document = document): boolean {
  return Boolean(
    doc.querySelector(
      '.auth-rr-shell:not(.auth-rr-shell--loading):not(#app-bootstrap-shell)',
    ),
  )
}

/** После скрытия bootstrap — status bar под белую форму, не серую полосу. */
export function syncAuthRrThemeColorForVisibleShell(doc?: Document): void {
  const target = doc ?? (typeof document !== 'undefined' ? document : null)
  if (!target) {
    return
  }

  setThemeColor(hasAuthFormShell(target) ? AUTH_FORM_THEME_COLOR : AUTH_LOADING_THEME_COLOR)
}

export function syncAuthRrLoadingThemeColor(): void {
  setThemeColor(AUTH_LOADING_THEME_COLOR)
}
