/**
 * Копирование в буфер: Clipboard API + fallback execCommand.
 * Нужно для HTTP / LAN IP (192.168.x.x), где нет secure context.
 */

function copyWithExecCommand(text: string): boolean {
  if (typeof document === 'undefined') return false
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '0'
  textarea.style.left = '0'
  textarea.style.opacity = '0'
  textarea.style.pointerEvents = 'none'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  textarea.setSelectionRange(0, text.length)
  let ok = false
  try {
    ok = document.execCommand('copy')
  } finally {
    document.body.removeChild(textarea)
  }
  return ok
}

function canUseClipboardApi(): boolean {
  if (typeof window === 'undefined') return false
  if (window.isSecureContext === false) return false
  return Boolean(navigator?.clipboard?.writeText)
}

/** @returns true если текст попал в буфер */
export async function writeClipboardText(text: string): Promise<boolean> {
  const value = String(text ?? '')
  if (!value) return false

  if (canUseClipboardApi()) {
    try {
      await navigator.clipboard.writeText(value)
      return true
    } catch {
      // fall through to execCommand
    }
  }

  try {
    return copyWithExecCommand(value)
  } catch {
    return false
  }
}
