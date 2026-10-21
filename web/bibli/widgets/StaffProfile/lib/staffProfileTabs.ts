import type { ActivationStepId } from 'bibli/widgets/Profile/rr/lib/activationSteps'

export type StaffProfileTabId =
  | 'overview'
  | 'documents'
  | 'projects'
  | 'onec'
  | 'notes'
  | 'settings'
  | 'products'
  | 'other'
  | 'history'
  /** @deprecated legacy agents tabs — aliased to current ids */
  | 'basic'
  | 'passport'
  | 'referal'
  | 'files'
  | 'employment'

export type StaffProfileFrom = 'agents' | 'onboarding' | 'onec'

export const STAFF_PROFILE_TAB_VALUES: StaffProfileTabId[] = [
  'overview',
  'documents',
  'projects',
  'onec',
  'notes',
  'settings',
  'products',
  'other',
  'history',
  'basic',
  'passport',
  'referal',
  'files',
  'employment',
]

/** Старые tab id со страницы «Сотрудники» → актуальные. */
export const STAFF_PROFILE_LEGACY_TAB_ALIASES: Partial<
  Record<StaffProfileTabId, StaffProfileTabId>
> = {
  basic: 'overview',
  passport: 'documents',
  referal: 'projects',
  files: 'other',
  employment: 'documents',
}

/** Вкладки карточки из оформления / 1С */
export const STAFF_PROFILE_ONBOARDING_TABS: StaffProfileTabOption[] = [
  { id: 'overview', label: 'Обзор' },
  { id: 'documents', label: 'Документы' },
  { id: 'projects', label: 'Проекты' },
  { id: 'onec', label: '1C' },
  { id: 'notes', label: 'Заметки', count: null },
  { id: 'other', label: 'Другое' },
  { id: 'history', label: 'История' },
]

/** Вкладки карточки со страницы «Сотрудники» — как в оформлении + Параметры/Продукты */
export const STAFF_PROFILE_AGENTS_TABS: StaffProfileTabOption[] = [
  { id: 'overview', label: 'Обзор' },
  { id: 'documents', label: 'Документы' },
  { id: 'projects', label: 'Проекты' },
  { id: 'onec', label: '1C' },
  { id: 'notes', label: 'Заметки', count: null },
  { id: 'settings', label: 'Параметры' },
  { id: 'products', label: 'Продукты' },
  { id: 'other', label: 'Другое' },
  { id: 'history', label: 'История' },
]

/** @deprecated use STAFF_PROFILE_ONBOARDING_TABS / STAFF_PROFILE_AGENTS_TABS */
export const STAFF_PROFILE_TABS: StaffProfileTabOption[] = [...STAFF_PROFILE_AGENTS_TABS]

export const STAFF_PROFILE_DOC_VALUES: ActivationStepId[] = [
  'personal',
  'passport',
  'inn',
  'snils',
  'agent-type',
  'bank',
]

export interface StaffProfileTabOption {
  id: StaffProfileTabId
  label: string
  count?: number | null
}

export const STAFF_PROFILE_TAB_STUB_COPY: Record<
  Exclude<
    StaffProfileTabId,
    | 'documents'
    | 'history'
    | 'overview'
    | 'onec'
    | 'passport'
    | 'basic'
    | 'files'
    | 'settings'
    | 'products'
    | 'employment'
    | 'referal'
  >,
  { title: string; description: string }
> = {
  projects: {
    title: 'Проекты',
    description: 'Привязки к проектам и точкам, история назначений.',
  },
  notes: {
    title: 'Заметки',
    description: 'Внутренние заметки саппорта по агенту.',
  },
  other: {
    title: 'Другое',
    description: 'Тип оформления и параметры доступа.',
  },
}

export function isStaffProfileTabId(value: string): value is StaffProfileTabId {
  return STAFF_PROFILE_TAB_VALUES.includes(value as StaffProfileTabId)
}

export function isStaffProfileDocId(value: string): value is ActivationStepId {
  return STAFF_PROFILE_DOC_VALUES.includes(value as ActivationStepId)
}

export function isOnboardingStaffProfileSource(from: StaffProfileFrom): boolean {
  return from === 'onboarding' || from === 'onec'
}

export function defaultStaffProfileTab(_from?: StaffProfileFrom): StaffProfileTabId {
  return 'overview'
}

export function isDocumentsLikeTab(tab: StaffProfileTabId): boolean {
  return tab === 'documents' || tab === 'passport'
}

/** Канонический tab id с учётом legacy-алиасов. */
export function resolveStaffProfileTabId(
  value: string,
  from: StaffProfileFrom = 'agents',
): StaffProfileTabId {
  const fallback = defaultStaffProfileTab(from)
  if (!isStaffProfileTabId(value)) return fallback
  return STAFF_PROFILE_LEGACY_TAB_ALIASES[value] ?? value
}

export function resolveStaffProfileTabsForSource(
  from: StaffProfileFrom,
  opts?: {
    isAdmin?: boolean
    isGroupHead?: boolean
    canSeePassport?: boolean
    canManageStaff?: boolean
    notesCount?: number | null
  },
): StaffProfileTabOption[] {
  const isAdmin = opts?.isAdmin === true
  const isGroupHead = opts?.isGroupHead === true
  const canSeePassport = opts?.canSeePassport !== false
  const canManageStaff = opts?.canManageStaff !== false
  const notesCount = opts?.notesCount ?? null

  if (isOnboardingStaffProfileSource(from)) {
    return STAFF_PROFILE_ONBOARDING_TABS.filter((tab) => {
      if (tab.id === 'other' && !isAdmin) return false
      return true
    }).map((tab) =>
      tab.id === 'notes' ? { ...tab, count: notesCount } : tab,
    )
  }

  return STAFF_PROFILE_AGENTS_TABS.filter((tab) => {
    if (isGroupHead) return tab.id === 'overview'
    if (tab.id === 'documents') return canSeePassport
    if (tab.id === 'other') return isAdmin
    if (tab.id === 'products' || tab.id === 'settings') return canManageStaff
    return true
  }).map((tab) =>
    tab.id === 'notes' ? { ...tab, count: notesCount } : tab,
  )
}
