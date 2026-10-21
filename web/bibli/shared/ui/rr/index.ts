/**
 * Russ Redesign form/list/overlay kit (--rr-*).
 * Canonical import for apps: `bibli/shared/ui/rr`
 *
 * Auth-only shell stays in `bibli/widgets/Auth/rr` (Layout, Callback).
 * Layout: form/  list/  overlays/  — see README.md
 */
export { default as AuthRRButton } from './form/AuthRRButton.vue'
export { default as AuthRRField } from './form/AuthRRField.vue'
export { default as AuthRRInputPhone } from './form/AuthRRInputPhone.vue'
export { default as AuthRRInputPassword } from './form/AuthRRInputPassword.vue'
export { default as AuthRRInputText } from './form/AuthRRInputText.vue'
export { default as AuthRRStepProgress } from './form/AuthRRStepProgress.vue'
export { default as AuthRROtpInput } from './form/AuthRROtpInput.vue'
export { default as AuthRRPasswordRules } from './form/AuthRRPasswordRules.vue'

/** Shorter aliases */
export { default as RrButton } from './form/AuthRRButton.vue'
export { default as RrField } from './form/AuthRRField.vue'
export { default as RrInputPhone } from './form/AuthRRInputPhone.vue'
export { default as RrInputPassword } from './form/AuthRRInputPassword.vue'
export { default as RrInputText } from './form/AuthRRInputText.vue'
export { default as RrStepProgress } from './form/AuthRRStepProgress.vue'
export { default as RrOtpInput } from './form/AuthRROtpInput.vue'
export { default as RrPasswordRules } from './form/AuthRRPasswordRules.vue'

export { default as RrGridList } from './list/RrGridList.vue'
export { default as RrColumnSortIcon } from './list/RrColumnSortIcon.vue'
export { default as RrMultiSelect } from './list/RrMultiSelect.vue'
export { default as RrSelectScroll } from './list/RrSelectScroll.vue'
export { default as RrSearchInput } from './list/RrSearchInput.vue'
export { default as RrSearchIcon } from './list/RrSearchIcon.vue'
export { default as RrCheckIcon } from './list/RrCheckIcon.vue'
export { default as RrFilterToggleIcon } from './list/RrFilterToggleIcon.vue'
export { default as RrPointSelect } from './list/RrPointSelect.vue'
export { default as RrLocationPinIcon } from './list/RrLocationPinIcon.vue'
export { default as RrStatusBadge } from './list/RrStatusBadge.vue'
export { default as RrStatusBadgeSelect } from './list/RrStatusBadgeSelect.vue'
export { default as RrFilterChip } from './list/RrFilterChip.vue'
export { default as RrFilterChipsRow } from './list/RrFilterChipsRow.vue'
export { default as RrSegmentTabs } from './list/RrSegmentTabs.vue'
export type { RrSegmentTab } from './list/RrSegmentTabs.vue'
export { default as RrToolbarFiltersLayout } from './list/RrToolbarFiltersLayout.vue'
export { default as RrListToolbar } from './list/RrListToolbar.vue'
export type { RrGridListColumn } from './list/RrGridList.vue'

export { default as RrBottomSheet } from './overlays/RrBottomSheet.vue'
export { default as RrSelectSheet } from './overlays/RrSelectSheet.vue'
/** @deprecated Prefer RrBottomSheet / RrSelectSheet */
export { default as ProfileBottomSheet } from './overlays/RrBottomSheet.vue'
export { default as ProfileSelectSheet } from './overlays/RrSelectSheet.vue'

export {
  resolveRrStatusPreset,
  resolveRrStatusPresetByName,
  normalizeRrStatusName,
  rrStatusPresetToInlineStyle,
  RR_STATUS_NEUTRAL_PRESET,
} from './lib/rrStatusPresets'
export type {
  RrStatusIcon,
  RrStatusPreset,
  RrStatusResolveInput,
  RrStatusTone,
} from './lib/rrStatusPresets'

export {
  getPasswordRulesList,
  getPasswordRulesState,
  isPasswordRulesValid,
  PASSWORD_SPECIAL_CHARS,
} from './form/composables/usePasswordRules.js'
export {
  CYRILLIC_NAME_ONLY_MESSAGE,
  isValidCyrillicName,
  sanitizePersonNameInput,
  validateCyrillicName,
} from './form/composables/useCyrillicNameValidation.js'
export {
  extractUserDigits,
  localMaskGhost,
  useRuPhoneMask,
} from './form/composables/useRuPhoneMask.js'
export {
  cellsToDigits,
  useAuthRrOtp,
  OTP_LENGTH,
} from './form/composables/useAuthRrOtp.js'
export { useRrToolbarOverflow } from './list/composables/useRrToolbarOverflow'
export type { UseRrToolbarOverflowOptions } from './list/composables/useRrToolbarOverflow'
