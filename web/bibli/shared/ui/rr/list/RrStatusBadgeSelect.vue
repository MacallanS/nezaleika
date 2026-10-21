<template>
  <div
    ref="anchorRef"
    class="rr-status-badge-select"
    :class="{
      'rr-status-badge-select--disabled': disabled,
      'rr-status-badge-select--open': panelOpen,
    }"
  >
    <button
      type="button"
      class="rr-status-badge-select__trigger"
      :disabled="disabled"
      :aria-expanded="panelOpen ? 'true' : 'false'"
      aria-haspopup="listbox"
      :aria-controls="listboxId"
      @click.stop="togglePanel"
    >
      <RrStatusBadge
        class="rr-grid-list__badge"
        :kind="kind"
        :id="selected?.id"
        :label="selected?.name ?? placeholder"
        :size="size"
      />
    </button>

    <Teleport to="body">
      <div
        v-if="dropdownOpen && !isCompact"
        :id="listboxId"
        ref="panelRef"
        class="rr-status-badge-select__panel rr-select-surface"
        :class="{ 'rr-status-badge-select__panel--above': placement === 'above' }"
        :style="panelPositionStyles"
        role="listbox"
        @mousedown.stop
      >
        <button
          v-for="(option, index) in options"
          :key="String(option.id)"
          type="button"
          class="rr-status-badge-select__option"
          :class="{ 'rr-status-badge-select__option--highlighted': index === highlightedIndex }"
          role="option"
          :aria-selected="isSelected(option) ? 'true' : 'false'"
          @mouseenter="highlightedIndex = index"
          @click="selectOption(option)"
        >
          <RrStatusBadge
            :kind="kind"
            :id="option.id"
            :label="option.name"
            size="sm"
          />
        </button>
      </div>
    </Teleport>

    <RrSelectSheet
      v-if="isCompact"
      :open="sheetOpen"
      :title="sheetTitle"
      :options="sheetOptions"
      :model-value="modelValue ?? ''"
      :multiple="false"
      :searchable="false"
      option-label="name"
      option-value="id"
      :z-index="dropdownZIndex"
      @update:open="onSheetOpenChange"
      @update:model-value="onSheetApply"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { Teleport } from 'vue'
import RrSelectSheet from '../overlays/RrSelectSheet.vue'
import { useCompactViewport } from 'bibli/shared/utils'
import { FLOATING_LAYER_Z_INDEX } from 'bibli/shared/utils/layerZIndex'
import { useRrFloatingDropdown } from './composables/useRrFloatingDropdown'
import RrStatusBadge from './RrStatusBadge.vue'
import './rr-select-surface.css'

export interface RrStatusBadgeSelectOption {
  id: string | number
  name: string
}

const props = withDefaults(defineProps<{
  modelValue?: string | number | null
  options?: RrStatusBadgeSelectOption[]
  kind?: 'registration' | 'signing' | 'onec' | 'auto'
  size?: 'sm' | 'md'
  placeholder?: string
  sheetTitle?: string
  disabled?: boolean
  dropdownZIndex?: number
}>(), {
  modelValue: null,
  options: () => [],
  kind: 'registration',
  size: 'sm',
  placeholder: 'Статус',
  sheetTitle: 'Статус',
  disabled: false,
  dropdownZIndex: FLOATING_LAYER_Z_INDEX,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  change: [value: string | number]
}>()

const anchorRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const dropdownOpen = ref(false)
const sheetOpen = ref(false)
const highlightedIndex = ref(-1)
const isCompact = useCompactViewport()
const listboxId = `rr-status-badge-select-${Math.random().toString(36).slice(2)}`

const panelOpen = computed(() => dropdownOpen.value || sheetOpen.value)

const selected = computed(() =>
  props.options.find((option) => String(option.id) === String(props.modelValue ?? '')) ?? null,
)

const sheetOptions = computed(() =>
  props.options.map((option) => ({ id: option.id, name: option.name })),
)

const {
  placement,
  panelStyles: panelPositionStyles,
  startTracking,
  stopTracking,
} = useRrFloatingDropdown(anchorRef, panelRef, dropdownOpen, {
  estimatedHeight: Math.max(160, props.options.length * 40 + 24),
  maxHeight: 320,
  minWidth: 200,
  widthScale: 0,
  zIndex: props.dropdownZIndex,
})

function isSelected(option: RrStatusBadgeSelectOption): boolean {
  return String(option.id) === String(props.modelValue ?? '')
}

function emitValue(value: string | number) {
  emit('update:modelValue', value)
  emit('change', value)
}

function openDropdown() {
  if (props.disabled) return
  if (isCompact.value) {
    sheetOpen.value = true
    return
  }
  dropdownOpen.value = true
  highlightedIndex.value = Math.max(
    0,
    props.options.findIndex((option) => isSelected(option)),
  )
  nextTick(() => startTracking())
}

function closeDropdown() {
  dropdownOpen.value = false
  sheetOpen.value = false
  highlightedIndex.value = -1
  stopTracking()
}

function togglePanel() {
  if (props.disabled) return
  if (panelOpen.value) {
    closeDropdown()
    return
  }
  openDropdown()
}

function selectOption(option: RrStatusBadgeSelectOption) {
  emitValue(option.id)
  closeDropdown()
}

function onSheetOpenChange(open: boolean) {
  sheetOpen.value = open
}

function onSheetApply(value: string | number | Array<string | number>) {
  const next = Array.isArray(value) ? value[0] : value
  if (next == null || next === '') return
  emitValue(next)
}

function handleClickOutside(event: MouseEvent) {
  if (!dropdownOpen.value || isCompact.value) return
  const target = event.target as Node | null
  if (!target) return
  if (anchorRef.value?.contains(target)) return
  if (panelRef.value?.contains(target)) return
  closeDropdown()
}

function handleKeydown(event: KeyboardEvent) {
  if (!dropdownOpen.value) return
  if (event.key === 'Escape') {
    event.preventDefault()
    closeDropdown()
    return
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    highlightedIndex.value = Math.min(highlightedIndex.value + 1, props.options.length - 1)
    return
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
    return
  }
  if (event.key === 'Enter' && highlightedIndex.value >= 0) {
    event.preventDefault()
    const option = props.options[highlightedIndex.value]
    if (option) selectOption(option)
  }
}

watch(isCompact, (compact) => {
  if (compact && dropdownOpen.value) closeDropdown()
  if (!compact && sheetOpen.value) sheetOpen.value = false
})

if (typeof document !== 'undefined') {
  document.addEventListener('mousedown', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
}

onBeforeUnmount(() => {
  stopTracking()
  document.removeEventListener('mousedown', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.rr-status-badge-select {
  display: inline-flex;
  align-items: center;
  align-self: center;
  max-width: 100%;
  min-width: 0;
  height: auto;
  vertical-align: middle;
}

.rr-status-badge-select__trigger {
  display: inline-flex;
  align-items: center;
  align-self: center;
  max-width: 100%;
  min-width: 0;
  height: auto;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  line-height: 0;
}

.rr-status-badge-select__trigger :deep(.rr-status-badge) {
  align-self: center;
  height: auto;
  flex: 0 0 auto;
}

.rr-status-badge-select--disabled .rr-status-badge-select__trigger {
  cursor: not-allowed;
  opacity: 0.55;
}

.rr-status-badge-select__trigger:focus-visible {
  outline: 2px solid var(--rr-border-info-soft-2, #93c5fd);
  outline-offset: 2px;
  border-radius: 999px;
}

.rr-status-badge-select__panel {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 2px;
  border-radius: 12px;
  background: var(--rr-backgrounds-primary, #fff);
  overflow: auto;
}

.rr-status-badge-select__option {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 6px 8px;
  border: none;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.rr-status-badge-select__option:hover,
.rr-status-badge-select__option--highlighted {
  background: var(--rr-backgrounds-quaternary, #f2f3f7);
}

.rr-status-badge-select__option:focus-visible {
  outline: 2px solid var(--rr-border-info-soft-2, #93c5fd);
  outline-offset: -2px;
}
</style>
