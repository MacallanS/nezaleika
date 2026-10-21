import { describe, expect, it, beforeEach } from 'vitest'
import {
  clearRememberedProfilePhotos,
  peekRememberedProfilePhotos,
  rememberProfilePhotoKind,
  rememberProfilePhotos,
} from './profilePhotosSnapshot'

describe('profilePhotosSnapshot', () => {
  beforeEach(() => {
    clearRememberedProfilePhotos()
  })

  it('remembers full map and peeks sync', () => {
    rememberProfilePhotos({
      inn: { kind: 'inn', code: 'abc', url: '/u' },
      snils: null,
    })
    expect(peekRememberedProfilePhotos()?.inn?.code).toBe('abc')
    expect(peekRememberedProfilePhotos()?.snils).toBeNull()
  })

  it('patches a single kind without wiping others', () => {
    rememberProfilePhotos({
      inn: { kind: 'inn', code: 'a', url: '/a' },
      snils: { kind: 'snils', code: 'b', url: '/b' },
    })
    rememberProfilePhotoKind('inn', { kind: 'inn', code: 'c', url: '/c' })
    expect(peekRememberedProfilePhotos()?.inn?.code).toBe('c')
    expect(peekRememberedProfilePhotos()?.snils?.code).toBe('b')
  })

  it('clears snapshot', () => {
    rememberProfilePhotos({ inn: { kind: 'inn', code: 'x', url: '/x' } })
    clearRememberedProfilePhotos()
    expect(peekRememberedProfilePhotos()).toBeNull()
  })
})
