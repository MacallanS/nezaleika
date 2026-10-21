/** CRM / platform-service switcher helpers (Core is SoT for registry). */

export type CrmId = string

export type PlatformServiceDto = {
  external_id: string
  code: string
  name: string
  url?: string | null
  url_dev?: string | null
  url_prod?: string | null
  logo_url?: string | null
  sort_order?: number
  is_active?: boolean
}

export const CRM_FULL_ACCESS_ROLE_KEYS = [
  'ADMIN',
  'DIRECTOR',
  'ACCOUNT_DIRECTOR',
  'SUPPORT_HEAD',
  'SUPPORT_SUPERVISOR',
  'SUPPORT_MANAGER',
  'Analitic',
  'ANALYST',
] as const

export const ALL_PROJECTS_OPTION_ID = '__all__'

/** Fallback colors when Core service has no custom branding in the tile. */
export const CRM_FALLBACK_COLORS: Record<string, string> = {
  fintech: '#5B7DEC',
  sklad: '#FA6B00',
  podbor: '#5CDBD5',
  registry: '#783BF3',
}

export function isDevCrmHost(hostname?: string): boolean {
  const host =
    hostname ||
    (typeof window !== 'undefined' ? window.location.hostname : '')
  return /(^|\.)dev\./i.test(host) || host === 'localhost' || host === '127.0.0.1'
}

export function resolveServiceUrl(
  service: PlatformServiceDto,
  options?: { hostname?: string; forceDev?: boolean },
): string {
  const useDev = options?.forceDev ?? isDevCrmHost(options?.hostname)
  const fromResolved = (service.url || '').trim()
  if (fromResolved) return fromResolved.replace(/\/$/, '')
  const raw = useDev ? service.url_dev : service.url_prod
  const url = (raw || '').trim()
  return url ? url.replace(/\/$/, '') : ''
}

export function roleSeesAllCrms(roleKey: string | null | undefined): boolean {
  if (!roleKey) return false
  const key = String(roleKey).trim().toUpperCase()
  return (CRM_FULL_ACCESS_ROLE_KEYS as readonly string[]).some(
    (k) => k.toUpperCase() === key,
  )
}

/**
 * Кнопка «Все сервисы» в RR-навигации.
 * Сейчас только ADMIN; позже — все роли выше руководителя группы.
 */
export function roleSeesServicesMenu(roleKey: string | null | undefined): boolean {
  if (!roleKey) return false
  return String(roleKey).trim().toUpperCase() === 'ADMIN'
}

export function isRecruiterRole(roleKey: string | null | undefined): boolean {
  if (!roleKey) return false
  const key = String(roleKey).trim().toUpperCase()
  return key === 'HR_COMPANION' || key === 'HR_LEAD' || key === 'RECRUITER'
}

/**
 * Visible service codes for the user.
 * - full-access roles (admin / director / account director / …) → all active services
 * - recruiter → fintech only
 * - others → intersection with projectServiceCodes
 * - sklad on project always implies fintech access
 */
export function filterVisibleServiceCodes(
  roleKey: string | null | undefined,
  registryCodes: string[],
  projectServiceCodes?: string[] | null,
): string[] {
  const registry = registryCodes.map((c) => c.toLowerCase())
  if (roleSeesAllCrms(roleKey)) {
    return registry
  }
  if (isRecruiterRole(roleKey)) {
    return registry.includes('fintech') ? ['fintech'] : []
  }
  const attached = (projectServiceCodes || [])
    .map((c) => String(c).toLowerCase().trim())
    .filter(Boolean)
  if (attached.length === 0) {
    return registry.includes('fintech') ? ['fintech'] : []
  }
  const visible = registry.filter((code) => attached.includes(code))
  // Склад → Финтех: любой проект со складом открывает Fintech в свитчере.
  if (
    attached.includes('sklad') &&
    registry.includes('fintech') &&
    !visible.includes('fintech')
  ) {
    visible.push('fintech')
  }
  return visible
}

export type CrmServiceTile = {
  id: string
  label: string
  color: string
  icon?: string
  href?: string
  disabled?: boolean
  current?: boolean
}

export function buildCrmServiceTiles(options: {
  roleKey: string | null | undefined
  services: PlatformServiceDto[]
  projectServiceCodes?: string[] | null
  currentCrm: string
  hostname?: string
}): CrmServiceTile[] {
  const registryCodes = options.services.map((s) => s.code)
  const visible = new Set(
    filterVisibleServiceCodes(options.roleKey, registryCodes, options.projectServiceCodes),
  )

  return options.services
    .filter((s) => visible.has(String(s.code).toLowerCase()))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name))
    .map((s) => {
      const code = String(s.code).toLowerCase()
      const href = resolveServiceUrl(s, { hostname: options.hostname })
      const current = code === String(options.currentCrm).toLowerCase()
      return {
        id: code,
        label: s.name,
        color: CRM_FALLBACK_COLORS[code] || '#64748B',
        icon: s.logo_url || undefined,
        href: href || undefined,
        disabled: !current && !href,
        current,
      }
    })
}

/** Static fallback registry when Core is unreachable (dev bootstrap). */
export function defaultPlatformServices(hostname?: string): PlatformServiceDto[] {
  const useDev = isDevCrmHost(hostname)
  return [
    {
      external_id: 'fintech',
      code: 'fintech',
      name: 'Финтех',
      url_dev: 'https://dev.fintech.rusaifin.ru',
      url_prod: 'https://fintech.rusaifin.ru',
      url: useDev ? 'https://dev.fintech.rusaifin.ru' : 'https://fintech.rusaifin.ru',
      sort_order: 10,
    },
    {
      external_id: 'sklad',
      code: 'sklad',
      name: 'Склад',
      url_dev: 'https://dev.rusaisklad.ru',
      url_prod: 'https://rusaisklad.ru',
      url: useDev ? 'https://dev.rusaisklad.ru' : 'https://rusaisklad.ru',
      sort_order: 20,
    },
    {
      external_id: 'podbor',
      code: 'podbor',
      name: 'Подбор',
      url_dev: 'https://dev.rusaipodbor.ru',
      url_prod: 'https://rusaipodbor.ru',
      url: useDev ? 'https://dev.rusaipodbor.ru' : 'https://rusaipodbor.ru',
      sort_order: 30,
    },
    {
      external_id: 'registry',
      code: 'registry',
      name: 'Реестр',
      // Same-origin spa route inside fintech; tile href is filled by applyFintechRegistryTile.
      url_dev: 'https://dev.fintech.rusaifin.ru/cards/',
      url_prod: 'https://fintech.rusaifin.ru/cards/',
      url: useDev
        ? 'https://dev.fintech.rusaifin.ru/cards/'
        : 'https://fintech.rusaifin.ru/cards/',
      sort_order: 40,
    },
  ]
}
