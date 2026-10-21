import { describe, expect, it, vi } from 'vitest'
import {
  EMPTY_ACTIVATION_STATUSES,
  type ActivationStepsMap,
} from './activationSteps'
import {
  AGENT_TYPE_IE,
  AGENT_TYPE_SELF_EMPLOYED,
  agentTypeChoicePath,
  ieWizardPath,
  seWizardPath,
  IE_WIZARD_TOTAL,
  SE_WIZARD_TOTAL,
} from './agentTypeWizard'
import { openActivationStep, resolveActivationStepIdFromPath } from './openActivationStep'

describe('resolveActivationStepIdFromPath', () => {
  it('resolves hub and wizard paths', () => {
    expect(resolveActivationStepIdFromPath('/profile/passport')).toBe('passport')
    expect(resolveActivationStepIdFromPath('/profile/passport/1')).toBe('passport')
    expect(resolveActivationStepIdFromPath('/profile/personal/5')).toBe('personal')
    expect(resolveActivationStepIdFromPath('/profile/agent-type/ie/3')).toBe('agent-type')
    expect(resolveActivationStepIdFromPath('/profile/bank/')).toBe('bank')
  })

  it('ignores unrelated profile paths', () => {
    expect(resolveActivationStepIdFromPath('/profile')).toBeNull()
    expect(resolveActivationStepIdFromPath('/profile/security')).toBeNull()
    expect(resolveActivationStepIdFromPath('/profile/about')).toBeNull()
  })
})

describe('openActivationStep agent-type', () => {
  function statuses(
    agentType: ActivationStepsMap['agent-type'],
  ): ActivationStepsMap {
    return { ...EMPTY_ACTIVATION_STATUSES, 'agent-type': agentType }
  }

  it('opens choice page after rejection (error)', () => {
    const navigateTo = vi.fn()
    openActivationStep('agent-type', {
      navigateTo,
      stepStatuses: statuses('error'),
      accountType: AGENT_TYPE_IE,
      returnPath: '/profile',
    })
    expect(navigateTo).toHaveBeenCalledWith(agentTypeChoicePath())
  })

  it('opens choice page when empty or partial', () => {
    const navigateTo = vi.fn()
    openActivationStep('agent-type', {
      navigateTo,
      stepStatuses: statuses('empty'),
      returnPath: '/profile',
    })
    expect(navigateTo).toHaveBeenCalledWith(agentTypeChoicePath())

    navigateTo.mockClear()
    openActivationStep('agent-type', {
      navigateTo,
      stepStatuses: statuses('partial'),
      accountType: AGENT_TYPE_SELF_EMPLOYED,
      returnPath: '/profile',
    })
    expect(navigateTo).toHaveBeenCalledWith(agentTypeChoicePath())
  })

  it('opens IE review when locked as IE', () => {
    const navigateTo = vi.fn()
    openActivationStep('agent-type', {
      navigateTo,
      stepStatuses: statuses('review'),
      accountType: AGENT_TYPE_IE,
      returnPath: '/profile',
    })
    expect(navigateTo).toHaveBeenCalledWith(ieWizardPath(IE_WIZARD_TOTAL))
  })

  it('opens SE review when locked as self-employed', () => {
    const navigateTo = vi.fn()
    openActivationStep('agent-type', {
      navigateTo,
      stepStatuses: statuses('done'),
      accountType: AGENT_TYPE_SELF_EMPLOYED,
      returnPath: '/profile',
    })
    expect(navigateTo).toHaveBeenCalledWith(seWizardPath(SE_WIZARD_TOTAL))
  })
})
