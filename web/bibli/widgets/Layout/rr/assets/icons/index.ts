import homeUrl from './home.svg'
/** Колокольчик из Button.svg / menu.png — отдельный файл, чтобы не путать с chat.svg */
import bellUrl from './bell.svg'
import chatUrl from './chat.svg'
import employeesUrl from './employees.svg'
import shiftsUrl from './shifts.svg'
import requestsUrl from './requests.svg'
import reportsUrl from './reports.svg'
import projectsUrl from './projects.svg'
import productsUrl from './products.svg'
import onboardingUrl from './onboarding.svg'
import settingsUrl from './settings.svg'
import loggingUrl from './logging.svg'
import servicesUrl from './services.svg'
import searchUrl from './search.svg'
import supportUrl from './support.svg'
import collapseUrl from './collapse.svg'
import chevronUrl from './chevron.svg'
import closeUrl from './close.svg'
import menuUrl from './menu.svg'
import userUrl from './user.svg'
import cardsUrl from './cards.svg'
import educationUrl from './education.svg'
import treeMidUrl from './tree-mid.svg'
import treeEndUrl from './tree-end.svg'
import productsLockedUrl from './products-locked.svg'
import shiftsLockedUrl from './shifts-locked.svg'
import requestsLockedUrl from './requests-locked.svg'
import cardsLockedUrl from './cards-locked.svg'
import educationLockedUrl from './education-locked.svg'
import userLockedUrl from './user-locked.svg'
import briefcaseUrl from './briefcase.svg'
import medalUrl from './medal.svg'
import funnelUrl from './funnel.svg'
import phoneUrl from './phone.svg'
import allProjectsUrl from './all-projects.svg'
/** Бейджи сервисов из Figma Component 3 (круги 16×16). */
import crmFintechUrl from './crm-badge-fintech.svg'
import crmSkladUrl from './crm-badge-sklad.svg'
import crmPodborUrl from './crm-badge-podbor.svg'
import crmRegistryUrl from './crm-badge-registry.svg'
import registryStockUrl from './registry-stock.svg'
import registryTransfersUrl from './registry-transfers.svg'
import registryInventoryUrl from './registry-inventory.svg'
import registryWriteoffUrl from './registry-writeoff.svg'

/** Иконки RR-меню (из IconSet.svg … IconSet-13.svg) */
export const navRrIcons = {
  home: homeUrl,
  notifications: bellUrl,
  bell: bellUrl,
  chat: chatUrl,
  employees: employeesUrl,
  shifts: shiftsUrl,
  requests: requestsUrl,
  reports: reportsUrl,
  projects: projectsUrl,
  products: productsUrl,
  onboarding: onboardingUrl,
  settings: settingsUrl,
  logging: loggingUrl,
  services: servicesUrl,
  search: searchUrl,
  support: supportUrl,
  collapse: collapseUrl,
  chevron: chevronUrl,
  close: closeUrl,
  menu: menuUrl,
  user: userUrl,
  briefcase: briefcaseUrl,
  medal: medalUrl,
  funnel: funnelUrl,
  phone: phoneUrl,
  cards: cardsUrl,
  education: educationUrl,
  treeMid: treeMidUrl,
  treeEnd: treeEndUrl,
  allProjects: allProjectsUrl,
  crmFintech: crmFintechUrl,
  crmSklad: crmSkladUrl,
  crmPodbor: crmPodborUrl,
  crmRegistry: crmRegistryUrl,
  registryStock: registryStockUrl,
  registryTransfers: registryTransfersUrl,
  registryInventory: registryInventoryUrl,
  registryWriteoff: registryWriteoffUrl,
} as const

export type NavRrIconName = keyof typeof navRrIcons

export const CRM_ICON_BY_ID: Record<string, string> = {
  fintech: crmFintechUrl,
  sklad: crmSkladUrl,
  podbor: crmPodborUrl,
  registry: crmRegistryUrl,
}

/** Варианты иконок для пунктов без доступа (серые + замок) */
export const NAV_RR_LOCKED_ICON_BY_NAME: Partial<Record<NavRrIconName, string>> = {
  products: productsLockedUrl,
  shifts: shiftsLockedUrl,
  requests: requestsLockedUrl,
  cards: cardsLockedUrl,
  education: educationLockedUrl,
  user: userLockedUrl,
}

/** page.code / ключ пункта → иконка */
export const NAV_RR_ICON_BY_KEY: Record<string, NavRrIconName> = {
  home: 'home',
  chats: 'chat',
  agents: 'employees',
  clients: 'employees',
  shifts: 'shifts',
  kpi: 'shifts',
  requests: 'requests',
  reporting: 'reports',
  project: 'projects',
  vacancies: 'briefcase',
  candidates: 'medal',
  outreach: 'phone',
  pipelines: 'funnel',
  products: 'products',
  inventory: 'registryInventory',
  'inventory-cards': 'registryInventory',
  dismissal: 'employees',
  onboarding: 'onboarding',
  'onboarding-users': 'onboarding',
  'onboarding-onec': 'onboarding',
  documents: 'onboarding',
  logging: 'logging',
  options: 'settings',
  settings: 'settings',
  admin: 'settings',
  services: 'services',
  phone: 'phone',
  search: 'search',
  employees: 'employees',
  /** Реестр: главная / складской лендинг */
  cards: 'home',
  cards_stock: 'registryStock',
  cards_qr_labels: 'registryTransfers',
  cards_transfers: 'registryTransfers',
  cards_writeoff: 'registryWriteoff',
  cards_report: 'reports',
  cards_api: 'logging',
  cards_point: 'registryStock',
  cards_split: 'registryTransfers',
  education: 'education',
  profile: 'user',
  user: 'user',
  'registry-stock': 'registryStock',
  'registry-transfers': 'registryTransfers',
  'registry-inventory': 'registryInventory',
  'registry-writeoff': 'registryWriteoff',
  'registry-home': 'home',
  'registry-account': 'registryInventory',
}

/** PrimeIcons class → иконка */
export const NAV_RR_ICON_BY_PI: Record<string, NavRrIconName> = {
  'pi-home': 'home',
  'pi-user': 'employees',
  'pi-users': 'employees',
  'pi-calendar': 'shifts',
  'pi-calculator': 'shifts',
  'pi-list': 'requests',
  'pi-list-check': 'requests',
  'pi-chart-bar': 'reports',
  'pi-chart-line': 'reports',
  'pi-comments': 'reports',
  'pi-folder': 'projects',
  'pi-briefcase': 'products',
  'pi-box': 'products',
  'pi-file': 'onboarding',
  'pi-user-plus': 'onboarding',
  'pi-database': 'logging',
  'pi-cog': 'settings',
  'pi-spin': 'settings',
  'pi-credit-card': 'cards',
  'pi-graduation-cap': 'education',
}
