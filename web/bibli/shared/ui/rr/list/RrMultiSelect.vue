<template>
  <div
    v-if="!isHiddenBySingleOption"
    ref="anchorRef"
    class="rr-multi-select"
    :class="{
      'rr-multi-select--disabled': disabled,
      'rr-multi-select--open': panelOpen,
      'rr-multi-select--single': !multiple,
      'rr-multi-select--bare': variant === 'bare',
      'rr-multi-select--field': variant === 'field',
    }"
    @click="onRootClick"
  >
    <div
      class="rr-multi-select__trigger"
      role="combobox"
      :tabindex="disabled ? -1 : 0"
      :aria-expanded="panelOpen ? 'true' : 'false'"
      aria-haspopup="listbox"
      :aria-controls="listboxId"
      :aria-disabled="disabled ? 'true' : 'false'"
      @keydown="onTriggerKeydown"
    >
      <div class="rr-multi-select__value">
        <template v-if="selectedOptions.length">
          <span class="rr-multi-select__primary">{{ getOptionLabel(selectedOptions[0]) }}</span>
          <span v-if="selectedOptions.length > 1" class="rr-multi-select__more">
            +{{ selectedOptions.length - 1 }}
          </span>
        </template>
        <span v-else class="rr-multi-select__placeholder">{{ placeholder }}</span>
      </div>
      <button
        type="button"
        class="rr-multi-select__arrow"
        :class="{ 'rr-multi-select__arrow--open': panelOpen }"
        :disabled="disabled"
        aria-label="Открыть список"
        @click.stop="togglePanel"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>

    <Teleport to="body">
      <div
        v-if="dropdownOpen && !isCompact"
        :id="listboxId"
        ref="panelRef"
        class="rr-multi-select__panel rr-select-surface"
        :class="{ 'rr-multi-select__panel--above': placement === 'above' }"
        :style="panelPositionStyles"
        @mousedown.stop
      >
        <div v-if="showSearch" class="rr-multi-select__search">
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            class="rr-multi-select__search-input"
            type="search"
            inputmode="search"
            enterkeyhint="search"
            autocomplete="off"
            :placeholder="searchPlaceholder"
            :aria-label="searchPlaceholder"
            @keydown="handleKeydown"
            @input="handleSearchInput"
          />
        </div>
        <RrSelectScroll class="rr-multi-select__list">
          <ul
            class="rr-multi-select__options"
            role="listbox"
            :aria-multiselectable="multiple ? 'true' : 'false'"
          >
            <li
              v-for="(option, index) in filteredOptions"
              :key="String(getOptionValue(option))"
              class="rr-multi-select__option"
              :class="{ 'rr-multi-select__option--highlighted': index === highlightedIndex }"
              role="option"
              :aria-selected="isSelected(option) ? 'true' : 'false'"
              @mouseenter="highlightedIndex = index"
              @click="toggleOption(option)"
            >
              <span class="rr-multi-select__option-label">{{ getOptionLabel(option) }}</span>
              <span
                v-if="isSelected(option)"
                class="rr-multi-select__check"
                aria-hidden="true"
              >
                <RrCheckIcon :size="16" />
              </span>
            </li>
            <li v-if="filteredOptions.length === 0" class="rr-multi-select__empty">
              Ничего не найдено
            </li>
          </ul>
        </RrSelectScroll>
      </div>
    </Teleport>

    <RrSelectSheet
      v-if="isCompact"
      :open="sheetOpen"
      :title="sheetTitle"
      :options="options"
      :model-value="sheetModelValue"
      :multiple="multiple"
      :searchable="showSearch"
      :search-placeholder="searchPlaceholder"
      :option-label="optionLabel"
      :option-value="optionValue"
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
import {
  getSingleSelectableValue,
  shouldHideSingleOption,
  strictFuzzyMatch,
  useCompactViewport,
} from 'bibli/shared/utils'
import { FLOATING_LAYER_Z_INDEX } from 'bibli/shared/utils/layerZIndex'
import { useRrFloatingDropdown } from './composables/useRrFloatingDropdown'
import RrCheckIcon from './RrCheckIcon.vue'
import RrSelectScroll from './RrSelectScroll.vue'
import './rr-select-surface.css'

type OptionItem = Record<string, unknown> | string | number
type ModelValue = string | number | Array<string | number>

/** Поиск только если опций больше порога — короткий список и так просматривается целиком. */
const DEFAULT_SEARCH_VISIBLE_AFTER = 7
/** 7×44px + padding панели 16 + запас, чтобы семь строк были без скролла. */
const DEFAULT_MAX_PANEL_HEIGHT = 336

const props = withDefaults(defineProps<{
  modelValue?: ModelValue
  options?: OptionItem[]
  placeholder?: string
  searchPlaceholder?: string
  sheetTitle?: string
  disabled?: boolean
  hideWhenSingle?: boolean
  searchable?: boolean
  /** Показывать поиск, если опций больше этого числа (0 = всегда при searchable). */
  searchVisibleAfter?: number
  multiple?: boolean
  optionLabel?: string
  optionValue?: string
  dropdownZIndex?: number
  minPanelWidth?: number
  maxPanelHeight?: number
  panelWidthScale?: number
  /**
   * field — видимое поле ввода (рамка + фон), как AuthRR / дизайн форм.
   * bare — только текст+стрелка (чипы фильтров, компактный тулбар).
   */
  variant?: 'field' | 'bare'
}>(), {
  modelValue: undefined,
  options: () => [],
  placeholder: 'Выберите',
  searchPlaceholder: 'Поиск по названию',
  sheetTitle: 'Метки',
  disabled: false,
  hideWhenSingle: false,
  searchable: true,
  searchVisibleAfter: DEFAULT_SEARCH_VISIBLE_AFTER,
  multiple: true,
  optionLabel: 'name',
  optionValue: 'id',
  dropdownZIndex: FLOATING_LAYER_Z_INDEX,
  minPanelWidth: 0,
  maxPanelHeight: 336,
  variant: 'field',
})

const emit = defineEmits<{
  'update:modelValue': [value: ModelValue]
  change: [value: ModelValue]
}>()

const anchorRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const dropdownOpen = ref(false)
const sheetOpen = ref(false)
const searchQuery = ref('')
const highlightedIndex = ref(-1)
const isCompact = useCompactViewport()
const listboxId = `rr-multi-select-${Math.random().toString(36).slice(2)}`

const panelOpen = computed(() => dropdownOpen.value || sheetOpen.value)

const showSearch = computed(
  () => props.searchable && props.options.length > props.searchVisibleAfter,
)

const isHiddenBySingleOption = computed(() =>
  shouldHideSingleOption(props.options, {
    hideWhenSingle: props.hideWhenSingle,
    multiple: props.multiple,
    loading: false,
    optionLabel: props.optionLabel,
    optionValue: props.optionValue,
  }),
)

const selectedValues = computed<Array<string | number>>(() => {
  if (props.multiple) {
    return Array.isArray(props.modelValue) ? props.modelValue : []
  }
  if (props.modelValue === null || props.modelValue === undefined || props.modelValue === '') return []
  return [props.modelValue as string | number]
})

const sheetModelValue = computed(() => {
  if (props.multiple) {
    return selectedValues.value
  }
  return props.modelValue ?? ''
})

const selectedOptions = computed(() =>
  props.options.filter((option: OptionItem) =>
    selectedValues.value.some((value: string | number) => isSameValue(value, getOptionValue(option))),
  ),
)

const filteredOptions = computed(() => {
  const query = searchQuery.value.trim()
  if (!query) return props.options
  return props.options.filter((option: OptionItem) => strictFuzzyMatch(getOptionLabel(option), query))
})

const {
  placement,
  panelStyles,
  startTracking,
  stopTracking,
  repositionWhenOpen,
} = useRrFloatingDropdown(anchorRef, panelRef, dropdownOpen, {
  estimatedHeight: DEFAULT_MAX_PANEL_HEIGHT,
  maxHeight: props.maxPanelHeight,
  minWidth: props.minPanelWidth,
  widthScale: props.panelWidthScale,
  zIndex: props.dropdownZIndex,
})

const panelPositionStyles = computed(() => {
  const styles = panelStyles.value
  return {
    position: styles.position,
    top: styles.top,
    bottom: styles.bottom,
    left: styles.left,
    width: styles.width,
    maxHeight: styles.maxHeight,
    marginTop: styles.marginTop,
    marginBottom: styles.marginBottom,
    zIndex: styles.zIndex,
  }
})

function getOptionLabel(option: OptionItem): string {
  if (option == null) return ''
  return typeof option === 'object'
    ? String((option as Record<string, unknown>)[props.optionLabel] ?? '')
    : String(option)
}

function getOptionValue(option: OptionItem): string | number {
  if (option == null) return ''
  return typeof option === 'object'
    ? (option as Record<string, unknown>)[props.optionValue] as string | number
    : option
}

function isSameValue(a: string | number, b: string | number): boolean {
  return String(a) === String(b)
}

function isEmptySingleValue(value: unknown): boolean {
  return value === '' || value === null || value === undefined
}

function isSelected(option: OptionItem): boolean {
  const value = getOptionValue(option)
  if (!props.multiple && isEmptySingleValue(props.modelValue)) {
    return isEmptySingleValue(value)
  }
  return selectedValues.value.some((selected: string | number) => isSameValue(selected, value))
}

function emitValue(value: ModelValue) {
  emit('update:modelValue', value)
  emit('change', value)
}

function focusSearchInput() {
  if (!showSearch.value) return
  const input = searchInputRef.value
  if (!input) return
  try {
    input.focus({ preventScroll: true })
  } catch {
    input.focus()
  }
}

function openDropdown({ focus = false } = {}) {
  if (props.disabled) return
  if (isCompact.value) {
    sheetOpen.value = true
    return
  }
  searchQuery.value = ''
  dropdownOpen.value = true
  startTracking()
  void repositionWhenOpen()
  if (focus) {
    void nextTick(() => focusSearchInput())
  }
}

function closeDropdown() {
  dropdownOpen.value = false
  sheetOpen.value = false
  highlightedIndex.value = -1
  searchQuery.value = ''
  stopTracking()
}

function togglePanel() {
  if (props.disabled) return
  if (panelOpen.value) {
    closeDropdown()
  } else {
    openDropdown({ focus: !isCompact.value })
  }
}

function toggleOption(option: OptionItem) {
  if (props.disabled) return
  const value = getOptionValue(option)

  if (!props.multiple) {
    emitValue(value)
    closeDropdown()
    return
  }

  const current = [...selectedValues.value]
  const index = current.findIndex((selected: string | number) => isSameValue(selected, value))
  if (index >= 0) {
    current.splice(index, 1)
  } else {
    current.push(value)
  }
  emitValue(current)
  highlightedIndex.value = -1
  searchQuery.value = ''
  void repositionWhenOpen()
  void nextTick(() => focusSearchInput())
}

function handleSearchInput() {
  handleInput()
}

function onRootClick(event: MouseEvent) {
  if (props.disabled) return
  // Стрелка уже вызывает togglePanel со своим @click.stop.
  if ((event.target as HTMLElement).closest('.rr-multi-select__arrow')) return
  // Desktop dropdown и mobile sheet — оба открываются с любой области триггера.
  togglePanel()
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (props.disabled || event.target !== event.currentTarget) return
  if (!['Enter', ' ', 'ArrowDown'].includes(event.key)) return
  event.preventDefault()
  event.stopPropagation()
  togglePanel()
}

function handleInput() {
  if (!dropdownOpen.value) openDropdown()
  highlightedIndex.value = filteredOptions.value.length ? 0 : -1
  void repositionWhenOpen()
}

function handleKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      if (!dropdownOpen.value) {
        openDropdown({ focus: true })
        highlightedIndex.value = filteredOptions.value.length ? 0 : -1
        return
      }
      highlightedIndex.value = Math.min(highlightedIndex.value + 1, filteredOptions.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      if (!dropdownOpen.value) {
        openDropdown({ focus: true })
        highlightedIndex.value = filteredOptions.value.length ? filteredOptions.value.length - 1 : -1
        return
      }
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
      break
    case 'Enter':
      if (dropdownOpen.value && highlightedIndex.value >= 0 && highlightedIndex.value < filteredOptions.value.length) {
        event.preventDefault()
        toggleOption(filteredOptions.value[highlightedIndex.value])
      }
      break
    case 'Escape':
      if (dropdownOpen.value) {
        event.preventDefault()
        closeDropdown()
      }
      break
  }
}

function onSheetOpenChange(open: boolean) {
  sheetOpen.value = open
}

function onSheetApply(value: ModelValue) {
  if (props.multiple) {
    emitValue(Array.isArray(value) ? value : [])
    return
  }
  if (Array.isArray(value)) {
    emitValue(value[0] ?? '')
    return
  }
  emitValue(value)
}

function handleClickOutside(event: MouseEvent) {
  if (!dropdownOpen.value || isCompact.value) return
  const target = event.target as Node | null
  if (!target) return
  if (anchorRef.value?.contains(target)) return
  if (panelRef.value?.contains(target)) return
  closeDropdown()
}

function applySingleOptionIfNeeded() {
  if (!props.hideWhenSingle) return
  const value = getSingleSelectableValue(props.options, props.optionLabel, props.optionValue)
  if (value == null) return
  if (props.multiple) {
    if (!selectedValues.value.some((selected: string | number) => isSameValue(selected, value))) {
      emitValue([value])
    }
    return
  }
  if (props.modelValue !== value) {
    emitValue(value)
  }
}

watch(isCompact, (compact: boolean) => {
  if (compact && dropdownOpen.value) closeDropdown()
  if (!compact && sheetOpen.value) sheetOpen.value = false
})

watch(() => props.options, () => {
  applySingleOptionIfNeeded()
  if (highlightedIndex.value >= filteredOptions.value.length) {
    highlightedIndex.value = filteredOptions.value.length ? filteredOptions.value.length - 1 : -1
  }
})

watch(() => props.hideWhenSingle, applySingleOptionIfNeeded)

watch(dropdownOpen, (open: boolean) => {
  if (!open) stopTracking()
  if (open && highlightedIndex.value < 0 && filteredOptions.value.length) {
    highlightedIndex.value = 0
  }
})

if (typeof document !== 'undefined') {
  document.addEventListener('mousedown', handleClickOutside)
}

onBeforeUnmount(() => {
  stopTracking()
  document.removeEventListener('mousedown', handleClickOutside)
})

applySingleOptionIfNeeded()
</script>

<style scoped>
.rr-multi-select {
  position: relative;
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: stretch;
  cursor: pointer;
}

.rr-multi-select--disabled {
  cursor: not-allowed;
}

.rr-multi-select__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-width: 0;
  flex: 1;
  box-sizing: border-box;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    box-shadow 0.15s ease;
}

/* Видимое поле — как input в RR-дизайне (не «голый» текст). */
.rr-multi-select--field .rr-multi-select__trigger {
  min-height: 48px;
  padding: 0 14px;
  border: 1px solid #e5e7eb;
  border-radius: var(--rr-radius-l, 12px);
  background: var(--rr-backgrounds-quaternary, #f2f3f7);
}

.rr-multi-select--field:hover:not(.rr-multi-select--disabled) .rr-multi-select__trigger {
  border-color: color-mix(in srgb, #5b7dec 35%, #e5e7eb);
  background: #eef0f5;
}

.rr-multi-select--field.rr-multi-select--open .rr-multi-select__trigger,
.rr-multi-select--field .rr-multi-select__trigger:focus,
.rr-multi-select--field .rr-multi-select__trigger:focus-visible {
  outline: none;
  border-color: var(--rr-labels-brand-primary, #1c4ae5);
  background: var(--rr-backgrounds-primary, #fff);
  box-shadow: 0 0 0 3px color-mix(in srgb, #5b7dec 22%, transparent);
}

.rr-multi-select--bare .rr-multi-select__trigger {
  min-height: 0;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.rr-multi-select--disabled .rr-multi-select__trigger {
  cursor: not-allowed;
  opacity: 0.55;
}

.rr-multi-select__value {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
  overflow: hidden;
  line-height: 20px;
}

.rr-multi-select__primary {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #101012;
  font-size: 15px;
  font-weight: 600;
  line-height: 22px;
}

.rr-multi-select--bare .rr-multi-select__primary {
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}

.rr-multi-select__more {
  flex-shrink: 0;
  color: #8b919a;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}

.rr-multi-select__placeholder {
  color: #8b919a;
  font-size: 15px;
  font-weight: 500;
  line-height: 22px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rr-multi-select--bare .rr-multi-select__placeholder {
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
}

.rr-multi-select__arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: color-mix(in srgb, #101012 6%, transparent);
  color: #5f6673;
  cursor: pointer;
  transition: transform 0.18s ease, background-color 0.15s ease, color 0.15s ease;
}

.rr-multi-select--bare .rr-multi-select__arrow {
  width: 16px;
  height: 16px;
  border-radius: 0;
  background: transparent;
  color: #8b919a;
}

.rr-multi-select--field:hover:not(.rr-multi-select--disabled) .rr-multi-select__arrow {
  background: color-mix(in srgb, #101012 10%, transparent);
  color: #101012;
}

.rr-multi-select__arrow--open {
  transform: rotate(180deg);
}

.rr-multi-select__panel {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: #fff;
  border-radius: var(--rr-radius-l, 12px);
  overflow: hidden;
  min-width: 0;
  box-sizing: border-box;
}

.rr-multi-select__search {
  flex-shrink: 0;
}

.rr-multi-select__search-input {
  display: block;
  width: 100%;
  min-height: 44px;
  padding: 0 14px;
  border: none;
  border-radius: 12px;
  background: #f2f3f7;
  color: #101012;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  outline: none;
  box-sizing: border-box;
}

.rr-multi-select__search-input::-webkit-search-decoration,
.rr-multi-select__search-input::-webkit-search-cancel-button,
.rr-multi-select__search-input::-webkit-search-results-button,
.rr-multi-select__search-input::-webkit-search-results-decoration {
  -webkit-appearance: none;
  appearance: none;
}

.rr-multi-select__search-input::placeholder {
  color: rgba(60, 60, 67, 0.52);
  font-weight: 400;
}

.rr-multi-select__search-input:focus {
  box-shadow: inset 0 0 0 1.5px #5b7dec;
}

.rr-multi-select__list {
  flex: 1;
  min-height: 0;
}

.rr-multi-select__options {
  list-style: none;
  margin: 0;
  padding: 0;
}

.rr-multi-select__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 44px;
  padding: 0 16px;
  border-radius: var(--rr-radius-l, 12px);
  cursor: pointer;
  transition: background-color 0.12s ease;
}

.rr-multi-select__option:hover,
.rr-multi-select__option--highlighted {
  background: #f8f9fb;
}

.rr-multi-select__option[aria-selected="true"],
.rr-multi-select__option[aria-selected="true"]:hover,
.rr-multi-select__option[aria-selected="true"].rr-multi-select__option--highlighted {
  background: var(--Backgrounds-Quaternary, #F2F3F7);
}

.rr-multi-select__option-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #101012;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.35;
}

.rr-multi-select__checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: 1.5px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  flex-shrink: 0;
  color: #101012;
}

.rr-multi-select__checkbox--checked {
  border-color: var(--Button-Brand-Primary-Background-Hover, #1c4ae5);
  background: var(--Button-Brand-Primary-Background-Hover, #1c4ae5);
  color: #fff;
}

.rr-multi-select__check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  color: var(--Button-Brand-Primary-Background-Hover, #1c4ae5);
}

.rr-multi-select__empty {
  padding: 20px 16px;
  color: #8b919a;
  font-size: 14px;
  text-align: center;
}
</style>
