export { default as AppNavigationRR } from './AppNavigationRR.vue'
export { default as AppMobileTabBarRR } from './AppMobileTabBarRR.vue'
export { default as AppPageHeaderRR } from './AppPageHeaderRR.vue'
export { default as AppUserChipRR } from './AppUserChipRR.vue'
export { default as AppShellRR } from './AppShellRR.vue'
export { APP_RR_HEADER_ACTIONS_ID } from './headerActions'
export type {
  NavItemRR,
  NavItemsConfigRR,
  NavProjectOptionRR,
  NavServiceItemRR,
} from './AppNavigationRR.vue'
export type { MobileTabBarItemRR } from './AppMobileTabBarRR.vue'
export type { AppUserChipMenuItem } from './AppUserChipRR.vue'
export { registerRrChildBack, runRrChildBack } from './composables/useRrChildBack'
export { useRrHeaderActionsTeleport } from './composables/useRrHeaderActionsTeleport'
export {
  ALL_PROJECTS_OPTION_ID,
  buildCrmServiceTiles,
  defaultPlatformServices,
  filterVisibleServiceCodes,
  isDevCrmHost,
  isRecruiterRole,
  resolveServiceUrl,
  roleSeesAllCrms,
  roleSeesServicesMenu,
  type CrmServiceTile,
  type PlatformServiceDto,
} from './crmAccess'
