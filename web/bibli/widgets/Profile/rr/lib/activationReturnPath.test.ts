import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import {
  activationSubmitExitPath,
  normalizeActivationReturnPath,
  rememberActivationReturnPath,
  readActivationReturnPath,
} from './activationReturnPath'
import { ACTIVATION_HUB_PATH } from './activationHubPath'

describe('activationReturnPath', () => {
  const local = new Map<string, string>()

  beforeEach(() => {
    local.clear()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => local.get(key) ?? null,
      setItem: (key: string, value: string) => {
        local.set(key, value)
      },
      removeItem: (key: string) => {
        local.delete(key)
      },
    })
    vi.stubGlobal('sessionStorage', {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('normalizes allowed hub paths', () => {
    expect(normalizeActivationReturnPath('/')).toBe('/')
    expect(normalizeActivationReturnPath('/profile/')).toBe('/profile')
    expect(normalizeActivationReturnPath('/profile/activation?x=1')).toBe(
      '/profile/activation',
    )
    expect(normalizeActivationReturnPath('/profile/passport/3')).toBe(null)
  })

  it('remembers and reads return path', () => {
    rememberActivationReturnPath('/profile/activation')
    expect(readActivationReturnPath()).toBe('/profile/activation')
  })

  it('falls back to activation hub', () => {
    expect(readActivationReturnPath()).toBe(ACTIVATION_HUB_PATH)
  })

  it('after submit on phone and tablet opens the activation list', () => {
    vi.stubGlobal('window', {
      matchMedia: (query: string) => ({ matches: query === '(max-width: 1024px)' }),
    })
    expect(activationSubmitExitPath()).toBe('/profile/activation')
  })

  it('after submit on desktop stays on /profile', () => {
    vi.stubGlobal('window', {
      matchMedia: () => ({ matches: false }),
    })
    expect(activationSubmitExitPath()).toBe('/profile')
  })

  it('after submit without window stays on /profile', () => {
    vi.stubGlobal('window', undefined)
    expect(activationSubmitExitPath()).toBe('/profile')
  })
})
