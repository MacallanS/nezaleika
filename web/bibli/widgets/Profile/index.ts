/**
 * Profile widget barrel.
 *
 * Prefer explicit trees:
 *   `bibli/widgets/Profile/legacy` — ProfileLegacy, TraineeExpiredCard
 *   `bibli/widgets/Profile/rr`     — Activation + wizards + shell
 *
 * Host app must provide PROFILE_API_KEY (+ PROFILE_NAVIGATE_KEY,
 * and PROFILE_LEGACY_EXTRAS_KEY for legacy).
 */
export {
  PROFILE_API_KEY,
  PROFILE_NAVIGATE_KEY,
  PROFILE_LEGACY_EXTRAS_KEY,
} from './types'
export type {
  ProfileApi,
  ProfileNavigate,
  ProfileNavigateOptions,
  ProfileLegacyExtras,
  ProfileUserSync,
} from './types'
export {
  useProfileApi,
  useProfileNavigate,
  useProfileLegacyExtras,
  useProfileYandexHost,
} from './composables/useProfileServices'

export {
  ProfileLegacy,
  TraineeExpiredCard,
  PROFILE_WIZARD_STEP_COUNT,
  PROFILE_STEP_TITLES,
  isProfileStepComplete,
  nextIncompleteProfileStep,
} from './legacy'

export {
  ProfileActivation,
  ProfileActivationHome,
  ProfilePersonalWizard,
  ProfilePassportWizard,
  ProfileInnWizard,
  ProfileSnilsWizard,
  ProfileBankWizard,
  ProfileAgentTypeChoice,
  ProfileSelfEmployedWizard,
  ProfileIeWizard,
  ProfileRrTokens,
  ProfileStepShell,
  ProfileBottomSheet,
  ProfileSelectSheet,
  ProfileDocThumb,
  ProfileRrCheckbox,
  ProfileRrGender,
  PassportCameraCapture,
} from './rr'

export * from './rr/lib/activationSteps'
export * from './rr/lib/activationStatusSync'
export * from './rr/lib/personalWizard'
export * from './rr/lib/passportWizard'
export * from './rr/lib/innWizard'
export * from './rr/lib/snilsWizard'
export * from './rr/lib/bankWizard'
export * from './rr/lib/agentTypeWizard'
export * from './rr/lib/documentMedia'
