/**
 * Auth widget barrel.
 *
 * Prefer explicit trees:
 *   `bibli/widgets/Auth/legacy` — AuthLayout, OidcRedirectAuthPage
 *   `bibli/widgets/Auth/rr`     — AuthRR* + AuthCallbackStatusPage
 */
export { default as OidcRedirectAuthPage } from './legacy/OidcRedirectAuthPage.vue'
export { default as AuthLayout } from './legacy/AuthLayout.vue'
export { default as AuthCallbackStatusPage } from './rr/AuthCallbackStatusPage.vue'
export { AuthRRLayout, AuthRRLegal, AuthRrLoadingPage } from './rr'
export {
  AUTH_RR_BOOT_COPY,
  AUTH_RR_LOADING_COPY,
  AUTH_RR_LOGOUT_COPY,
  hideAuthRrLoadingOverlay,
  showAuthRrBootstrapLoading,
} from './rr'
export { useAuthRrShell } from './rr/composables/useAuthRrShell'
export {
  clearStaleAuthRrDocumentState,
  mountAuthRrLayoutListeners,
  scheduleAuthRrLayoutSync,
  syncAuthRrLayout,
} from './rr/composables/syncAuthRrLayout'
export {
  syncAuthRrThemeColorForVisibleShell,
  syncAuthRrLoadingThemeColor,
} from './rr/syncAuthRrThemeColor'
export * from './lib'
export type { OidcRedirectAuthPolicy } from './types'
