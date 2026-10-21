export function isStaffDocDisplayValueEmpty(value: unknown): boolean {
  const trimmed = String(value ?? '').trim()
  return trimmed === '' || trimmed === '—'
}

export function isStaffDocSectionEmpty(options: {
  rows?: Array<{ value?: unknown }>
  images?: Array<{ url?: string | null }>
  imageUrls?: Array<string | null | undefined>
  extraValues?: unknown[]
}): boolean {
  const hasFilledImage =
    (options.images ?? []).some((image) => !isStaffDocDisplayValueEmpty(image.url)) ||
    (options.imageUrls ?? []).some((url) => !isStaffDocDisplayValueEmpty(url))

  const hasFilledRow = (options.rows ?? []).some(
    (row) => !isStaffDocDisplayValueEmpty(row.value),
  )

  const hasExtra = (options.extraValues ?? []).some(
    (value) => !isStaffDocDisplayValueEmpty(value),
  )

  return !hasFilledImage && !hasFilledRow && !hasExtra
}

/**
 * Empty-state для панели документа.
 * Локальные файлы/поля важнее activation status: иначе при status=empty
 * саппорт видит только иллюстрацию, хотя скан уже загружен.
 */
export function resolveStaffDocPanelEmpty(options: {
  stepStatus?: string | null
  rows?: Array<{ value?: unknown }>
  images?: Array<{ url?: string | null }>
  imageUrls?: Array<string | null | undefined>
  extraValues?: unknown[]
}): boolean {
  if (!isStaffDocSectionEmpty(options)) {
    return false
  }

  if (options.stepStatus != null && options.stepStatus !== '') {
    return options.stepStatus === 'empty'
  }

  return true
}
