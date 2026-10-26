/** Lightweight overlay while the PWA installs/updates or the free API wakes. */

export const NZ_BOOT_SHELL_ID = 'nz-boot-shell'
export const PWA_UPDATE_COPY = {
  title: 'Обновляем приложение',
  subtitle: 'Ставим новую версию Незалейки',
}
export const PWA_INSTALL_COPY = {
  title: 'Устанавливаем',
  subtitle: 'Готовим Незалейку на этом телефоне',
}

type BootCopy = { title: string; subtitle: string }

function shellEl(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  return document.getElementById(NZ_BOOT_SHELL_ID)
}

export function showBootShell(copy: BootCopy = PWA_UPDATE_COPY): void {
  const el = shellEl()
  if (!el) return
  const title = el.querySelector<HTMLElement>('[data-nz-boot-title]')
  const subtitle = el.querySelector<HTMLElement>('[data-nz-boot-subtitle]')
  if (title) title.textContent = copy.title
  if (subtitle) subtitle.textContent = copy.subtitle
  el.hidden = false
  el.setAttribute('aria-busy', 'true')
  el.classList.add('is-visible')
}

export function hideBootShell(): void {
  const el = shellEl()
  if (!el) return
  el.classList.remove('is-visible')
  el.setAttribute('aria-busy', 'false')
  el.hidden = true
}

export function isBootShellVisible(): boolean {
  const el = shellEl()
  return Boolean(el && !el.hidden && el.classList.contains('is-visible'))
}
