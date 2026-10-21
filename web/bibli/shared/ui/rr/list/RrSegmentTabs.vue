<script setup lang="ts">
export interface RrSegmentTab {
  id: string
  label: string
  count?: number
}

defineProps<{
  tabs: RrSegmentTab[]
  modelValue: string
  ariaLabel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="rr-segment-tabs" role="tablist" :aria-label="ariaLabel">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      role="tab"
      class="rr-segment-tabs__tab"
      :class="{ 'rr-segment-tabs__tab--active': modelValue === tab.id }"
      :aria-selected="modelValue === tab.id"
      @click="emit('update:modelValue', tab.id)"
    >
      <span>{{ tab.label }}</span>
      <template v-if="tab.count != null">
        <span class="rr-segment-tabs__sep" aria-hidden="true">·</span>
        <span class="rr-segment-tabs__count">{{ tab.count }}</span>
      </template>
    </button>
  </div>
</template>

<style scoped>
.rr-segment-tabs {
  display: inline-flex;
  flex-wrap: nowrap;
  align-items: stretch;
  gap: 4px;
  width: fit-content;
  max-width: 100%;
  height: 48px;
  min-height: 48px;
  padding: 4px;
  box-sizing: border-box;
  border-radius: 14px;
  background: var(--Backgrounds-Tetriary, var(--rr-backgrounds-tetriary, #E7E8EE));
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  scrollbar-width: thin;
}

.rr-segment-tabs__tab {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: 2px;
  min-height: 0;
  height: 100%;
  padding: 0 16px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #5f6673;
  font: inherit;
  font-size: 15px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.rr-segment-tabs__tab:hover:not(.rr-segment-tabs__tab--active) {
  color: #101012;
}

.rr-segment-tabs__tab--active {
  background: #FFFFFF;
  color: #101012;
}

.rr-segment-tabs__sep {
  opacity: 0.45;
}

.rr-segment-tabs__count {
  font-variant-numeric: tabular-nums;
}
</style>
