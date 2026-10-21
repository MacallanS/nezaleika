import type { ProfilePhotoMeta, ProfilePhotoKind } from './profilePhotos'

type PhotosMap = Record<string, ProfilePhotoMeta | null>

/** Last known profile photos — sync seed for wizards (avoids empty-upload flash). */
let remembered: PhotosMap | null = null

export function rememberProfilePhotos(
  data: PhotosMap | null | undefined,
): void {
  if (!data || typeof data !== 'object') return
  remembered = { ...data }
}

export function rememberProfilePhotoKind(
  kind: ProfilePhotoKind | string,
  meta: ProfilePhotoMeta | null | undefined,
): void {
  remembered = { ...(remembered || {}), [kind]: meta ?? null }
}

export function peekRememberedProfilePhotos(): PhotosMap | null {
  return remembered
}

export function clearRememberedProfilePhotos(): void {
  remembered = null
}
