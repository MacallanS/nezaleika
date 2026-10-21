/** Скачать Blob через временный <a> — не блокируется как window.open после await. */
export function downloadBlobFile(
  blob: Blob,
  filenameBase: string,
  fallbackExtension = 'xlsx',
): void {
  const safeBase = String(filenameBase || '')
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
  const hasExt = /\.[a-z0-9]+$/i.test(safeBase)
  const finalName =
    safeBase && hasExt
      ? safeBase
      : `${safeBase || 'export'}.${fallbackExtension}`

  const type =
    blob.type ||
    (fallbackExtension === 'xlsx'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : blob.type)
  const normalizedBlob = type && blob.type !== type ? new Blob([blob], { type }) : blob

  const url = URL.createObjectURL(normalizedBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = finalName
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}
