import { describe, expect, it } from 'vitest'
import {
  resolveStaffFieldRoleLabel,
  resolveStaffLocationLabel,
} from './staffProfileFormat'

describe('resolveStaffLocationLabel field roles', () => {
  it('inserts СВ between project and city', () => {
    expect(
      resolveStaffLocationLabel({
        core_field_role: 'supervisor',
        attached: {
          projects: [{ id: 1, name: 'БАТ' }],
          points: [{ name: 'Екатеринбург', city: 'Екатеринбург', project_id: 1 }],
        },
      }),
    ).toBe('БАТ · СВ · Екатеринбург')
  })

  it('inserts Консультант for promoter', () => {
    expect(
      resolveStaffLocationLabel({
        core_field_role: 'promoter',
        core_field_role_label: 'Консультант',
        attached: {
          projects: [{ id: 1, name: 'БАТ' }],
        },
        referal: { name: 'Екатеринбург', project: { name: 'БАТ' } },
      }),
    ).toBe('БАТ · Консультант · Екатеринбург')
  })

  it('keeps project · city without field role', () => {
    expect(
      resolveStaffLocationLabel({
        attached: {
          projects: [{ id: 1, name: 'БАТ' }],
          points: [{ city: 'Екатеринбург', project_id: 1 }],
        },
      }),
    ).toBe('БАТ · Екатеринбург')
  })

  it('resolveStaffFieldRoleLabel shortens hire labels', () => {
    expect(resolveStaffFieldRoleLabel({ core_field_role: 'supervisor' })).toBe('СВ')
    expect(
      resolveStaffFieldRoleLabel({ core_field_role_label: 'Супервайзер (СВ)' }),
    ).toBe('СВ')
    expect(resolveStaffFieldRoleLabel({ core_field_role: 'promoter' })).toBe(
      'Консультант',
    )
  })
})
