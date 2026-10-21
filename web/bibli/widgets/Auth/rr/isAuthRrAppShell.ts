/** Настоящий SSO/Auth RR shell — не bootstrap overlay `#app-bootstrap-shell`. */
export function isAuthRrAppShell(el: Element | null | undefined): boolean {
  if (!el) return false
  return el.classList.contains('auth-rr-shell') && el.id !== 'app-bootstrap-shell'
}

export function queryAuthRrAppShell(doc?: Document | null): Element | null {
  const target = doc ?? (typeof document !== 'undefined' ? document : null)
  if (!target || typeof target.querySelector !== 'function') return null
  return target.querySelector('.auth-rr-shell:not(#app-bootstrap-shell)')
}
