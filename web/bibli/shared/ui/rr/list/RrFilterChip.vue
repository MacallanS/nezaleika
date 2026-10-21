<script setup lang="ts">
import './rr-select-surface.css'

const props = withDefaults(
  defineProps<{
    prefix?: string
    /** Ширина чипа: default | wide | point (широкая панель dropdown) */
    size?: 'default' | 'wide' | 'point'
  }>(),
  {
    prefix: '',
    size: 'default',
  },
)

function onChipClick(event: MouseEvent) {
  const chip = event.currentTarget as HTMLElement | null
  if (!chip) return
  const target = event.target as HTMLElement
  if (target.closest('.rr-multi-select__arrow, .rr-point-select__arrow')) return
  if (target.closest('.rr-multi-select, .rr-point-select')) return
  const selectRoot = chip.querySelector('.rr-multi-select, .rr-point-select') as HTMLElement | null
  selectRoot?.click()
}
</script>

<template>
  <div
    class="rr-filter-chip rr-select-surface"
    :class="{
      'rr-filter-chip--wide': size === 'wide',
      'rr-filter-chip--point': size === 'point',
    }"
    @click="onChipClick"
  >
    <span v-if="prefix" class="rr-filter-chip__prefix">{{ prefix }}</span>
    <div class="rr-filter-chip__control">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.rr-filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 48px;
  min-height: 48px;
  width: 200px;
  padding: 0 12px;
  border-radius: 12px;
  background: #fff;
  box-shadow: none;
  flex: 0 0 200px;
  min-width: 200px;
  max-width: 200px;
  box-sizing: border-box;
  overflow: hidden;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
  --rr-floating-panel-width-scale: 1.2;
  --rr-floating-panel-min-width: 0;
}

.rr-filter-chip:hover {
  background: #f8f9fb;
}

.rr-filter-chip__prefix {
  color: #8b919a;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  white-space: nowrap;
  flex-shrink: 0;
}

.rr-filter-chip__control {
  flex: 1 1 auto;
  min-width: 0;
  max-width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
}

.rr-filter-chip__control :deep(.rr-multi-select),
.rr-filter-chip__control :deep(.rr-point-select) {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  align-items: stretch;
}

.rr-filter-chip__control :deep(.rr-multi-select__trigger),
.rr-filter-chip__control :deep(.rr-point-select__trigger),
.rr-filter-chip__control :deep(.rr-multi-select__value),
.rr-filter-chip__control :deep(.rr-point-select__value) {
  min-width: 0;
  max-width: 100%;
  height: 100%;
  align-items: center;
}

.rr-filter-chip__control :deep(.rr-multi-select__trigger),
.rr-filter-chip__control :deep(.rr-point-select__trigger) {
  min-height: 0;
  height: 100%;
  gap: 6px;
  padding: 0;
  border: none !important;
  border-radius: 0;
  background: transparent !important;
  box-shadow: none !important;
}

.rr-filter-chip__control :deep(.rr-multi-select__arrow),
.rr-filter-chip__control :deep(.rr-point-select__arrow) {
  width: 16px;
  height: 16px;
  border-radius: 0;
  background: transparent;
  color: #8b919a;
}

.rr-filter-chip__control :deep(.rr-multi-select__primary),
.rr-filter-chip__control :deep(.rr-multi-select__placeholder) {
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}

.rr-filter-chip__control :deep(.rr-multi-select__primary),
.rr-filter-chip__control :deep(.rr-multi-select__placeholder),
.rr-filter-chip__control :deep(.rr-multi-select__more),
.rr-filter-chip__control :deep(.rr-point-select__primary),
.rr-filter-chip__control :deep(.rr-point-select__placeholder) {
  font-size: 14px;
  line-height: 20px;
}

/* wide / point — та же ширина чипа; point только расширяет dropdown */
.rr-filter-chip--wide {
  flex: 0 0 200px;
  width: 200px;
  min-width: 200px;
  max-width: 200px;
}

.rr-filter-chip--point {
  flex: 0 0 200px;
  width: 200px;
  min-width: 200px;
  max-width: 200px;
  --rr-floating-panel-width-scale: 2.4;
  --rr-floating-panel-min-width: 380px;
}
</style>
