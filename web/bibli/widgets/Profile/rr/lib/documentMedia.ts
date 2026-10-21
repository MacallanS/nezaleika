/** Accept / MIME helpers for profile document uploads. */

/**
 * Photo-only picker.
 * Explicit MIME + extensions help iOS Files («Обзор») grey out PDF;
 * `image/*` alone often still lets users pick documents.
 */
export const ACCEPT_IMAGE =
  'image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif'
export const ACCEPT_IMAGE_OR_PDF = 'image/*,application/pdf,.pdf'

export { extractDocumentCode } from 'bibli/shared/utils/documentApiOrigin'

export function isPdfMime(mime: string | null | undefined): boolean {
  const type = String(mime || '').toLowerCase()
  return type === 'application/pdf' || type.includes('pdf')
}

export function isImageMime(mime: string | null | undefined): boolean {
  const type = String(mime || '').toLowerCase()
  return type.startsWith('image/')
}

export function isPdfFile(file: File | null | undefined): boolean {
  if (!file) return false
  if (isPdfMime(file.type)) return true
  return /\.pdf$/i.test(String(file.name || ''))
}

export function isImageFile(file: File | null | undefined): boolean {
  if (!file) return false
  if (isPdfFile(file)) return false
  if (isImageMime(file.type)) return true
  return /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i.test(String(file.name || ''))
}

/** Срезает UTF-8 BOM — бэк иногда отдаёт JPEG с EF BB BF, и <img> не открывает blob. */
export async function stripLeadingUtf8Bom(blob: Blob): Promise<Blob> {
  const head = new Uint8Array(await blob.slice(0, 3).arrayBuffer())
  if (head.length < 3 || head[0] !== 0xef || head[1] !== 0xbb || head[2] !== 0xbf) {
    return blob
  }
  const rest = blob.slice(3)
  return new Blob([rest], { type: blob.type || rest.type })
}

export function isPdfSource(
  url: string | null | undefined,
  file?: File | null,
  pathHint?: string | null,
  mime?: string | null,
): boolean {
  if (isPdfMime(mime)) return true
  if (isImageMime(mime)) return false
  if (file && isPdfFile(file)) return true
  if (file && isImageFile(file)) return false
  const hint = `${url || ''} ${pathHint || ''}`
  return /\.pdf($|\?|#)/i.test(hint)
}

export function isAllowedUploadFile(
  file: File,
  mode: 'image' | 'image-or-pdf',
): boolean {
  if (isPdfFile(file)) return mode === 'image-or-pdf'
  if (mode === 'image') return isImageFile(file)
  return isImageFile(file)
}

export function uploadRejectMessage(mode: 'image' | 'image-or-pdf'): string {
  if (mode === 'image') {
    return 'Можно только фото (JPG, PNG, HEIC). PDF не принимается'
  }
  return 'Загрузите изображение или PDF'
}
