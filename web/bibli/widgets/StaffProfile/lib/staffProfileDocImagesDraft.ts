/**
 * URL превью слота документа в карточке саппорта:
 * локальная замена → пусто после удаления → серверный файл.
 */
export function resolveStaffDocImageDisplayUrl(options: {
  key: string
  serverUrl?: string | null
  hiddenKeys: readonly string[]
  pendingPreviewByKey: Record<string, string>
}): string {
  const pending = options.pendingPreviewByKey[options.key]
  if (pending) return pending
  if (options.hiddenKeys.includes(options.key)) return ''
  return String(options.serverUrl ?? '').trim()
}

export function revokeStaffDocPendingPreviews(
  pendingPreviewByKey: Record<string, string>,
  keys?: readonly string[],
): Record<string, string> {
  const next = { ...pendingPreviewByKey }
  const targets = keys ?? Object.keys(next)
  for (const key of targets) {
    const url = next[key]
    if (url) {
      try {
        URL.revokeObjectURL(url)
      } catch {
        // ignore
      }
    }
    delete next[key]
  }
  return next
}
