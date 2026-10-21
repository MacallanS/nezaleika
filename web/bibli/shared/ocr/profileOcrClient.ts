import type { OcrRecognizeResult, ProfileOcrClientOptions, RecognizeKind } from './types'

function defaultBaseUrl(): string {
  try {
    const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env
    if (env?.VITE_OCR_PROFILE_URL) return String(env.VITE_OCR_PROFILE_URL).replace(/\/$/, '')
    if (env?.NUXT_PUBLIC_OCR_PROFILE_URL) {
      return String(env.NUXT_PUBLIC_OCR_PROFILE_URL).replace(/\/$/, '')
    }
    if (env?.VITE_OCR_BASE_URL) return String(env.VITE_OCR_BASE_URL).replace(/\/$/, '')
    if (env?.NUXT_PUBLIC_OCR_BASE_URL) {
      return String(env.NUXT_PUBLIC_OCR_BASE_URL).replace(/\/$/, '')
    }
  } catch {
    // ignore
  }
  return '/ocr-proxy'
}

function asMapped(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (v == null) continue
    out[k] = String(v)
  }
  return out
}

function normalizeStatus(raw: unknown): OcrRecognizeResult['status'] {
  const s = String(raw || '')
  if (s === 'done' || s === 'failed' || s === 'unavailable') return s
  return 'failed'
}

export function createProfileOcrClient(options: ProfileOcrClientOptions = {}) {
  const baseUrl = (options.baseUrl || defaultBaseUrl()).replace(/\/$/, '')
  const fetchImpl = options.fetchImpl || fetch

  async function recognize(
    kind: RecognizeKind,
    file: File | Blob,
    filename?: string,
  ): Promise<OcrRecognizeResult> {
    const form = new FormData()
    form.append('kind', kind)
    const name =
      filename || (file instanceof File && file.name ? file.name : 'document.jpg')
    form.append('file', file, name)

    try {
      const res = await fetchImpl(`${baseUrl}/v1/recognize`, {
        method: 'POST',
        body: form,
      })

      let body: Record<string, unknown> | null = null
      try {
        body = (await res.json()) as Record<string, unknown>
      } catch {
        body = null
      }

      if (!res.ok) {
        const err =
          (body && (body.detail || body.error) != null
            ? String(body.detail || body.error)
            : '') || `HTTP ${res.status}`
        return {
          kind,
          status: res.status === 503 ? 'unavailable' : 'failed',
          mapped: asMapped(body?.mapped),
          raw: (body?.raw as Record<string, unknown>) || body || {},
          error: err,
        }
      }

      return {
        kind: (body?.kind as RecognizeKind) || kind,
        status: normalizeStatus(body?.status),
        mapped: asMapped(body?.mapped),
        raw: (body?.raw as Record<string, unknown>) || {},
        error: body?.error != null ? String(body.error) : null,
      }
    } catch (err) {
      return {
        kind,
        status: 'failed',
        mapped: {},
        raw: {},
        error: err instanceof Error ? err.message : String(err || 'network error'),
      }
    }
  }

  async function health(): Promise<unknown> {
    const res = await fetchImpl(`${baseUrl}/health`)
    return res.json()
  }

  return { baseUrl, recognize, health }
}

export type ProfileOcrClient = ReturnType<typeof createProfileOcrClient>
