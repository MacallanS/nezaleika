import { describe, expect, it } from 'vitest'
import { canSupportRejectActivationStep } from './staffProfileRejectActions'

describe('canSupportRejectActivationStep', () => {
  it('allows review and done even without content flag', () => {
    expect(canSupportRejectActivationStep('review', false)).toBe(true)
    expect(canSupportRejectActivationStep('done', false)).toBe(true)
  })

  it('allows empty when section has partial content', () => {
    expect(canSupportRejectActivationStep('empty', true)).toBe(true)
  })

  it('allows partial status without content flag', () => {
    expect(canSupportRejectActivationStep('partial', false)).toBe(true)
  })

  it('blocks empty without content and already rejected', () => {
    expect(canSupportRejectActivationStep('empty', false)).toBe(false)
    expect(canSupportRejectActivationStep('error', true)).toBe(false)
    expect(canSupportRejectActivationStep(null, true)).toBe(true)
  })
})
