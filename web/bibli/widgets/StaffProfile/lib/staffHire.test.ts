import { describe, expect, it } from 'vitest'
import {
  buildFieldRoleOptions,
  buildHirePrefill,
  buildHireRoleOptions,
  CORE_FIELD_ROLE_LABELS,
  filterProjectsForFieldRole,
  parseFieldRoleSelection,
  projectHasFieldRoles,
  roleNeedsPoints,
  roleNeedsProject,
} from './staffHire'

const ROLES = [
  { id: 1, name: 'Агент' },
  { id: 2, name: 'Руководитель группы' },
  { id: 3, name: 'Директор' },
  { id: 4, name: 'Support-менеджер' },
]

const PROJECTS = [
  { id: 10, name: 'BAT', core_field_roles: ['supervisor', 'promoter'] },
  { id: 20, name: 'Яндекс', core_field_roles: [] },
]

describe('staffHire helpers', () => {
  it('labels warehouse promoter as Консультант', () => {
    expect(CORE_FIELD_ROLE_LABELS.promoter).toBe('Консультант')
    expect(buildFieldRoleOptions(PROJECTS)).toEqual([
      { id: 'core:supervisor', name: 'Супервайзер (СВ)' },
      { id: 'core:promoter', name: 'Консультант' },
    ])
  })

  it('parses virtual field-role selection ids', () => {
    expect(parseFieldRoleSelection('core:promoter')).toBe('promoter')
    expect(parseFieldRoleSelection('12')).toBeNull()
  })

  it('detects warehouse referral project', () => {
    expect(projectHasFieldRoles(PROJECTS, 10)).toBe(true)
    expect(projectHasFieldRoles(PROJECTS, 20)).toBe(false)
    expect(projectHasFieldRoles(PROJECTS, null)).toBe(false)
  })

  it('limits hire roles to warehouse options for BAT referral', () => {
    const options = buildHireRoleOptions({
      roles: ROLES,
      projects: PROJECTS,
      fieldRolesOnly: true,
    })
    expect(options.map((o) => o.id)).toEqual(['core:supervisor', 'core:promoter'])
  })

  it('includes all system roles plus field roles for normal hire', () => {
    const options = buildHireRoleOptions({
      roles: ROLES,
      projects: PROJECTS,
      fieldRolesOnly: false,
    })
    expect(options.map((o) => o.name)).toContain('Агент')
    expect(options.map((o) => o.name)).toContain('Директор')
    expect(options.map((o) => o.name)).toContain('Консультант')
  })

  it('filters projects by selected field role', () => {
    expect(filterProjectsForFieldRole(PROJECTS, 'promoter').map((p) => p.id)).toEqual([10])
    expect(filterProjectsForFieldRole(PROJECTS, null)).toHaveLength(2)
  })

  it('requires project for field role and points only for regular agent-like roles', () => {
    expect(roleNeedsProject(ROLES, 'core:supervisor')).toBe(true)
    expect(roleNeedsPoints(ROLES, 'core:supervisor')).toBe(false)
    expect(roleNeedsProject(ROLES, '1')).toBe(true)
    expect(roleNeedsPoints(ROLES, '1')).toBe(true)
    expect(roleNeedsPoints(ROLES, '4')).toBe(false)
  })

  it('prefills role/project/point from referral for fintech projects', () => {
    const prefill = buildHirePrefill({
      referal: {
        id: 99,
        role_id: 1,
        project_id: 20,
        project: { id: 20, name: 'Яндекс' },
        name: 'Домодедово',
      },
      roles: ROLES,
      projects: PROJECTS,
    })
    expect(prefill).toEqual({
      roleSelection: '1',
      projectId: '20',
      pointIds: ['99'],
      fieldRolesOnly: false,
    })
  })

  it('does not prefill Agent for warehouse referral — support picks СВ/консультант', () => {
    const prefill = buildHirePrefill({
      referal: {
        id: 55,
        project_id: 10,
        project: { id: 10, name: 'BAT' },
        name: 'Склад',
      },
      roles: ROLES,
      projects: PROJECTS,
    })
    expect(prefill.roleSelection).toBe('')
    expect(prefill.projectId).toBe('10')
    expect(prefill.pointIds).toEqual(['55'])
    expect(prefill.fieldRolesOnly).toBe(true)
  })

  it('falls back to Agent when referral has no role on a non-warehouse project', () => {
    const prefill = buildHirePrefill({
      referal: {
        id: 7,
        project_id: 20,
        project: { id: 20, name: 'Яндекс' },
      },
      roles: ROLES,
      projects: PROJECTS,
    })
    expect(prefill.roleSelection).toBe('1')
    expect(prefill.fieldRolesOnly).toBe(false)
  })
})
