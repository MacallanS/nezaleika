import { buildDocumentPreviewCandidates } from 'bibli/shared/utils/documentApiOrigin'
import {
  isImageFile,
  isPdfFile,
  isPdfMime,
  stripLeadingUtf8Bom,
} from 'bibli/widgets/Profile/rr/lib/documentMedia'
import { authenticatedFetch } from '@/shared/api/http/authenticatedFetch'

export type StaffDocumentKind = 'image' | 'pdf' | 'unknown'

export interface StaffDocumentPreview {
  kind: StaffDocumentKind
  objectUrl: string
}

interface CachedPreview {
  kind: StaffDocumentKind
  objectUrl: string
}

const previewCache = new Map<string, CachedPreview>()

function sniffPdf(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46
}

function sniffImage(bytes: Uint8Array): boolean {
  if (bytes.length < 3) return false
  let offset = 0
  if (
    bytes.length >= 6 &&
    bytes[0] === 0xef &&
    bytes[1] === 0xbb &&
    bytes[2] === 0xbf
  ) {
    offset = 3
  }
  if (bytes[offset] === 0xff && bytes[offset + 1] === 0xd8 && bytes[offset + 2] === 0xff) {
    return true
  }
  if (bytes[offset] === 0x89 && bytes[offset + 1] === 0x50 && bytes[offset + 2] === 0x4e) {
    return true
  }
  if (bytes[offset] === 0x47 && bytes[offset + 1] === 0x49 && bytes[offset + 2] === 0x46) {
    return true
  }
  if (
    bytes.length >= offset + 12 &&
    bytes[offset] === 0x52 &&
    bytes[offset + 1] === 0x49 &&
    bytes[offset + 2] === 0x46 &&
    bytes[offset + 3] === 0x46 &&
    bytes[offset + 8] === 0x57 &&
    bytes[offset + 9] === 0x45 &&
    bytes[offset + 10] === 0x42 &&
    bytes[offset + 11] === 0x50
  ) {
    return true
  }
  return false
}

async function isDocumentBlob(blob: Blob): Promise<boolean> {
  const type = String(blob.type || '').toLowerCase()
  const head = new Uint8Array(await blob.slice(0, 16).arrayBuffer())
  if (sniffPdf(head) || sniffImage(head)) return true
  if (isPdfMime(type) || type.startsWith('image/')) return true
  if (type.includes('json') || type.includes('html') || type.startsWith('text/')) {
    return false
  }
  return false
}

export async function classifyStaffDocumentBlob(blob: Blob): Promise<StaffDocumentKind> {
  const type = String(blob.type || '').toLowerCase()
  const head = new Uint8Array(await blob.slice(0, 16).arrayBuffer())
  // Сначала сигнатура — бэк иногда отдаёт PDF с image/jpeg или octet-stream.
  if (sniffPdf(head)) return 'pdf'
  if (isPdfMime(type)) return 'pdf'
  if (type.startsWith('image/')) return 'image'
  if (sniffImage(head)) return 'image'
  return 'unknown'
}

export function classifyStaffLocalFile(file: File | null | undefined): StaffDocumentKind {
  if (!file) return 'unknown'
  if (isPdfFile(file)) return 'pdf'
  if (isImageFile(file)) return 'image'
  return 'unknown'
}

/**
 * Safari/WebKit PDF viewer показывает «файл не найден», если blob без application/pdf
 * или iframe src = blob:…#fragment.
 */
export function isAppleWebKitPdfViewer(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  const vendor = navigator.vendor || ''
  if (/CriOS|FxiOS|EdgiOS|Chrome|Chromium|Android/i.test(ua)) return false
  return /Apple/i.test(vendor) || (/Safari/i.test(ua) && /AppleWebKit/i.test(ua))
}

/** Гарантируем MIME для встроенного PDF viewer (особенно Safari). */
export async function ensureTypedDocumentBlob(
  blob: Blob,
  kind: StaffDocumentKind,
): Promise<Blob> {
  const cleaned = await stripLeadingUtf8Bom(blob)
  const type = String(cleaned.type || '').toLowerCase()
  if (kind === 'pdf' && !isPdfMime(type)) {
    return new Blob([await cleaned.arrayBuffer()], { type: 'application/pdf' })
  }
  if (kind === 'image' && !type.startsWith('image/')) {
    return new Blob([await cleaned.arrayBuffer()], { type: 'image/jpeg' })
  }
  return cleaned
}

function stripUrlHash(url: string): string {
  const i = url.indexOf('#')
  return i >= 0 ? url.slice(0, i) : url
}

async function fetchStaffDocumentBlob(src: string): Promise<Blob> {
  const candidates = buildDocumentPreviewCandidates(src, { isDev: import.meta.env.DEV })

  for (const url of candidates) {
    try {
      const response = await authenticatedFetch(url, { method: 'GET' })
      if (!response.ok) continue
      const blob = await response.blob()
      if (blob.size <= 0) continue
      if (!(await isDocumentBlob(blob))) continue
      return blob
    } catch {
      /* next candidate */
    }
  }

  throw new Error('Не удалось загрузить документ')
}

function rememberPreview(src: string, kind: StaffDocumentKind, objectUrl: string) {
  const prev = previewCache.get(src)
  if (prev && prev.objectUrl !== objectUrl) {
    URL.revokeObjectURL(prev.objectUrl)
  }
  previewCache.set(src, { kind, objectUrl })
}

export function revokeStaffDocumentPreview(src: string) {
  const cached = previewCache.get(src)
  if (!cached) return
  URL.revokeObjectURL(cached.objectUrl)
  previewCache.delete(src)
}

export function clearStaffDocumentPreviewCache() {
  for (const cached of previewCache.values()) {
    URL.revokeObjectURL(cached.objectUrl)
  }
  previewCache.clear()
}

export async function loadStaffDocumentPreview(
  src: string,
  options: { file?: File | null; useCache?: boolean } = {},
): Promise<StaffDocumentPreview> {
  const trimmed = String(src || '').trim()
  if (!trimmed) {
    throw new Error('Пустой URL документа')
  }

  if (options.file) {
    const kind = classifyStaffLocalFile(options.file)
    const typed = await ensureTypedDocumentBlob(options.file, kind)
    if (
      (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) &&
      typed === options.file &&
      (kind !== 'pdf' || isPdfMime(options.file.type))
    ) {
      return { kind, objectUrl: stripUrlHash(trimmed) }
    }
    return { kind, objectUrl: URL.createObjectURL(typed) }
  }

  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    const response = await fetch(stripUrlHash(trimmed))
    const blob = await response.blob()
    const kind = await classifyStaffDocumentBlob(blob)
    const typed = await ensureTypedDocumentBlob(blob, kind)
    if (typed === blob && (kind !== 'pdf' || isPdfMime(blob.type))) {
      return { kind, objectUrl: stripUrlHash(trimmed) }
    }
    return { kind, objectUrl: URL.createObjectURL(typed) }
  }

  if (options.useCache !== false) {
    const cached = previewCache.get(trimmed)
    if (cached) return cached
  }

  const blob = await fetchStaffDocumentBlob(trimmed)
  const kind = await classifyStaffDocumentBlob(blob)
  const typed = await ensureTypedDocumentBlob(blob, kind)
  const objectUrl = URL.createObjectURL(typed)
  rememberPreview(trimmed, kind, objectUrl)
  return { kind, objectUrl }
}

/**
 * URL для <iframe>/<embed> PDF.
 * На blob:/data: + Safari WebKit не вешаем #fragment — иначе «файл не найден».
 * Для миниатюры прячем toolbar/scrollbar Chromium PDF viewer.
 */
export function pdfFrameSrc(
  objectUrl: string,
  options: { mode?: 'preview' | 'thumb' } = {},
): string {
  const url = stripUrlHash(String(objectUrl || ''))
  if (!url) return ''

  const mode = options.mode ?? 'preview'
  const isBlobLike = url.startsWith('blob:') || url.startsWith('data:')
  if (isBlobLike && isAppleWebKitPdfViewer()) return url

  if (mode === 'thumb') {
    return `${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`
  }

  if (isBlobLike) return url
  return `${url}#view=FitH`
}

/** Миниатюра PDF: embed на Apple WebKit, iframe на остальных. */
export function usePdfThumbnailEmbed(): boolean {
  return isAppleWebKitPdfViewer()
}
