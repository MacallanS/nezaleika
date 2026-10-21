/**
 * Auth RR surface: layout + callback + re-export of shared form kit.
 * Form controls: prefer `bibli/shared/ui/rr`.
 */
export { default as AuthRRLayout } from './AuthRRLayout.vue'
export { default as AuthRRLegal } from './AuthRRLegal.vue'
export { default as AuthRrLoadingPage } from './AuthRrLoadingPage.vue'
export { default as AuthCallbackStatusPage } from './AuthCallbackStatusPage.vue'
export {
  AUTH_RR_BOOT_COPY,
  AUTH_RR_LOADING_COPY,
  AUTH_RR_LOGOUT_COPY,
} from './authRrLoadingCopy'
export type { AuthRrLoadingCopy } from './authRrLoadingCopy'
export {
  hideAuthRrLoadingOverlay,
  isAuthRrLoadingOverlayVisible,
} from './hideAuthRrLoadingOverlay'
export { showAuthRrBootstrapLoading } from './showAuthRrBootstrapLoading'
export type { AuthRrBootstrapLoadingCopy } from './showAuthRrBootstrapLoading'
export { useAuthRrShell } from './composables/useAuthRrShell'
export {
  clearStaleAuthRrDocumentState,
  mountAuthRrLayoutListeners,
  scheduleAuthRrLayoutSync,
  syncAuthRrLayout,
} from './composables/syncAuthRrLayout'
export { syncAuthRrThemeColorForVisibleShell, syncAuthRrLoadingThemeColor } from './syncAuthRrThemeColor'
export { isAuthRrAppShell, queryAuthRrAppShell } from './isAuthRrAppShell'

export {
  AuthRRButton,
  AuthRRField,
  AuthRRInputPhone,
  AuthRRInputPassword,
  AuthRRInputText,
  AuthRRStepProgress,
  AuthRROtpInput,
  AuthRRPasswordRules,
  RrButton,
  RrField,
  RrInputPhone,
  RrInputPassword,
  RrInputText,
  RrStepProgress,
  RrOtpInput,
  RrPasswordRules,
  getPasswordRulesList,
  getPasswordRulesState,
  isPasswordRulesValid,
  PASSWORD_SPECIAL_CHARS,
  CYRILLIC_NAME_ONLY_MESSAGE,
  validateCyrillicName,
} from 'bibli/shared/ui/rr'

export {
  authRrAssets,
  authRrBrand,
  authRrFlags,
  authRrHeroByVariant,
  authRrHeroDimensions,
  authRrIcons,
  getAuthRrHero,
  type AuthRrAssetKey,
  type AuthRrHeroMeta,
  type AuthRrHeroVariant,
  type AuthRrIconKey,
} from 'bibli/shared/assets/auth/rr'
