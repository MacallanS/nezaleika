/**
 * Compat: `bibli/shared/ui` → legacy + RR list/table kit.
 * Prefer: `bibli/shared/ui/legacy` | `bibli/shared/ui/rr`
 */
export * from './legacy'
export {
  RrGridList,
  RrColumnSortIcon,
  RrMultiSelect,
  RrSearchInput,
  RrSearchIcon,
  RrPointSelect,
  RrStatusBadge,
  RrStatusBadgeSelect,
  RrFilterChip,
  RrFilterChipsRow,
  RrSegmentTabs,
  RrToolbarFiltersLayout,
  RrListToolbar,
  useRrToolbarOverflow,
  resolveRrStatusPreset,
  resolveRrStatusPresetByName,
  normalizeRrStatusName,
  rrStatusPresetToInlineStyle,
  RR_STATUS_NEUTRAL_PRESET,
} from './rr'
export type {
  RrGridListColumn,
  RrSegmentTab,
  UseRrToolbarOverflowOptions,
  RrStatusIcon,
  RrStatusPreset,
  RrStatusResolveInput,
  RrStatusTone,
} from './rr'
