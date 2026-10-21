<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import AuthRRButton from '../form/AuthRRButton.vue'
import RrBottomSheet from '../overlays/RrBottomSheet.vue'
import RrFilterToggleIcon from './RrFilterToggleIcon.vue'
import { useRrToolbarOverflow } from './composables/useRrToolbarOverflow'

const props = withDefaults(
  defineProps<{
    loading?: boolean
    hasActiveFilters?: boolean
    /** Media query для компактного режима (фильтры в bottom sheet) */
    compactMediaQuery?: string
    minSearchWidth?: number
    maxSearchWidth?: number
  }>(),
  {
    loading: false,
    hasActiveFilters: false,
    compactMediaQuery: '(max-width: 1000px)',
    minSearchWidth: 250,
    maxSearchWidth: 400,
  },
)

const emit = defineEmits<{
  'update:filtersOverflow': [value: boolean]
  'update:filtersCompact': [value: boolean]
}>()

/** Media-компакт (≤1000). Не путать с space-компактом от измерения. */
const isMediaCompact = ref(false)

const {
  rootRef,
  measureRef,
  actionsRef,
  isTight,
  needsSheet,
  isReady,
} = useRrToolbarOverflow({
  compact: isMediaCompact,
  minFlexibleWidth: props.minSearchWidth,
})

/**
 * Компакт = media ИЛИ контент уже не вмещает обязательные чипы + actions
 * (типично: сайдбар сужает тулбар при viewport > 1000).
 */
const isCompact = computed(() => isMediaCompact.value || needsSheet.value)

const mobileSheetOpen = ref(false)
const filtersSheetTitleId = useId()

const showInlineFilters = computed(() => !isCompact.value && isReady.value)

const showMobileFiltersButton = computed(() => isCompact.value)

const mobileFiltersActive = computed(
  () => mobileSheetOpen.value || props.hasActiveFilters,
)

watch(
  isTight,
  (value) => {
    emit('update:filtersOverflow', value)
  },
  { immediate: true },
)

watch(
  isCompact,
  (value) => {
    emit('update:filtersCompact', value)
  },
  { immediate: true },
)

function openMobileFilters() {
  mobileSheetOpen.value = true
}

function closeMobileFilters() {
  mobileSheetOpen.value = false
}

let compactMq: MediaQueryList | null = null

function syncCompact() {
  isMediaCompact.value = Boolean(compactMq?.matches)
}

onMounted(() => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
  compactMq = window.matchMedia(props.compactMediaQuery)
  syncCompact()
  compactMq.addEventListener?.('change', syncCompact)
})

onBeforeUnmount(() => {
  compactMq?.removeEventListener?.('change', syncCompact)
})

watch(isCompact, (compact) => {
  if (!compact) mobileSheetOpen.value = false
})
</script>

<template>
  <div
    class="rr-toolbar-filters"
    :class="{
      'rr-toolbar-filters--loading': loading,
      'rr-toolbar-filters--tight': isTight,
      'rr-toolbar-filters--compact': isCompact,
    }"
  >
    <div ref="rootRef" class="rr-toolbar-filters__row">
      <div
        class="rr-toolbar-filters__leading"
        :style="{
          '--rr-toolbar-search-min-width': `${minSearchWidth}px`,
          '--rr-toolbar-search-max-width': `${maxSearchWidth}px`,
        }"
      >
        <div v-if="!showMobileFiltersButton" class="rr-toolbar-filters__search">
          <slot name="search" />
        </div>

        <div v-if="showInlineFilters" class="rr-toolbar-filters__inline">
          <slot name="filters" />
        </div>

        <button
          v-if="showMobileFiltersButton"
          type="button"
          class="rr-toolbar-filters__mobile-btn"
          :class="{ 'rr-toolbar-filters__mobile-btn--active': mobileFiltersActive }"
          :aria-label="mobileSheetOpen ? 'Скрыть фильтры' : 'Фильтры'"
          :aria-expanded="mobileSheetOpen"
          :disabled="loading"
          @click="openMobileFilters"
        >
          <RrFilterToggleIcon :size="24" />
          <span class="rr-toolbar-filters__mobile-btn-label">Фильтры</span>
          <span
            v-if="hasActiveFilters"
            class="rr-toolbar-filters__mobile-btn-indicator"
            aria-hidden="true"
          />
        </button>
      </div>

      <div ref="actionsRef" class="rr-toolbar-filters__actions">
        <slot name="actions" />
      </div>
    </div>

    <RrBottomSheet
      v-if="showMobileFiltersButton || mobileSheetOpen"
      v-model="mobileSheetOpen"
      placement="sheet"
      height-mode="fit"
      :height-percent="90"
      title="Фильтры"
      :title-id="filtersSheetTitleId"
    >
      <div class="rr-toolbar-filters__sheet">
        <div class="rr-toolbar-filters__sheet-search">
          <slot name="search" />
        </div>
        <slot name="filters" />
      </div>
      <template #footer>
        <AuthRRButton type="button" label="Применить" @click="closeMobileFilters" />
      </template>
    </RrBottomSheet>

    <!-- Полный набор чипов для измерения; --tight на него не действует → без осцилляции.
         Держим в DOM и при space-compact, чтобы выйти из sheet при расширении. -->
    <div
      ref="measureRef"
      class="rr-toolbar-filters__measure"
      aria-hidden="true"
    >
      <slot name="filters" />
    </div>
  </div>
</template>

<style scoped>
.rr-toolbar-filters {
  position: relative;
  min-width: 0;
}

.rr-toolbar-filters--loading {
  opacity: 0.72;
  pointer-events: none;
}

.rr-toolbar-filters__row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.rr-toolbar-filters__leading {
  display: flex;
  align-items: stretch;
  gap: 8px;
  min-width: 0;
  min-height: 48px;
  flex: 1 1 auto;
  overflow: hidden;
}

.rr-toolbar-filters__search {
  flex: 1 1 var(--rr-toolbar-search-min-width, 250px);
  width: auto;
  max-width: var(--rr-toolbar-search-max-width, 400px);
  min-width: min(var(--rr-toolbar-search-min-width, 250px), 100%);
  display: flex;
  align-items: stretch;
}

.rr-toolbar-filters__search :deep(.rr-search-input) {
  width: 100%;
  max-width: 100%;
  min-height: 48px;
  height: 48px;
  padding: 0 12px;
  border-color: #e3e6ec;
  border-radius: 12px;
  box-shadow: none;
}

.rr-toolbar-filters__search :deep(.rr-search-input:hover),
.rr-toolbar-filters__search :deep(.rr-search-input:focus-within) {
  box-shadow: none;
}

.rr-toolbar-filters__search :deep(.rr-search-input__field) {
  min-height: 0 !important;
  height: auto !important;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
}

.rr-toolbar-filters__search :deep(.rr-search-input__field::placeholder) {
  color: #8b919a;
  font-weight: 400;
}

.rr-toolbar-filters__inline {
  display: inline-flex;
  align-items: stretch;
  min-width: 0;
  flex: 0 1 auto;
}

/* В тесном ряду прячем опциональные чипы; активный выбранный — оставляем, чтобы сбросить. */
.rr-toolbar-filters--tight .rr-toolbar-filters__inline :deep([data-rr-toolbar-optional]:not([data-rr-toolbar-optional-active])) {
  display: none !important;
}

.rr-toolbar-filters__measure {
  position: absolute;
  visibility: hidden;
  pointer-events: none;
  height: 0;
  overflow: hidden;
  white-space: nowrap;
}

.rr-toolbar-filters__measure :deep(.rr-filter-chips-row) {
  flex-wrap: nowrap;
  width: max-content;
}

.rr-toolbar-filters__mobile-btn {
  position: relative;
  display: none;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 48px;
  padding: 0 14px;
  border: 1px solid #e3e6ec;
  border-radius: 12px;
  background: #fff;
  color: #101012;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.rr-toolbar-filters__mobile-btn--active {
  border-color: #101012;
  background: #eceef2;
}

.rr-toolbar-filters__mobile-btn:disabled {
  cursor: default;
}

.rr-toolbar-filters__mobile-btn-label {
  white-space: nowrap;
}

.rr-toolbar-filters__mobile-btn-indicator {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  border: 2px solid #fff;
  border-radius: 50%;
  background: #e53935;
  box-sizing: border-box;
}

.rr-toolbar-filters__sheet {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.rr-toolbar-filters__sheet-search {
  width: 100%;
}

.rr-toolbar-filters__sheet-search :deep(.rr-search-input) {
  width: 100%;
  max-width: none;
  min-height: 48px;
  height: 48px;
  padding: 0 12px;
  border-color: #e3e6ec;
  border-radius: 12px;
}

.rr-toolbar-filters__sheet-search :deep(.rr-search-input__field) {
  min-height: 0 !important;
  height: auto !important;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
}

.rr-toolbar-filters__sheet :deep(.rr-filter-chips-row) {
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  gap: 12px;
}

.rr-toolbar-filters__sheet :deep(.rr-filter-chip) {
  width: 100%;
  min-width: 0;
  max-width: none;
  flex: 1 1 auto;
}

.rr-toolbar-filters__actions {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  flex-shrink: 0;
}

/* Space-compact (измерение) — те же правила, что media ≤1000. */
.rr-toolbar-filters--compact .rr-toolbar-filters__leading {
  flex: 0 1 auto;
  min-width: 0;
}

.rr-toolbar-filters--compact .rr-toolbar-filters__inline {
  display: none !important;
}

.rr-toolbar-filters--compact .rr-toolbar-filters__mobile-btn {
  display: inline-flex;
}

.rr-toolbar-filters--compact .rr-toolbar-filters__actions {
  margin-left: auto;
  flex-shrink: 0;
}

@media (max-width: 1000px) {
  .rr-toolbar-filters__row {
    flex-wrap: nowrap;
    gap: 8px;
  }

  .rr-toolbar-filters__leading {
    flex: 0 1 auto;
    min-width: 0;
  }

  .rr-toolbar-filters__inline,
  .rr-toolbar-filters__measure {
    display: none !important;
  }

  .rr-toolbar-filters__mobile-btn {
    display: inline-flex;
  }

  .rr-toolbar-filters__actions {
    margin-left: auto;
    flex-shrink: 0;
  }
}
</style>
