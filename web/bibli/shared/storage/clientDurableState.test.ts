import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  migrateFromSessionStorage,
  readDurable,
  readDurableString,
  removeDurable,
  writeDurable,
} from './clientDurableState'

describe('clientDurableState', () => {
  const local = new Map<string, string>()
  const session = new Map<string, string>()

  beforeEach(() => {
    local.clear()
    session.clear()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => local.get(k) ?? null,
      setItem: (k: string, v: string) => local.set(k, v),
      removeItem: (k: string) => local.delete(k),
    })
    vi.stubGlobal('sessionStorage', {
      getItem: (k: string) => session.get(k) ?? null,
      setItem: (k: string, v: string) => session.set(k, v),
      removeItem: (k: string) => session.delete(k),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('writes and reads with ttl', () => {
    writeDurable('test.key', 'hello', { ttlMs: 60_000, userId: 42 })
    expect(readDurableString('test.key', { userId: 42 })).toBe('hello')
  })

  it('expires stale values', () => {
    writeDurable('exp', 'x', { ttlMs: 1 })
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 10)
    expect(readDurable('exp')).toBeNull()
  })

  it('migrates from sessionStorage once', () => {
    session.set('legacy', 'from-session')
    expect(migrateFromSessionStorage('legacy', 'new.key')).toBe(true)
    expect(readDurableString('new.key')).toBe('from-session')
    expect(session.has('legacy')).toBe(false)
    session.set('legacy', 'again')
    expect(migrateFromSessionStorage('legacy', 'new.key')).toBe(false)
  })

  it('removeDurable clears key', () => {
    writeDurable('rm', '1')
    removeDurable('rm')
    expect(readDurable('rm')).toBeNull()
  })
})
