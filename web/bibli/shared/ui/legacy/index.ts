/**
 * Legacy produkt UI (--russ-*, pre-RR).
 * Prefer: `bibli/shared/ui/legacy`
 */
export * from './inputs'
export * from './buttons'
export { default as ConfirmModal } from './ConfirmModal'
export { default as SearchInput } from './SearchInput/SearchInput.vue'
export { default as BaseTable } from './BaseTable/BaseTable.vue'
export { default as AppTable } from './table/AppTable.vue'
export { default as InventoryLineItem } from './InventoryLineItem/InventoryLineItem.vue'
export { default as TablePagination } from './TablePagination/TablePagination.vue'
export { default as ColumnFilter } from './ColumnFilter/ColumnFilter.vue'
export { default as MagnetSearchModal } from './MagnetSearchModal/MagnetSearchModal.vue'
export { AnalyticsExportModal } from './AnalyticsExportModal'
export type { AnalyticsRuchnikType } from './AnalyticsExportModal'
export { StaffRegistryByProjectsExportModal } from './StaffRegistryByProjectsExportModal'
export type { StaffRegistryByProjectsExportParams } from './StaffRegistryByProjectsExportModal'
export { default as StaffResultsModal } from './StaffResultsModal/StaffResultsModal.vue'
export { default as StaffPasswordChangeModals } from './StaffPassword/StaffPasswordChangeModals.vue'
export { default as StaffCredentialsRevealModal } from './StaffPassword/StaffCredentialsRevealModal.vue'
export {
  STAFF_PASSWORD_SYMBOLS,
  validateStaffPassword,
  setUserPasswordErrorMessage,
} from './StaffPassword/password'
export type { StaffSetPasswordFn } from './StaffPassword/password'
export { default as EffectivenessModal } from './EffectivenessModal/EffectivenessModal.vue'
export { ExcelExportOverlay } from './ExcelExportOverlay'
export { RolePagesModal } from './RolePagesModal'
export { AddPagesModal } from './AddPagesModal'
export { BaseModal } from './BaseModal'
export { ResponsiveModal } from './ResponsiveModal'
export { ReportingMobileActionsMenu } from './ReportingMobileActionsMenu'
export type { ReportingMobileAction } from './ReportingMobileActionsMenu'
export { FiltersBar } from './FiltersBar'
export type { FilterConfig } from './FiltersBar'
export { DatePicker } from './DatePicker'
export { MonthPicker } from './MonthPicker'
export { TimePicker } from './TimePicker'
export { DateTimePicker } from './DateTimePicker'
export { DateRangePicker } from './DateRangePicker'
export { StatusSelect } from './StatusSelect'
export { FilterItem } from './FilterItem'
export { FiltersActions, CompactFiltersActions } from './filters'
export { UnifiedPageHeader, HeaderTabToolbar, InventoryLinesHeader } from './page'
export { ProjectSelect } from './project'
export { default as Pill } from './Pill'
export { EditShiftsModal } from './EditShiftsModal'
export type { EditModalStaffSummary } from './EditShiftsModal/types'
export { QRModal } from './QRModal'
export { YandexQRModal } from './YandexQRModal'
export { ExtraditionModal } from './ExtraditionModal'
export { RedirectModal } from './RedirectModal'
export { UploadSuccessModal } from './UploadSuccessModal'
export { FinalModal } from './FinalModal'
export { Handler4FinalModal } from './Handler4FinalModal'
export { ProductModal } from './ProductModal'
export { CategoryModal } from './CategoryModal'
export { CategoryNode } from './CategoryNode'
export type { Category } from './CategoryNode'
export { Card } from './Card'
export { Chip } from './Chip'
export { Form } from './Form'
export { ProgressSpinner } from './ProgressSpinner'
export { ProjectSwitchCard } from './ProjectSwitchCard'
export { FileUpload } from './FileUpload'
export { Checkbox } from './Checkbox'
export { Menu } from './Menu'
export { Stepper, StepItem, Step, StepPanel } from './Stepper'
export { default as Toast } from './Toast/Toast.vue'
export { useToast } from './Toast'
export type { ToastServiceMethods, ToastMessage, ToastMessageOptions, ToastSeverity } from './Toast'
export * from './profile'
export {
  mergeTheme,
  generateBrandedQr,
  extractDominantColorFromLogo,
  extractDominantColorFromImageData,
  getPresetTokens,
  platformPreset,
  pilotPreset,
  magnitPreset,
  yandexPreset,
  otpPreset,
  fiveCardsPreset,
  IssuanceQrShell,
  IssuanceDualQrShell,
  IssuanceConsentShell,
} from '../../issuance-themes'
export type {
  ThemePreset,
  IssuanceShellVariant,
  IssuanceThemeTokens,
  IssuanceThemeColors,
  IssuanceThemeBranding,
  IssuanceThemeLayout,
  ThemeOverrides,
  MergeThemeOptions,
  GenerateBrandedQrOptions,
  DominantColorInput,
} from '../../issuance-themes'
