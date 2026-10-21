import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  readPendingOtpEmail,
  resolveServerPendingOtpEmail,
  writePendingOtpEmail,
} from './personalWizard'

describe('personalWizard durable otp', () => {
  const local = new Map<string, string>()

  beforeEach(() => {
    local.clear()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => local.get(k) ?? null,
      setItem: (k: string, v: string) => local.set(k, v),
      removeItem: (k: string) => local.delete(k),
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

  it('persists otp email in durable storage', () => {
    writePendingOtpEmail('user@example.test', 7)
    expect(readPendingOtpEmail(7)).toBe('user@example.test')
  })

  it('resolveServerPendingOtpEmail ignores when email confirmed', () => {
    expect(
      resolveServerPendingOtpEmail({
        email: 'a@b.test',
        pending_email: 'c@d.test',
      }),
    ).toBe('')
  })

  it('resolveServerPendingOtpEmail returns pending when no email', () => {
    expect(
      resolveServerPendingOtpEmail({
        email: null,
        pending_email: 'pending@example.test',
      }),
    ).toBe('pending@example.test')
  })
})
