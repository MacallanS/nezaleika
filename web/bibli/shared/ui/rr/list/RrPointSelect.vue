<template>
  <div
    ref="anchorRef"
    class="rr-point-select"
    :class="{
      'rr-point-select--disabled': disabled,
      'rr-point-select--open': panelOpen,
    }"
  >
    <div
      class="rr-point-select__trigger"
      role="combobox"
      :aria-expanded="panelOpen ? 'true' : 'false'"
      aria-haspopup="listbox"
      :aria-controls="listboxId"
      :aria-disabled="disabled ? 'true' : 'false'"
      @click="onTriggerClick"
    >
      <div class="rr-point-select__value">
        <span v-if="selectedOption" class="rr-point-select__primary">{{ getOptionName(selectedOption) }}</span>
        <span v-else class="rr-point-select__placeholder">{{ placeholder }}</span>
      </div>
      <button
        type="button"
        class="rr-point-select__arrow"
        :class="{ 'rr-point-select__arrow--open': panelOpen }"
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
        class="rr-point-select__panel rr-select-surface"
        :class="{ 'rr-point-select__panel--above': placement === 'above' }"
        :style="panelPositionStyles"
        @mousedown.stop
      >
        <div class="rr-point-select__search">
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            class="rr-point-select__search-input"
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
        <RrSelectScroll class="rr-point-select__list">
          <ul class="rr-point-select__options" role="listbox">
            <li
              v-for="(option, index) in filteredOptions"
              :key="String(getOptionValue(option))"
              class="rr-point-select__item"
              :class="{ 'rr-point-select__item--highlighted': index === highlightedIndex }"
              role="option"
              :aria-selected="isSelected(option) ? 'true' : 'false'"
              @mouseenter="highlightedIndex = index"
              @click="selectOption(option)"
            >
              <span class="rr-point-select__icon" aria-hidden="true">
                <RrLocationPinIcon :size="18" />
              </span>
              <span class="rr-point-select__text">
                <span class="rr-point-select__name">{{ getOptionName(option) }}</span>
                <span v-if="getOptionAddress(option)" class="rr-point-select__address">
                  {{ getOptionAddress(option) }}
                </span>
              </span>
              <span
                class="rr-point-select__checkbox"
                :class="{ 'rr-point-select__checkbox--checked': isSelected(option) }"
                aria-hidden="true"
              >
                <svg v-if="isSelected(option)" width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="currentColor"
                    stroke-width="2.4"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
            </li>
            <li v-if="filteredOptions.length === 0" class="rr-point-select__empty">
              Ничего не найдено
            </li>
          </ul>
        </RrSelectScroll>
      </div>
    </Teleport>

    <RrBottomSheet
      v-if="isCompact"
      :model-value="sheetOpen"
      placement="sheet"
      height-mode="fit"
      :height-percent="90"
      :title="sheetTitle"
      :z-index="dropdownZIndex"
      @update:model-value="onSheetOpenChange"
      @close="closeSheet"
    >
      <div class="rr-point-select__sheet">
        <div class="rr-point-select__search rr-point-select__search--sheet">
          <input
            v-model="searchQuery"
            class="rr-point-select__search-input"
            type="search"
            inputmode="search"
            enterkeyhint="search"
            autocomplete="off"
            :placeholder="searchPlaceholder"
          />
        </div>

        <RrSelectScroll class="rr-point-select__list rr-point-select__list--sheet">
          <ul class="rr-point-select__options" role="listbox">
        <li
          v-for="option in filteredOptions"
          :key="`sheet-${String(getOptionValue(option))}`"
          class="rr-point-select__item"
          role="option"
          :aria-selected="isSelected(option) ? 'true' : 'false'"
          @click="selectOption(option, true)"
        >
          <span class="rr-point-select__icon" aria-hidden="true">
            <RrLocationPinIcon :size="18" />
          </span>
          <span class="rr-point-select__text">
            <span class="rr-point-select__name">{{ getOptionName(option) }}</span>
            <span v-if="getOptionAddress(option)" class="rr-point-select__address">
              {{ getOptionAddress(option) }}
            </span>
          </span>
          <span
            class="rr-point-select__checkbox"
            :class="{ 'rr-point-select__checkbox--checked': isSelected(option) }"
            aria-hidden="true"
          >
            <svg v-if="isSelected(option)" width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 6L9 17l-5-5"
                stroke="currentColor"
                stroke-width="2.4"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
        </li>
        <li v-if="filteredOptions.length === 0" class="rr-point-select__empty">
          Ничего не найдено
        </li>
          </ul>
        </RrSelectScroll>
      </div>
    </RrBottomSheet>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { Teleport } from 'vue'
import RrBottomSheet from '../overlays/RrBottomSheet.vue'
import { useCompactViewport } from 'bibli/shared/utils'
import { FLOATING_LAYER_Z_INDEX } from 'bibli/shared/utils/layerZIndex'
import { useRrFloatingDropdown } from './composables/useRrFloatingDropdown'
import RrLocationPinIcon from './RrLocationPinIcon.vue'
import RrSelectScroll from './RrSelectScroll.vue'
import './rr-select-surface.css'

type PointOption = Record<string, unknown> | string | number

const props = withDefaults(defineProps<{
  modelValue?: string | number
  options?: PointOption[]
  placeholder?: string
  sheetTitle?: string
  searchPlaceholder?: string
  disabled?: boolean
  optionLabel?: string
  optionValue?: string
  optionAddress?: string
  dropdownZIndex?: number
  minPanelWidth?: number
  maxPanelHeight?: number
}>(), {
  modelValue: '',
  options: () => [],
  placeholder: 'Все',
  sheetTitle: 'Точка',
  searchPlaceholder: 'Поиск по названию',
  disabled: false,
  optionLabel: 'name',
  optionValue: 'id',
  optionAddress: 'address',
  dropdownZIndex: FLOATING_LAYER_Z_INDEX,
  minPanelWidth: 380,
  maxPanelHeight: 360,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  change: [value: string | number]
}>()

const anchorRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const dropdownOpen = ref(false)
const sheetOpen = ref(false)
const searchQuery = ref('')
const highlightedIndex = ref(-1)
const isCompact = useCompactViewport()
const listboxId = `rr-point-select-${Math.random().toString(36).slice(2)}`

const panelOpen = computed(() => dropdownOpen.value || sheetOpen.value)

const selectableOptions = computed(() =>
  props.options.filter((option) => {
    const value = getOptionValue(option)
    return value !== '' && value != null
  }),
)

const selectedOption = computed(() =>
  selectableOptions.value.find((option) => isSameValue(getOptionValue(option), props.modelValue)) ?? null,
)

const filteredOptions = computed(() => {
  const query = searchQuery.value.trim().toLowerCase().replace(/ё/g, 'е')
  if (!query) return selectableOptions.value

  return selectableOptions.value.filter((option) => {
    const name = getOptionName(option).toLowerCase().replace(/ё/g, 'е')
    const address = getOptionAddress(option).toLowerCase().replace(/ё/g, 'е')
    return name.includes(query) || address.includes(query)
  })
})

const {
  placement,
  panelStyles,
  startTracking,
  stopTracking,
  repositionWhenOpen,
} = useRrFloatingDropdown(anchorRef, panelRef, dropdownOpen, {
  estimatedHeight: 280,
  maxHeight: props.maxPanelHeight,
  minWidth: props.minPanelWidth,
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

function getOptionName(option: PointOption): string {
  if (option == null) return ''
  return typeof option === 'object'
    ? String((option as Record<string, unknown>)[props.optionLabel] ?? '')
    : String(option)
}

function getOptionAddress(option: PointOption): string {
  if (option == null || typeof option !== 'object') return ''
  return String((option as Record<string, unknown>)[props.optionAddress] ?? '').trim()
}

function getOptionValue(option: PointOption): string | number {
  if (option == null) return ''
  return typeof option === 'object'
    ? (option as Record<string, unknown>)[props.optionValue] as string | number
    : option
}

function isSameValue(a: string | number, b: string | number): boolean {
  if (a === '' && b === '') return true
  if (a == null || b == null) return false
  return String(a) === String(b)
}

function isSelected(option: PointOption): boolean {
  return isSameValue(getOptionValue(option), props.modelValue)
}

function emitValue(value: string | number) {
  emit('update:modelValue', value)
  emit('change', value)
}

function focusSearchInput() {
  const input = searchInputRef.value
  if (!input) return
  try {
    input.focus({ preventScroll: true })
  } catch {
    input.focus()
  }
}

function openPanel({ focus = false } = {}) {
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

function closePanel() {
  dropdownOpen.value = false
  sheetOpen.value = false
  highlightedIndex.value = -1
  searchQuery.value = ''
  stopTracking()
}

function closeSheet() {
  sheetOpen.value = false
  searchQuery.value = ''
}

function togglePanel() {
  if (props.disabled) return
  if (panelOpen.value) closePanel()
  else openPanel({ focus: !isCompact.value })
}

function selectOption(option: PointOption, fromSheet = false) {
  if (props.disabled) return
  const value = getOptionValue(option)
  const nextValue = isSelected(option) ? '' : value
  emitValue(nextValue)
  closePanel()
  if (fromSheet) closeSheet()
}

function onTriggerClick() {
  if (props.disabled) return
  // Desktop dropdown и mobile sheet — оба с любой области триггера (не только стрелка).
  togglePanel()
}

function handleSearchInput() {
  handleInput()
}

function handleInput() {
  if (!dropdownOpen.value) openPanel()
  highlightedIndex.value = filteredOptions.value.length ? 0 : -1
  void repositionWhenOpen()
}

function handleKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      if (!dropdownOpen.value) {
        openPanel({ focus: true })
        highlightedIndex.value = filteredOptions.value.length ? 0 : -1
        return
      }
      highlightedIndex.value = Math.min(highlightedIndex.value + 1, filteredOptions.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      if (!dropdownOpen.value) {
        openPanel({ focus: true })
        highlightedIndex.value = filteredOptions.value.length ? filteredOptions.value.length - 1 : -1
        return
      }
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
      break
    case 'Enter':
      if (dropdownOpen.value && highlightedIndex.value >= 0 && highlightedIndex.value < filteredOptions.value.length) {
        event.preventDefault()
        selectOption(filteredOptions.value[highlightedIndex.value])
      }
      break
    case 'Escape':
      if (dropdownOpen.value) {
        event.preventDefault()
        closePanel()
      }
      break
  }
}

function onSheetOpenChange(open: boolean) {
  sheetOpen.value = open
  if (!open) searchQuery.value = ''
}

function handleClickOutside(event: MouseEvent) {
  if (!dropdownOpen.value || isCompact.value) return
  const target = event.target as Node | null
  if (!target) return
  if (anchorRef.value?.contains(target)) return
  if (panelRef.value?.contains(target)) return
  closePanel()
}

watch(isCompact, (compact) => {
  if (compact && dropdownOpen.value) closePanel()
  if (!compact && sheetOpen.value) sheetOpen.value = false
})

watch(() => props.options, () => {
  if (highlightedIndex.value >= filteredOptions.value.length) {
    highlightedIndex.value = filteredOptions.value.length ? filteredOptions.value.length - 1 : -1
  }
})

watch(dropdownOpen, (open) => {
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
</script>

<style scoped>
.rr-point-select {
  --rr-floating-panel-width-scale: 2.4;
  --rr-floating-panel-min-width: 380px;
  position: relative;
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: stretch;
}

.rr-point-select__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  min-height: 48px;
  padding: 0 14px;
  border: 1px solid #e5e7eb;
  border-radius: var(--rr-radius-l, 12px);
  background: var(--rr-backgrounds-quaternary, #f2f3f7);
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    box-shadow 0.15s ease;
}

.rr-point-select:hover:not(.rr-point-select--disabled) .rr-point-select__trigger {
  border-color: color-mix(in srgb, #5b7dec 35%, #e5e7eb);
  background: #eef0f5;
}

.rr-point-select--open .rr-point-select__trigger,
.rr-point-select__trigger:focus,
.rr-point-select__trigger:focus-visible {
  outline: none;
  border-color: var(--rr-labels-brand-primary, #1c4ae5);
  background: var(--rr-backgrounds-primary, #fff);
  box-shadow: 0 0 0 3px color-mix(in srgb, #5b7dec 22%, transparent);
}

.rr-point-select--disabled .rr-point-select__trigger {
  cursor: not-allowed;
  opacity: 0.55;
}

.rr-point-select__value {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
  overflow: hidden;
  line-height: 22px;
}

.rr-point-select__primary,
.rr-point-select__placeholder {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
  line-height: 22px;
}

.rr-point-select__primary {
  color: #101012;
  font-weight: 600;
}

.rr-point-select__placeholder {
  color: #8b919a;
  font-weight: 500;
}

.rr-point-select__arrow {
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
  transition: transform 0.15s ease, background-color 0.15s ease, color 0.15s ease;
}

.rr-point-select__arrow--open {
  transform: rotate(180deg);
}

.rr-point-select__panel {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border-radius: 16px;
  background: #fff;
  box-sizing: border-box;
  overflow: hidden;
}

.rr-point-select__sheet {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rr-point-select__search {
  flex-shrink: 0;
}

.rr-point-select__search--sheet {
  margin-bottom: 0;
}

.rr-point-select__search-input {
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
  outline: none;
  box-sizing: border-box;
}

.rr-point-select__search-input::-webkit-search-decoration,
.rr-point-select__search-input::-webkit-search-cancel-button,
.rr-point-select__search-input::-webkit-search-results-button,
.rr-point-select__search-input::-webkit-search-results-decoration {
  -webkit-appearance: none;
  appearance: none;
}

.rr-point-select__search-input::placeholder {
  color: rgba(60, 60, 67, 0.52);
}

.rr-point-select__search-input:focus {
  box-shadow: inset 0 0 0 1.5px #5b7dec;
}

.rr-point-select__list {
  flex: 1 1 auto;
  min-height: 0;
  max-height: 280px;
}

.rr-point-select__list--sheet {
  max-height: none;
}

.rr-point-select__options {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.rr-point-select__item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.rr-point-select__item:hover,
.rr-point-select__item--highlighted {
  background: #f7f8fa;
}

.rr-point-select__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #f2f3f7;
  color: #8b919a;
}

.rr-point-select__text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
  padding-top: 2px;
}

.rr-point-select__name {
  color: #101012;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
}

.rr-point-select__address {
  color: #8b919a;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.45;
  white-space: normal;
  word-break: break-word;
}

.rr-point-select__checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  margin-top: 9px;
  border: 1.5px solid #d8dbe3;
  border-radius: 6px;
  background: #fff;
  color: #101012;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;
}

.rr-point-select__checkbox--checked {
  border-color: var(--Button-Brand-Primary-Background-Hover, #1c4ae5);
  background: var(--Button-Brand-Primary-Background-Hover, #1c4ae5);
  color: #fff;
}

.rr-point-select__empty {
  padding: 16px 8px;
  color: #8b919a;
  font-size: 14px;
  text-align: center;
}
</style>
