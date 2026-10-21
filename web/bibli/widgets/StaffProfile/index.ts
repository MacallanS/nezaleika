/**
 * Staff profile (admin/staff card) widget.
 * Host page: fintech `pages/staff-profile`.
 */

export { default as StaffProfileHeader } from './ui/StaffProfileHeader.vue'
export { default as StaffProfileTabs } from './ui/StaffProfileTabs.vue'
export { default as StaffProfilePageSkeleton } from './ui/StaffProfilePageSkeleton.vue'
export { default as StaffProfileListSkeleton } from './ui/StaffProfileListSkeleton.vue'
export { default as StaffProfileMoreMenu } from './ui/StaffProfileMoreMenu.vue'

export { default as StaffProfileOverviewTab } from './ui/tabs/StaffProfileOverviewTab.vue'
export { default as StaffProfileDocumentsTab } from './ui/tabs/StaffProfileDocumentsTab.vue'
export { default as StaffProfileHistoryTab } from './ui/tabs/StaffProfileHistoryTab.vue'
export { default as StaffProfileProjectsTab } from './ui/tabs/StaffProfileProjectsTab.vue'
export { default as StaffProfileOnecTab } from './ui/tabs/StaffProfileOnecTab.vue'
export { default as StaffProfileNotesTab } from './ui/tabs/StaffProfileNotesTab.vue'
export { default as StaffProfileOtherTab } from './ui/tabs/StaffProfileOtherTab.vue'
export { default as StaffProfileSettingsTab } from './ui/tabs/StaffProfileSettingsTab.vue'
export { default as StaffProfileProductsTab } from './ui/tabs/StaffProfileProductsTab.vue'
export { default as StaffProfileBasicTab } from './ui/tabs/StaffProfileBasicTab.vue'
export { default as StaffProfileEmploymentTab } from './ui/tabs/StaffProfileEmploymentTab.vue'
export { default as StaffProfileTabStub } from './ui/tabs/StaffProfileTabStub.vue'

export { default as RejectSectionModal } from './ui/documents/RejectSectionModal.vue'
export { default as StaffHireModal } from './ui/StaffHireModal.vue'

export { useStaffProfile } from './composables/useStaffProfile'
export type { StaffProfileModel } from './composables/useStaffProfile'
export { useStaffProfileRoute } from './composables/useStaffProfileRoute'
export { useStaffProfileMoreActions } from './composables/useStaffProfileMoreActions'
export { useStaffHire } from './composables/useStaffHire'
export { useStaffProfileDocPreview } from './composables/useStaffProfileDocPreview'

export {
  buildStaffProfileUrl,
  buildStaffProfileNavOptionsFromLegacyQuery,
  resolveStaffProfileBack,
} from './lib/staffProfileNavigation'
export type { StaffProfileNavOptions } from './lib/staffProfileNavigation'

export {
  STAFF_PROFILE_TABS,
  STAFF_PROFILE_ONBOARDING_TABS,
  STAFF_PROFILE_AGENTS_TABS,
  STAFF_PROFILE_TAB_STUB_COPY,
  STAFF_PROFILE_LEGACY_TAB_ALIASES,
  resolveStaffProfileTabsForSource,
  resolveStaffProfileTabId,
  defaultStaffProfileTab,
  isOnboardingStaffProfileSource,
} from './lib/staffProfileTabs'
export type { StaffProfileFrom, StaffProfileTabId } from './lib/staffProfileTabs'

export {
  compactFioForDocumentFileName,
  downloadStaffProfileDocumentsZip,
  listStaffProfileDocumentFiles,
  listStaffProfileAgentTypeFiles,
  listStaffProfileAllDocumentFiles,
} from './lib/staffProfileDocumentsDownload'

export { getStaffProfileActionErrorMessage } from './lib/staffProfileActionError'
export {
  formatValidationToast,
  parseApiValidationError,
} from 'bibli/shared/api/parseApiValidationError'
export { buildUpdatePassportPayload, digitsOnly } from './lib/staffProfilePassportSave'
export type { StaffPersonalSavePayload } from './lib/staffProfilePersonalSave'
export type {
  StaffDocImagesMutation,
  StaffFieldsSavePayload,
  StaffPassportSavePayload,
} from './lib/staffProfileDocImagesSave'
export { emptyDocImagesMutation } from './lib/staffProfileDocImagesSave'
export { resolveStaffAccountType } from './lib/staffProfileAgentType'
