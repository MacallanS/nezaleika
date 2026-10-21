import { describe, expect, it, beforeEach } from 'vitest'
import { ref } from 'vue'
import {
  applyWizardActivationGate,
  seedWizardActivationGate,
} from './wizardActivationContext'
import {
  activationStepStatuses,
  resetActivationStatuses,
} from './activationStatusSync'

describe('wizardActivationContext', () => {
  beforeEach(() => {
    resetActivationStatuses()
  })

  it('seeds viewOnly from hub when step is done', () => {
    activationStepStatuses.personal = 'done'
    const stepStatus = ref('')
    const viewOnly = ref(false)

    seedWizardActivationGate('personal', { stepStatus, viewOnly })

    expect(stepStatus.value).toBe('done')
    expect(viewOnly.value).toBe(true)
  })

  it('seeds viewOnly from hub when step is on review', () => {
    activationStepStatuses.inn = 'review'
    const stepStatus = ref('')
    const viewOnly = ref(false)

    seedWizardActivationGate('inn', { stepStatus, viewOnly })

    expect(viewOnly.value).toBe(true)
  })

  it('keeps editable when hub status is error', () => {
    activationStepStatuses.passport = 'error'
    const stepStatus = ref('')
    const viewOnly = ref(false)

    seedWizardActivationGate('passport', { stepStatus, viewOnly })

    expect(viewOnly.value).toBe(false)
  })

  it('falls back to hub status when activation API has no steps', () => {
    activationStepStatuses.bank = 'done'
    const stepStatus = ref('')
    const viewOnly = ref(false)
    const stepRejection = ref(null)

    applyWizardActivationGate(
      { data: { name: 'Test' } },
      { data: { complete: true } },
      'bank',
      { stepStatus, viewOnly, stepRejection },
    )

    expect(stepStatus.value).toBe('done')
    expect(viewOnly.value).toBe(true)
  })

  it('prefers API status over hub when present', () => {
    activationStepStatuses.snils = 'done'
    const stepStatus = ref('')
    const viewOnly = ref(false)
    const stepRejection = ref(null)

    applyWizardActivationGate(
      null,
      { data: { steps: { snils: 'error' } } },
      'snils',
      { stepStatus, viewOnly, stepRejection },
    )

    expect(stepStatus.value).toBe('error')
    expect(viewOnly.value).toBe(false)
  })
})
