import type { ActivationStepId } from 'bibli/widgets/Profile/rr/lib/activationSteps'
import {
  isStaffProfileDocId,
  isStaffProfileTabId,
  type StaffProfileFrom,
  type StaffProfileTabId,
} from './staffProfileTabs'

export interface StaffProfileNavOptions {
  from?: StaffProfileFrom
  tab?: StaffProfileTabId | string
  doc?: ActivationStepId | string
}

export function resolveStaffProfileBack(from: string | null | undefined): {
  title: string
  path: string
} {
  switch (from) {
    case 'onec':
      return { title: '1С', path: '/onboarding/onec' }
    case 'onboarding':
      return { title: 'Оформление', path: '/onboarding' }
    case 'agents':
    default:
      return { title: 'Сотрудники', path: '/agents' }
  }
}

export function buildStaffProfileUrl(
  id: number | string,
  opts: StaffProfileNavOptions = {},
): string {
  const params = new URLSearchParams()

  if (opts.from) {
    params.set('from', opts.from)
  }
  if (opts.tab && isStaffProfileTabId(String(opts.tab))) {
    params.set('tab', String(opts.tab))
  }
  if (opts.doc && isStaffProfileDocId(String(opts.doc))) {
    params.set('doc', String(opts.doc))
  }

  const query = params.toString()
  return query ? `/staff/${id}?${query}` : `/staff/${id}`
}

export function buildStaffProfileNavOptionsFromLegacyQuery(query: Record<string, unknown>): StaffProfileNavOptions {
  const focusOnec = String(query.focus || '') === 'onec'
  const options: StaffProfileNavOptions = {
    from: 'onboarding',
  }

  if (focusOnec) {
    options.tab = 'onec'
  }

  return options
}
