import {
  applyPhotoMetaToForm,
  type ProfilePhotoMeta,
} from './profilePhotos'
import {
  peekRememberedProfilePhotos,
  rememberProfilePhotos,
} from './profilePhotosSnapshot'

type PhotosPayload = {
  data?: Record<string, ProfilePhotoMeta | null> | null
} | null

/**
 * Resolve the best sync photos map: host HTTP cache, then bibli snapshot.
 */
export function resolveSeedPhotos(peekHost?: (() => PhotosPayload) | null): Record<
  string,
  ProfilePhotoMeta | null
> | null {
  const fromHost = peekHost?.()?.data
  if (fromHost && typeof fromHost === 'object') {
    rememberProfilePhotos(fromHost)
    return fromHost
  }
  return peekRememberedProfilePhotos()
}

export function seedPhotoSlot(opts: {
  kind: string
  peekHost?: (() => PhotosPayload) | null
  getDocumentUrl: (code: string) => string
  localFile: File | null
  currentPreviewUrl: string | null
  setServerPath: (code: string) => void
  setPreviewUrl: (url: string) => void
  clearLocalFile?: () => void
  setMime?: (mime: string | null) => void
  setIsPdf?: (isPdf: boolean) => void
}): boolean {
  const map = resolveSeedPhotos(opts.peekHost)
  const meta = map?.[opts.kind]
  if (!meta?.code) return false
  return Boolean(
    applyPhotoMetaToForm({
      meta,
      getDocumentUrl: opts.getDocumentUrl,
      localFile: opts.localFile,
      currentPreviewUrl: opts.currentPreviewUrl,
      setServerPath: opts.setServerPath,
      setPreviewUrl: opts.setPreviewUrl,
      clearLocalFile: opts.clearLocalFile,
      setMime: opts.setMime,
      setIsPdf: opts.setIsPdf,
    }),
  )
}

export function rememberPhotosFromResponse(photosRes: PhotosPayload): void {
  if (photosRes?.data) rememberProfilePhotos(photosRes.data)
}
