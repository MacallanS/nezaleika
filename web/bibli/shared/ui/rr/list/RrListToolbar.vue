<script setup lang="ts">
import RrSegmentTabs, { type RrSegmentTab } from './RrSegmentTabs.vue'
import RrToolbarFiltersLayout from './RrToolbarFiltersLayout.vue'

withDefaults(
  defineProps<{
    tabs: RrSegmentTab[]
    activeTab: string
    loading?: boolean
    hasActiveFilters?: boolean
    tabsAriaLabel?: string
    filtersOverflow?: boolean
    filtersCompact?: boolean
    minSearchWidth?: number
    maxSearchWidth?: number
    /** Скрыть полосу поиска/фильтров (только табы) */
    hideFilters?: boolean
  }>(),
  {
    hideFilters: false,
    minSearchWidth: 250,
    maxSearchWidth: 400,
  },
)

defineEmits<{
  'update:activeTab': [value: string]
  'update:filtersOverflow': [value: boolean]
  'update:filtersCompact': [value: boolean]
}>()
</script>

<template>
  <div
    class="rr-list-toolbar"
    :class="{ 'rr-list-toolbar--tabs-only': hideFilters }"
  >
    <div class="rr-list-toolbar__tabs-wrap">
      <RrSegmentTabs
        :tabs="tabs"
        :model-value="activeTab"
        :aria-label="tabsAriaLabel"
        @update:model-value="$emit('update:activeTab', $event)"
      />
      <slot name="tabs-extra" />
    </div>

    <RrToolbarFiltersLayout
      v-if="!hideFilters"
      :loading="loading"
      :has-active-filters="hasActiveFilters"
      :min-search-width="minSearchWidth"
      :max-search-width="maxSearchWidth"
      @update:filters-overflow="$emit('update:filtersOverflow', $event)"
      @update:filters-compact="$emit('update:filtersCompact', $event)"
    >
      <template #search>
        <slot name="search" />
      </template>
      <template #filters>
        <slot name="filters" />
      </template>
      <template #actions>
        <slot name="actions" />
      </template>
    </RrToolbarFiltersLayout>
  </div>
</template>

<style scoped>
.rr-list-toolbar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rr-list-toolbar--tabs-only {
  gap: 0;
}

.rr-list-toolbar__tabs-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  max-width: 100%;
}

.rr-list-toolbar__tabs-wrap :deep(.rr-segment-tabs) {
  min-width: 0;
  max-width: 100%;
}
</style>
