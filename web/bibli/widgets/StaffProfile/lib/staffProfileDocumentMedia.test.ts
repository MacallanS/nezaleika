import { describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/api/http/authenticatedFetch', () => ({
  authenticatedFetch: vi.fn(),
}))

import { classifyStaffDocumentBlob, pdfFrameSrc } from './staffProfileDocumentMedia'

function pdfBlob(): Blob {
  const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34])
  return new Blob([bytes], { type: 'image/jpeg' })
}

describe('classifyStaffDocumentBlob', () => {
  it('detects PDF by magic even when MIME is image/jpeg', async () => {
    expect(await classifyStaffDocumentBlob(pdfBlob())).toBe('pdf')
  })

  it('detects PDF by application/pdf MIME', async () => {
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46])
    expect(await classifyStaffDocumentBlob(new Blob([bytes], { type: 'application/pdf' }))).toBe('pdf')
  })

  it('treats JPEG with UTF-8 BOM as image via MIME', async () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, 0xff, 0xd8, 0xff, 0xe0])
    expect(await classifyStaffDocumentBlob(new Blob([bytes], { type: 'image/jpeg' }))).toBe('image')
  })
})

describe('ensureTypedDocumentBlob', () => {
  it('strips UTF-8 BOM from JPEG blobs', async () => {
    const { ensureTypedDocumentBlob } = await import('./staffProfileDocumentMedia')
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, 0xff, 0xd8, 0xff, 0xe0])
    const cleaned = await ensureTypedDocumentBlob(
      new Blob([bytes], { type: 'image/jpeg' }),
      'image',
    )
    const head = new Uint8Array(await cleaned.slice(0, 3).arrayBuffer())
    expect(Array.from(head)).toEqual([0xff, 0xd8, 0xff])
  })
})

describe('pdfFrameSrc', () => {
  it('hides viewer chrome for thumb mode', () => {
    expect(pdfFrameSrc('https://example.test/doc.pdf', { mode: 'thumb' })).toBe(
      'https://example.test/doc.pdf#toolbar=0&navpanes=0&scrollbar=0&view=FitH',
    )
  })

  it('keeps FitH for http preview', () => {
    expect(pdfFrameSrc('https://example.test/doc.pdf')).toBe('https://example.test/doc.pdf#view=FitH')
  })
})
