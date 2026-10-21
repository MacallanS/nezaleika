/** Pure helpers for permanent-hire role/project/point picker. */

export const CORE_FIELD_ROLE_LABELS: Record<string, string> = {
  supervisor: 'Супервайзер (СВ)',
  promoter: 'Консультант',
}

export const PROJECT_POINT_ROLES = [
  'Агент',
  'Support-руководитель',
  'Support-менеджер',
  'Руководитель проектов',
  'Региональный руководитель',
  'Руководитель группы',
] as const

export type HireRoleOption = { id: string; name: string }

export type HireProject = {
  id: number | string
  name?: string
  core_field_roles?: string[]
}

export type HireSystemRole = { id: number | string; name: string }

export type HireReferal = {
  id?: number | string | null
  role_id?: number | string | null
  role?: { id?: number | string | null } | null
  project_id?: number | string | null
  project?: { id?: number | string | null; name?: string | null } | null
  name?: string | null
  point?: { id?: number | string | null; name?: string | null } | null
} | null

export function parseFieldRoleSelection(selection: string | null | undefined): string | null {
  const s = String(selection || '')
  return s.startsWith('core:') ? s.slice(5) : null
}

export function collectAvailableFieldRoles(projects: HireProject[]): string[] {
  const set = new Set<string>()
  for (const p of projects) {
    for (const r of p?.core_field_roles || []) set.add(r)
  }
  return [...set]
}

export function buildFieldRoleOptions(projects: HireProject[]): HireRoleOption[] {
  return collectAvailableFieldRoles(projects).map((r) => ({
    id: `core:${r}`,
    name: CORE_FIELD_ROLE_LABELS[r] || r,
  }))
}

export function projectHasFieldRoles(
  projects: HireProject[],
  projectId: number | string | null | undefined,
): boolean {
  if (projectId == null || projectId === '') return false
  const p = projects.find((pr) => String(pr.id) === String(projectId))
  return (p?.core_field_roles || []).length > 0
}

export function buildHireRoleOptions(input: {
  roles: HireSystemRole[]
  projects: HireProject[]
  /** When referral points at a warehouse project — only field roles. */
  fieldRolesOnly?: boolean
}): HireRoleOption[] {
  const fieldOptions = buildFieldRoleOptions(input.projects)
  if (input.fieldRolesOnly) return fieldOptions
  return [
    ...input.roles
      .filter((r) => Boolean(r?.name))
      .map((r) => ({ id: String(r.id), name: r.name })),
    ...fieldOptions,
  ]
}

export function filterProjectsForFieldRole(
  projects: HireProject[],
  fieldRole: string | null,
): HireProject[] {
  if (!fieldRole) return projects
  return projects.filter((p) => (p?.core_field_roles || []).includes(fieldRole))
}

export function roleNeedsProject(
  roles: HireSystemRole[],
  selection: string | null | undefined,
): boolean {
  const fieldRole = parseFieldRoleSelection(selection)
  if (fieldRole) return true
  if (!selection) return false
  const role = roles.find((r) => String(r.id) === String(selection))
  return Boolean(role && PROJECT_POINT_ROLES.includes(role.name as (typeof PROJECT_POINT_ROLES)[number]))
}

export function roleNeedsPoints(
  roles: HireSystemRole[],
  selection: string | null | undefined,
): boolean {
  const fieldRole = parseFieldRoleSelection(selection)
  if (fieldRole) return false
  if (!selection) return false
  const role = roles.find((r) => String(r.id) === String(selection))
  if (!role) return false
  if (role.name === 'Support-менеджер') return false
  return PROJECT_POINT_ROLES.includes(role.name as (typeof PROJECT_POINT_ROLES)[number])
}

export function findAgentRoleId(roles: HireSystemRole[]): string | null {
  const agent = roles.find((r) => r?.name && r.name.toLowerCase().includes('агент'))
  return agent ? String(agent.id) : null
}

export function getReferalProjectId(referal: HireReferal): string | null {
  if (!referal) return null
  const id = referal.project_id ?? referal.project?.id ?? null
  return id != null && id !== '' ? String(id) : null
}

export function getReferalPointId(referal: HireReferal): string | null {
  if (!referal) return null
  const id = referal.point?.id ?? referal.id ?? null
  return id != null && id !== '' ? String(id) : null
}

export function getReferalRoleId(referal: HireReferal): string | null {
  if (!referal) return null
  const id = referal.role_id ?? referal.role?.id ?? null
  return id != null && id !== '' ? String(id) : null
}

export function getReferalPointName(referal: HireReferal): string {
  if (!referal) return 'Точка из рефералки'
  return (
    (typeof referal.point?.name === 'string' && referal.point.name.trim()) ||
    (typeof referal.name === 'string' && referal.name.trim()) ||
    'Точка из рефералки'
  )
}

export type HirePrefill = {
  roleSelection: string
  projectId: string
  pointIds: string[]
  /** When true, role dropdown should list only warehouse roles. */
  fieldRolesOnly: boolean
}

/**
 * Prefill hire form from referral. For BAT/warehouse projects role is left empty
 * so support picks Супервайзер / Консультант (referral does not encode field role).
 */
export function buildHirePrefill(input: {
  referal: HireReferal
  roles: HireSystemRole[]
  projects: HireProject[]
}): HirePrefill {
  const referal = input.referal
  const referalProjectId = getReferalProjectId(referal)
  const referalPointId = getReferalPointId(referal)
  const referalRoleId = getReferalRoleId(referal)
  const fieldRolesOnly = projectHasFieldRoles(input.projects, referalProjectId)

  let roleSelection = ''
  if (referalRoleId) {
    roleSelection = referalRoleId
  } else if (referal && !fieldRolesOnly) {
    roleSelection = findAgentRoleId(input.roles) || ''
  }

  return {
    roleSelection,
    projectId: referalProjectId || '',
    pointIds: referalPointId ? [referalPointId] : [],
    fieldRolesOnly,
  }
}
