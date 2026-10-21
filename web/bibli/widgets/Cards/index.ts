/**
 * Учёт пластиковых карт (коробочная модель).
 * Host: fintech `pages/cards` — API остаётся в приложении (`@/pages/cards/api`).
 */

export { default as CardsPage } from './ui/Cards.vue'
export { default as CardsRegistryHome } from './ui/CardsRegistryHome.vue'
export { default as CardsBackOffice } from './ui/BackOffice.vue'
export { default as CardsPointOps } from './ui/PointOps.vue'
export { default as CardsStandInventory } from './ui/CardsStandInventory.vue'
export { default as CardsBoxSplitPage } from './ui/CardsBoxSplitPage.vue'
export { default as CardsBoxQrLabelsPage } from './ui/CardsBoxQrLabelsPage.vue'
export { default as CardsPageShell } from './ui/CardsPageShell.vue'
export { default as CardsMobileSectionNav } from './ui/CardsMobileSectionNav.vue'
export { default as CardsHeaderActions } from './ui/CardsHeaderActions.vue'
export { default as CardsContentBlock } from './ui/CardsContentBlock.vue'
export { default as CardsCodeChips } from './ui/CardsCodeChips.vue'
export { default as CardsBoxPicker } from './ui/CardsBoxPicker.vue'
export { default as CardScanInput } from './ui/CardScanInput.vue'
export { default as CardScanner } from './ui/CardScanner.vue'
export { default as CardsCameraCapture } from './ui/CardsCameraCapture.vue'
export { default as CardsReportSection } from './ui/CardsReportSection.vue'
export { default as ToolbarRefreshButton } from './ui/ToolbarRefreshButton.vue'

export { default as PointIncomingShipmentsSection } from './ui/sections/PointIncomingShipmentsSection.vue'
export { default as PointUtilSection } from './ui/sections/PointUtilSection.vue'
export { default as CardsUtilConfirmSection } from './ui/sections/CardsUtilConfirmSection.vue'
export { default as CardsAnalyticsSection } from './ui/sections/CardsAnalyticsSection.vue'
export { default as CardsPublicApiJournalSection } from './ui/sections/CardsPublicApiJournalSection.vue'

export { usePointOps } from './composables/usePointOps'
export { useCardsBackOffice } from './composables/useCardsBackOffice'
export { useCardsBoxQrLabels } from './composables/useCardsBoxQrLabels'
export { useStandInventory } from './composables/useStandInventory'
export { useCardsProjectScope } from './composables/useCardsProjectScope'
export { useHidScanner } from './composables/useHidScanner'
export { useQrScanner } from './composables/useQrScanner'
