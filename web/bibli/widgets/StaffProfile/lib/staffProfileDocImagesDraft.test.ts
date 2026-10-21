import { describe, expect, it, vi } from 'vitest'
import {
  resolveStaffDocImageDisplayUrl,
  revokeStaffDocPendingPreviews,
} from './staffProfileDocImagesDraft'

describe('resolveStaffDocImageDisplayUrl', () => {
  it('prefers pending local preview', () => {
    expect(
      resolveStaffDocImageDisplayUrl({
        key: 'passport',
        serverUrl: 'https://cdn/old.jpg',
        hiddenKeys: ['passport'],
        pendingPreviewByKey: { passport: 'blob:pending' },
      }),
    ).toBe('blob:pending')
  })

  it('returns empty url for removed slot without pending', () => {
    expect(
      resolveStaffDocImageDisplayUrl({
        key: 'passport',
        serverUrl: 'https://cdn/old.jpg',
        hiddenKeys: ['passport'],
        pendingPreviewByKey: {},
      }),
    ).toBe('')
  })

  it('keeps empty server slot visible as empty string', () => {
    expect(
      resolveStaffDocImageDisplayUrl({
        key: 'registration',
        serverUrl: '',
        hiddenKeys: [],
        pendingPreviewByKey: {},
      }),
    ).toBe('')
  })

  it('falls back to server url', () => {
    expect(
      resolveStaffDocImageDisplayUrl({
        key: 'inn',
        serverUrl: 'https://cdn/inn.jpg',
        hiddenKeys: [],
        pendingPreviewByKey: {},
      }),
    ).toBe('https://cdn/inn.jpg')
  })
})

describe('revokeStaffDocPendingPreviews', () => {
  it('revokes object urls and clears keys', () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const next = revokeStaffDocPendingPreviews({
      passport: 'blob:a',
      inn: 'blob:b',
    })
    expect(next).toEqual({})
    expect(revoke).toHaveBeenCalledWith('blob:a')
    expect(revoke).toHaveBeenCalledWith('blob:b')
    revoke.mockRestore()
  })
})
