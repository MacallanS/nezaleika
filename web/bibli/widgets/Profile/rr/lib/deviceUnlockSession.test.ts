import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import {
  DEVICE_UNLOCK_GRACE_MS,
  clearDeviceUnlockSession,
  isDeviceUnlockSessionActive,
  isDeviceUnlockStepUpDone,
  markDeviceUnlockSession,
  markDeviceUnlockStepUp,
} from './deviceUnlockSession'

describe('deviceUnlockSession', () => {
  const localStore = new Map<string, string>()
  const sessionStore = new Map<string, string>()

  function makeStorage(store: Map<string, string>) {
    return {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
      removeItem: (key: string) => {
        store.delete(key)
      },
      clear: () => {
        store.clear()
      },
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      get length() {
        return store.size
      },
    }
  }

  beforeEach(() => {
    localStore.clear()
    sessionStore.clear()
    vi.stubGlobal('localStorage', makeStorage(localStore))
    vi.stubGlobal('sessionStorage', makeStorage(sessionStore))
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('mark → active within grace', () => {
    markDeviceUnlockSession()
    expect(isDeviceUnlockSessionActive()).toBe(true)
  })

  it('после сдвига времени > grace → inactive и очистка ключа', () => {
    markDeviceUnlockSession()
    expect(localStore.has('device_unlock_session_v2')).toBe(true)

    vi.setSystemTime(Date.now() + DEVICE_UNLOCK_GRACE_MS + 1)

    expect(isDeviceUnlockSessionActive()).toBe(false)
    expect(localStore.has('device_unlock_session_v2')).toBe(false)
  })

  it('clear снимает ключ и step-up', () => {
    markDeviceUnlockSession()
    markDeviceUnlockStepUp('/profile/security/password')
    expect(isDeviceUnlockStepUpDone('/profile/security/password')).toBe(true)

    clearDeviceUnlockSession()

    expect(isDeviceUnlockSessionActive()).toBe(false)
    expect(localStore.has('device_unlock_session_v2')).toBe(false)
    expect(isDeviceUnlockStepUpDone('/profile/security/password')).toBe(false)
  })

  it('step-up независимо от grace', () => {
    markDeviceUnlockStepUp('/profile/security/password')
    expect(isDeviceUnlockSessionActive()).toBe(false)
    expect(isDeviceUnlockStepUpDone('/profile/security/password')).toBe(true)
  })

  it('legacy sessionStorage флаг не считается валидным unlock', () => {
    sessionStore.set('device_unlock_session_ok', '1')
    expect(isDeviceUnlockSessionActive()).toBe(false)
  })

  it('битый JSON → inactive и очистка', () => {
    localStore.set('device_unlock_session_v2', '{not-json')
    expect(isDeviceUnlockSessionActive()).toBe(false)
    expect(localStore.has('device_unlock_session_v2')).toBe(false)
  })

  it('expiresAt в далёком будущем clamp’ится до now+grace', () => {
    const farFuture = Date.now() + DEVICE_UNLOCK_GRACE_MS * 10
    localStore.set(
      'device_unlock_session_v2',
      JSON.stringify({ expiresAt: farFuture }),
    )

    expect(isDeviceUnlockSessionActive()).toBe(true)

    const stored = JSON.parse(localStore.get('device_unlock_session_v2')!) as {
      expiresAt: number
    }
    expect(stored.expiresAt).toBe(Date.now() + DEVICE_UNLOCK_GRACE_MS)
  })

  it('mark снимает legacy sessionStorage флаг', () => {
    sessionStore.set('device_unlock_session_ok', '1')
    markDeviceUnlockSession()
    expect(sessionStore.has('device_unlock_session_ok')).toBe(false)
    expect(isDeviceUnlockSessionActive()).toBe(true)
  })
})
