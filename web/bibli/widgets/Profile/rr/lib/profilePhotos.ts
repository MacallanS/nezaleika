/** RR profile photo kinds ↔ backend /api/user/personal-data/photos/{kind} */
export const PROFILE_PHOTO_KINDS = [
  'personal_selfie',
  'passport_main',
  'passport_registration',
  'inn',
  'snils',
  'banking_details',
] as const

/** Токен превью: открыть плашку «снять/загрузить» без реального файла. */
export const EMPTY_PHOTO_PREVIEW_TOKEN = '__empty_photo__'

export type ProfilePhotoKind = (typeof PROFILE_PHOTO_KINDS)[number]

export type ProfilePhotoMeta = {
  kind: ProfilePhotoKind | string
  code: string
  url: string
  mime?: string | null
}

export type ProfilePhotosMap = Record<ProfilePhotoKind, ProfilePhotoMeta | null>

export function isBlobPreviewUrl(url: string | null | undefined): boolean {
  return typeof url === 'string' && (url.startsWith('blob:') || url.startsWith('data:'))
}

/**
 * Apply server photo code without wiping a live local File/blob preview.
 * Returns next { serverPath, previewUrl, mime, isPdf } — caller assigns to form.
 */
export function mergeServerPhotoCode(opts: {
  code: string | null | undefined
  getDocumentUrl: (code: string) => string
  localFile?: File | null
  currentPreviewUrl?: string | null
  mime?: string | null
  preferredUrl?: string | null
}): {
  serverPath: string | null
  previewUrl: string
  mime: string | null
  isPdf: boolean
} {
  const code = opts.code ? String(opts.code) : null
  const mime = opts.mime ? String(opts.mime) : null
  const isPdf =
    Boolean(mime && /pdf/i.test(mime)) ||
    Boolean(opts.localFile && /pdf/i.test(opts.localFile.type || '')) ||
    /\.pdf($|\?|#)/i.test(`${opts.preferredUrl || ''} ${opts.currentPreviewUrl || ''} ${code || ''}`)

  if (!code) {
    const keepLocal =
      Boolean(opts.localFile) || isBlobPreviewUrl(opts.currentPreviewUrl)
    return {
      serverPath: null,
      previewUrl: keepLocal ? opts.currentPreviewUrl || '' : '',
      mime,
      isPdf,
    }
  }

  const keepLocalBlob =
    Boolean(opts.localFile) || isBlobPreviewUrl(opts.currentPreviewUrl)

  const serverPreview = opts.getDocumentUrl(code)

  return {
    serverPath: code,
    previewUrl: keepLocalBlob
      ? opts.currentPreviewUrl || serverPreview
      : serverPreview,
    mime,
    isPdf,
  }
}

/**
 * Apply a remembered/API photo meta onto form string fields.
 * Returns the merge result when a server path was assigned, otherwise null.
 */
export function applyPhotoMetaToForm(opts: {
  meta: { code?: string | null; url?: string | null; mime?: string | null } | null | undefined
  getDocumentUrl: (code: string) => string
  localFile: File | null
  currentPreviewUrl: string | null
  setServerPath: (code: string) => void
  setPreviewUrl: (url: string) => void
  clearLocalFile?: () => void
  setMime?: (mime: string | null) => void
  setIsPdf?: (isPdf: boolean) => void
}): ReturnType<typeof mergeServerPhotoCode> | null {
  const merged = mergeServerPhotoCode({
    code: opts.meta?.code,
    getDocumentUrl: opts.getDocumentUrl,
    localFile: opts.localFile,
    currentPreviewUrl: opts.currentPreviewUrl,
    mime: opts.meta?.mime,
    preferredUrl: opts.meta?.url,
  })
  if (!merged.serverPath) {
    // Саппорт удалил фото — сбрасываем серверный путь, если нет локального blob.
    if (!opts.localFile && !isBlobPreviewUrl(opts.currentPreviewUrl)) {
      opts.setServerPath('')
      opts.setPreviewUrl('')
      opts.setMime?.(null)
      opts.setIsPdf?.(false)
    }
    return null
  }
  opts.setServerPath(merged.serverPath)
  opts.setPreviewUrl(merged.previewUrl)
  opts.setMime?.(merged.mime)
  opts.setIsPdf?.(merged.isPdf)
  if (!isBlobPreviewUrl(merged.previewUrl)) {
    opts.clearLocalFile?.()
  }
  return merged
}
