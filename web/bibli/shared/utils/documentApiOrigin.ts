/**
 * Единый контур host → document storage API origin
 * (server / dev.server / yandex.server.rusaifin.ru).
 */

export const DOCUMENT_API_ORIGIN = {
  prod: 'https://server.rusaifin.ru',
  dev: 'https://dev.server.rusaifin.ru',
  yandex: 'https://yandex.server.rusaifin.ru',
} as const

export type DocumentApiOrigin =
  (typeof DOCUMENT_API_ORIGIN)[keyof typeof DOCUMENT_API_ORIGIN]

/** Hostnames, где лежат /document/{code}. */
export const DOCUMENT_STORAGE_HOSTS = new Set([
  'server.rusaifin.ru',
  'dev.server.rusaifin.ru',
  'yandex.server.rusaifin.ru',
])

/** Frontend BFF host → storage API. */
export const FRONTEND_TO_DOCUMENT_API: Readonly<Record<string, DocumentApiOrigin>> = {
  'fintech.rusaifin.ru': DOCUMENT_API_ORIGIN.prod,
  'dev.fintech.rusaifin.ru': DOCUMENT_API_ORIGIN.dev,
  'yandex.fintech.rusaifin.ru': DOCUMENT_API_ORIGIN.yandex,
}

export type ResolveDocumentApiOriginOptions = {
  /** window.location.hostname или hostname из URL */
  hostname?: string | null
  /** NUXT_PUBLIC_API_BASE_URL / явный API base */
  apiBaseUrl?: string | null
  /** import.meta.env.DEV */
  isDev?: boolean
}

export function isDocumentStorageHost(hostname: string | null | undefined): boolean {
  if (!hostname) return false
  return DOCUMENT_STORAGE_HOSTS.has(String(hostname).toLowerCase())
}

export function isDocumentStorageOrigin(originOrUrl: string | null | undefined): boolean {
  if (!originOrUrl) return false
  try {
    return isDocumentStorageHost(new URL(originOrUrl).hostname)
  } catch {
    return false
  }
}

export function isLocalDevHostname(hostname: string | null | undefined): boolean {
  const host = String(hostname || '').toLowerCase()
  if (!host) return false
  return (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host.startsWith('127.') ||
    host.startsWith('192.') ||
    host.startsWith('172.') ||
    host.startsWith('10.')
  )
}

/**
 * Map frontend / API hostname → document storage origin.
 * Returns null only when host is empty/unknown and not a rusaifin-like host.
 */
export function resolveDocumentApiOriginFromHost(
  host: string | null | undefined,
  opts: Pick<ResolveDocumentApiOriginOptions, 'isDev'> = {},
): DocumentApiOrigin | null {
  const normalized = String(host || '').toLowerCase().trim()
  if (!normalized) return null

  const mapped = FRONTEND_TO_DOCUMENT_API[normalized]
  if (mapped) return mapped

  if (normalized.includes('yandex.')) return DOCUMENT_API_ORIGIN.yandex

  if (
    opts.isDev ||
    isLocalDevHostname(normalized) ||
    normalized.startsWith('dev.') ||
    normalized.includes('192.') ||
    normalized.includes('172.')
  ) {
    return DOCUMENT_API_ORIGIN.dev
  }

  if (normalized.includes('fintech.') || normalized.endsWith('.rusaifin.ru')) {
    return DOCUMENT_API_ORIGIN.prod
  }

  return null
}

/** Backend origin for /document/{code}. */
export function resolveDocumentApiOrigin(
  opts: ResolveDocumentApiOriginOptions = {},
): DocumentApiOrigin {
  const hostname =
    opts.hostname ??
    (typeof window !== 'undefined' ? window.location.hostname : '')

  const fromHost = resolveDocumentApiOriginFromHost(hostname, { isDev: opts.isDev })
  if (fromHost) return fromHost

  const explicit = String(opts.apiBaseUrl || '').trim().replace(/\/$/, '')
  if (explicit && isDocumentStorageOrigin(explicit)) {
    return explicit as DocumentApiOrigin
  }
  if (explicit) {
    try {
      const fromExplicit = resolveDocumentApiOriginFromHost(new URL(explicit).hostname, {
        isDev: opts.isDev,
      })
      if (fromExplicit) return fromExplicit
    } catch {
      /* ignore */
    }
  }

  return opts.isDev ? DOCUMENT_API_ORIGIN.dev : DOCUMENT_API_ORIGIN.prod
}

export function normalizeDocumentCode(file: string): string {
  return file.replace(/^\/+/, '').replace(/^document\//, '')
}

/** Extract document storage code from /document/{code}, proxy URL, or raw code. */
export function extractDocumentCode(urlOrCode: string | null | undefined): string {
  const raw = String(urlOrCode || '').trim()
  if (!raw) return ''
  if (raw.startsWith('blob:') || raw.startsWith('data:')) return ''

  try {
    if (raw.includes('/document-proxy')) {
      const q = new URL(
        raw,
        typeof window !== 'undefined' ? window.location.origin : 'http://local',
      )
      const target = q.searchParams.get('url')
      if (target) return extractDocumentCode(target)
    }
    const abs = new URL(
      raw,
      typeof window !== 'undefined' ? window.location.origin : 'http://local',
    )
    const m = abs.pathname.match(/\/document\/([^/?#]+)/)
    if (m?.[1]) return decodeURIComponent(m[1])
  } catch {
    /* fall through */
  }

  if (/^[a-zA-Z0-9_-]{8,}$/.test(raw) && !raw.includes('/')) return raw
  return normalizeDocumentCode(raw).split(/[/?#]/)[0] || ''
}

/** Absolute `https://{storage}/document/{code}` (or passthrough absolute storage URL). */
export function getAbsoluteDocumentUrl(
  file: string | null | undefined,
  opts: ResolveDocumentApiOriginOptions = {},
): string {
  if (!file) return ''

  if (/^https?:\/\//.test(file)) {
    try {
      const parsed = new URL(file)
      if (isDocumentStorageOrigin(parsed.origin)) return file
      const mapped = FRONTEND_TO_DOCUMENT_API[parsed.hostname.toLowerCase()]
      if (mapped) return `${mapped}${parsed.pathname}${parsed.search}`
      const code = parsed.pathname.match(/\/document\/(.+)/)?.[1]
      if (code) return `${resolveDocumentApiOrigin(opts)}/document/${code}`
    } catch {
      return file
    }
  }

  return `${resolveDocumentApiOrigin(opts)}/document/${normalizeDocumentCode(file)}`
}

export const DOCUMENT_AVATAR_SIZES = [96, 192] as const
export type DocumentAvatarSize = (typeof DOCUMENT_AVATAR_SIZES)[number]

/** Absolute `…/document/{code}/thumb?size=96|192` for list/header avatars. */
export function getAbsoluteDocumentAvatarUrl(
  file: string | null | undefined,
  size: DocumentAvatarSize = 96,
  opts: ResolveDocumentApiOriginOptions = {},
): string {
  const code = extractDocumentCode(file)
  if (!code) return ''
  const safeSize = DOCUMENT_AVATAR_SIZES.includes(size) ? size : 96
  return `${resolveDocumentApiOrigin(opts)}/document/${code}/thumb?size=${safeSize}`
}

/**
 * Кандидаты URL для превью (<img> / fetch):
 * на фронте (localhost, fintech.*) — сначала same-origin proxy, иначе прямой storage URL режется CORS при fetch().
 * На storage-хосте — как раньше: src → proxy → /document → absolute.
 */
export function buildDocumentPreviewCandidates(
  src: string | null | undefined,
  opts: ResolveDocumentApiOriginOptions = {},
): string[] {
  const list: string[] = []
  const push = (u: string) => {
    if (u && !list.includes(u)) list.push(u)
  }

  const raw = String(src || '').trim()
  if (!raw || raw.startsWith('blob:') || raw.startsWith('data:')) {
    push(raw)
    return list
  }

  const code = extractDocumentCode(raw)
  if (!code) {
    push(raw)
    return list
  }

  const abs = getAbsoluteDocumentUrl(code, opts)

  if (typeof window !== 'undefined') {
    const origin = window.location.origin
    const onStorageHost = isDocumentStorageHost(window.location.hostname)
    const proxyUrl = `${origin}/document-proxy?url=${encodeURIComponent(abs)}`
    const sameOriginDocument = `${origin}/document/${code}`

    if (onStorageHost) {
      push(raw)
      push(proxyUrl)
      push(sameOriginDocument)
      push(abs)
    } else {
      push(proxyUrl)
      push(sameOriginDocument)
      push(abs)
      try {
        const parsed = new URL(raw, origin)
        if (parsed.origin === origin) push(raw)
      } catch {
        if (!/^https?:\/\//.test(raw)) push(raw)
      }
    }
  } else {
    push(raw)
    push(abs)
  }

  return list
}
