import { describe, expect, it } from 'vitest'
import {
  buildStaffProfileNavOptionsFromLegacyQuery,
  buildStaffProfileUrl,
  resolveStaffProfileBack,
} from './staffProfileNavigation'

describe('staffProfileNavigation', () => {
  it('builds staff profile url with query params', () => {
    expect(
      buildStaffProfileUrl(42, {
        from: 'agents',
        tab: 'documents',
        doc: 'passport',
      }),
    ).toBe('/staff/42?from=agents&tab=documents&doc=passport')
  })

  it('resolves back target from source', () => {
    expect(resolveStaffProfileBack('onec')).toEqual({
      title: '1С',
      path: '/onboarding/onec',
    })
    expect(resolveStaffProfileBack('onboarding')).toEqual({
      title: 'Оформление',
      path: '/onboarding',
    })
    expect(resolveStaffProfileBack('agents')).toEqual({
      title: 'Сотрудники',
      path: '/agents',
    })
  })

  it('maps legacy onboarding open query to staff profile options', () => {
    expect(
      buildStaffProfileNavOptionsFromLegacyQuery({ open: '7', focus: 'onec' }),
    ).toEqual({
      from: 'onboarding',
      tab: 'onec',
    })
  })
})
