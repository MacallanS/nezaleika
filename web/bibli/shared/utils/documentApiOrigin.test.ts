import { describe, expect, it } from 'vitest'
import {
  DOCUMENT_API_ORIGIN,
  buildDocumentPreviewCandidates,
  extractDocumentCode,
  getAbsoluteDocumentAvatarUrl,
  getAbsoluteDocumentUrl,
  resolveDocumentApiOrigin,
  resolveDocumentApiOriginFromHost,
} from './documentApiOrigin'

describe('documentApiOrigin', () => {
  it('maps frontend hosts to storage origins', () => {
    expect(resolveDocumentApiOriginFromHost('fintech.rusaifin.ru')).toBe(DOCUMENT_API_ORIGIN.prod)
    expect(resolveDocumentApiOriginFromHost('dev.fintech.rusaifin.ru')).toBe(DOCUMENT_API_ORIGIN.dev)
    expect(resolveDocumentApiOriginFromHost('yandex.fintech.rusaifin.ru')).toBe(
      DOCUMENT_API_ORIGIN.yandex,
    )
    expect(resolveDocumentApiOriginFromHost('localhost', { isDev: true })).toBe(
      DOCUMENT_API_ORIGIN.dev,
    )
  })

  it('builds absolute document urls from codes', () => {
    expect(
      getAbsoluteDocumentUrl('abc123', { hostname: 'fintech.rusaifin.ru' }),
    ).toBe(`${DOCUMENT_API_ORIGIN.prod}/document/abc123`)
  })

  it('builds absolute avatar thumb urls', () => {
    expect(
      getAbsoluteDocumentAvatarUrl('abc123', 96, { hostname: 'fintech.rusaifin.ru' }),
    ).toBe(`${DOCUMENT_API_ORIGIN.prod}/document/abc123/thumb?size=96`)
    expect(
      getAbsoluteDocumentAvatarUrl('/document/xyz', 192, { hostname: 'dev.fintech.rusaifin.ru' }),
    ).toBe(`${DOCUMENT_API_ORIGIN.dev}/document/xyz/thumb?size=192`)
    expect(getAbsoluteDocumentAvatarUrl(null)).toBe('')
  })

  it('extracts codes from proxy and path urls', () => {
    expect(extractDocumentCode('/document/abc123')).toBe('abc123')
    expect(
      extractDocumentCode(
        `https://localhost/document-proxy?url=${encodeURIComponent(`${DOCUMENT_API_ORIGIN.dev}/document/xyz`)}`,
      ),
    ).toBe('xyz')
  })

  it('builds preview candidates with proxy first on local dev frontend', () => {
    const prev = globalThis.window
    // @ts-expect-error test stub
    globalThis.window = {
      location: { origin: 'http://127.0.0.1:3000', hostname: '127.0.0.1' },
    }
    try {
      const list = buildDocumentPreviewCandidates('abc123', {
        hostname: '127.0.0.1',
        isDev: true,
      })
      expect(list[0]).toContain('/document-proxy?url=')
      expect(list.some((u) => u.includes('/document-proxy?url='))).toBe(true)
      expect(list).toContain(`${DOCUMENT_API_ORIGIN.dev}/document/abc123`)
    } finally {
      // @ts-expect-error restore
      globalThis.window = prev
    }
  })

  it('builds preview candidates with raw first on storage host', () => {
    const prev = globalThis.window
    const abs = `${DOCUMENT_API_ORIGIN.dev}/document/abc123`
    // @ts-expect-error test stub
    globalThis.window = {
      location: { origin: DOCUMENT_API_ORIGIN.dev, hostname: 'dev.server.rusaifin.ru' },
    }
    try {
      const list = buildDocumentPreviewCandidates(abs, {
        hostname: 'dev.server.rusaifin.ru',
        isDev: true,
      })
      expect(list[0]).toBe(abs)
      expect(list.some((u) => u.includes('/document-proxy?url='))).toBe(true)
    } finally {
      // @ts-expect-error restore
      globalThis.window = prev
    }
  })

  it('falls back by isDev when host unknown', () => {
    expect(resolveDocumentApiOrigin({ hostname: '', isDev: true })).toBe(DOCUMENT_API_ORIGIN.dev)
    expect(resolveDocumentApiOrigin({ hostname: '', isDev: false })).toBe(DOCUMENT_API_ORIGIN.prod)
  })
})
