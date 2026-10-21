<template>
  <div v-if="!isHiddenBySingleOption" class="status-select-wrapper" ref="wrapperRef">
    <label v-if="label" :for="id" class="status-select-label">{{ label }}</label>

    <div class="status-select-container" :class="{
      'has-error': error,
      'disabled': disabled,
      'multiple': multiple,
      'compact-multiple': multiple && compactMultiple,
    }">
      <div class="status-select-trigger" :class="{ 'open': dropdownOpen || sheetOpen, 'has-value': hasValue, 'disabled': disabled }"
        @click="toggleDropdown">
        <div class="status-select-content">
          <!-- Мультивыбор: показываем теги -->
          <template v-if="multiple">
            <div v-if="compactMultiple && selectedOptions.length > 0" class="status-select-selected status-select-compact-multiple">
              <span class="status-text">{{ getOptionLabel(selectedOptions[0]) }}</span>
              <span v-if="selectedOptions.length > 1" class="status-select-more">
                +{{ selectedOptions.length - 1 }}
              </span>
            </div>
            <div v-else-if="!compactMultiple && selectedOptions.length > 0" class="status-select-tags">
              <div v-for="option in selectedOptions" :key="getOptionValue(option)" class="status-tag"
                @click.stop="removeOption(option)">
                <span v-if="option.color" class="status-color-dot" :style="{ backgroundColor: option.color }"></span>
                <span class="tag-text">{{ getOptionLabel(option) }}</span>
                <svg class="tag-remove" width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
              </div>
            </div>
            <span v-else class="status-select-placeholder">{{ placeholder }}</span>
          </template>

          <!-- Одиночный выбор -->
          <template v-else>
            <input
              v-if="showInlineSearchInput"
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              inputmode="search"
              :placeholder="placeholder"
              class="status-select-inline-input"
              @focus="onSearchFocus"
              @input="onSearchInput"
              @click.stop
            />
            <div v-if="modelValue && selectedOption && !showInlineSearchInput && statusBadges" class="status-select-selected status-select-selected--badge">
              <RrStatusBadge
                kind="signing"
                :id="getOptionValue(selectedOption)"
                :label="getOptionLabel(selectedOption)"
                size="sm"
              />
            </div>
            <div v-else-if="modelValue && selectedOption && !showInlineSearchInput" class="status-select-selected">
              <span v-if="selectedOption.color" class="status-color-dot"
                :style="{ backgroundColor: selectedOption.color }"></span>
              <span class="status-text">{{ getOptionLabel(selectedOption) }}</span>
            </div>
            <div v-else-if="showInlineSearchInput && selectedOption && !searchQuery" class="status-select-selected status-select-selected--overlay">
              <span v-if="selectedOption.color" class="status-color-dot"
                :style="{ backgroundColor: selectedOption.color }"></span>
              <span class="status-text">{{ getOptionLabel(selectedOption) }}</span>
            </div>
            <span v-else-if="!showInlineSearchInput" class="status-select-placeholder">{{ placeholder }}</span>
          </template>
        </div>

        <div class="status-select-arrow" :class="{ 'rotated': dropdownOpen || sheetOpen }">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
        </div>
      </div>

      <Teleport to="body">
        <div v-if="dropdownOpen && !isCompact" ref="dropdownRef" class="status-select-dropdown"
          :class="{ 'dropdown-upward': openUpward }" :style="dropdownStyles">
          <div class="status-select-search" v-if="searchable && !showInlineSearchInput">
            <div class="search-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <input ref="searchInput" v-model="searchQuery" type="text" inputmode="search" placeholder="Поиск..." class="search-input"
              @focus="onSearchFocus" @input="onSearchInput" />
          </div>

          <RrSelectScroll class="status-select-options">
            <div v-for="(option, index) in filteredOptions" :key="getOptionValue(option)" class="status-select-option"
              :class="{
                'selected': isOptionSelected(option),
                'highlighted': index === highlightedIndex
              }" @click="selectOption(option)" @mouseenter="highlightedIndex = index">
              <RrStatusBadge
                v-if="statusBadges"
                kind="signing"
                :id="getOptionValue(option)"
                :label="getOptionLabel(option)"
                size="sm"
              />
              <span v-else-if="option.color" class="status-color-dot"
                :style="{ backgroundColor: option.color }"></span>
              <span v-if="!statusBadges" class="option-text">{{ getOptionLabel(option) }}</span>
              <div v-if="isOptionSelected(option)" class="check-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
              </div>
            </div>

            <div v-if="filteredOptions.length === 0" class="no-options">
              <div class="no-options-icon">🔍</div>
              <span>Ничего не найдено</span>
            </div>
          </RrSelectScroll>
        </div>
      </Teleport>
      <RrSelectSheet
        v-if="isCompact"
        :open="sheetOpen"
        :title="label || placeholder || 'Выберите'"
        :options="options"
        :model-value="modelValue"
        :multiple="multiple"
        :searchable="searchable"
        :option-label="optionLabel"
        :option-value="optionValue"
        :z-index="dropdownZIndex"
        @update:open="onSheetOpenChange"
        @update:model-value="onSheetApply"
      />
    </div>

    <div v-if="error" class="status-select-error">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { Teleport } from 'vue';
import {
  strictFuzzyMatch,
  buildFixedFloatingStyles,
  computeFloatingPlacement,
  getFloatingPanelMinWidth,
  getFloatingPanelWidthScale,
  getMobileFiltersBounds,
  getSingleSelectableValue,
  shouldHideSingleOption,
  useCompactViewport,
  FLOATING_LAYER_Z_INDEX,
} from 'bibli/shared/utils';
import { RrSelectSheet, RrSelectScroll, RrStatusBadge } from 'bibli/shared/ui/rr';

const props = defineProps({
  modelValue: [String, Number, Array],
  options: {
    type: Array,
    required: true,
    default: () => []
  },
  label: String,
  placeholder: {
    type: String,
    default: 'Выберите статус'
  },
  error: String,
  disabled: Boolean,
  required: Boolean,
  id: String,
  optionLabel: {
    type: String,
    default: 'name'
  },
  optionValue: {
    type: String,
    default: 'id'
  },
  searchable: {
    type: Boolean,
    default: false
  },
  disableAutoPosition: {
    type: Boolean,
    default: false
  },
  clearable: {
    type: Boolean,
    default: false
  },
  multiple: {
    type: Boolean,
    default: false
  },
  compactMultiple: {
    type: Boolean,
    default: false,
  },
  hideWhenSingle: {
    type: Boolean,
    default: false,
  },
  dropdownZIndex: {
    type: Number,
    default: FLOATING_LAYER_Z_INDEX,
  },
  statusBadges: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue', 'change']);

const isHiddenBySingleOption = computed(() =>
  shouldHideSingleOption(props.options, {
    hideWhenSingle: props.hideWhenSingle,
    multiple: props.multiple,
    loading: false,
    optionLabel: props.optionLabel,
    optionValue: props.optionValue,
  }),
);

function applySingleOptionIfNeeded() {
  if (!props.hideWhenSingle || props.multiple) {
    return;
  }
  const value = getSingleSelectableValue(
    props.options,
    props.optionLabel,
    props.optionValue,
  );
  if (value == null) {
    return;
  }
  if (!isSameValue(props.modelValue, value)) {
    emit('update:modelValue', value);
    emit('change', value);
  }
}

const wrapperRef = ref(null);
const searchInput = ref(null);
const dropdownRef = ref(null);
const dropdownOpen = ref(false);
const sheetOpen = ref(false);
const highlightedIndex = ref(-1);
const searchQuery = ref('');
const openUpward = ref(false);
const dropdownStyles = ref({});
const isCompact = useCompactViewport();
const showInlineSearchInput = computed(() => props.searchable && !props.multiple && !isCompact.value);

const selectedValues = computed(() => {
  if (!props.modelValue) return [];
  if (props.multiple) {
    return Array.isArray(props.modelValue) ? props.modelValue : [];
  }
  return [props.modelValue];
});

const selectedOption = computed(() => {
  if (!props.modelValue || props.multiple) return null;
  return props.options.find(opt => getOptionValue(opt) == props.modelValue);
});

const selectedOptions = computed(() => {
  if (!props.multiple || !props.modelValue) return [];
  const values = Array.isArray(props.modelValue) ? props.modelValue : [];
  return props.options.filter(opt => values.includes(getOptionValue(opt)));
});

const hasValue = computed(() => {
  if (props.multiple) {
    return selectedOptions.value.length > 0;
  }
  return !!props.modelValue;
});

function syncSearchQueryFromSelection() {
  if (!showInlineSearchInput.value) return;
  searchQuery.value = selectedOption.value ? String(getOptionLabel(selectedOption.value)) : '';
}

const filteredOptions = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.options;
  }

  const query = searchQuery.value.trim();
  return props.options.filter(option => {
    const label = getOptionLabel(option);
    return strictFuzzyMatch(label, query);
  });
});

function getOptionLabel(option) {
  if (!option) return '';
  return typeof option === 'object' ? option[props.optionLabel] : option;
}

function getOptionValue(option) {
  if (!option) return '';
  return typeof option === 'object' ? option[props.optionValue] : option;
}

function isSameValue(a, b) {
  return String(a) === String(b);
}

function isOptionSelected(option) {
  const value = getOptionValue(option);
  if (props.multiple) {
    return selectedValues.value.some(selected => isSameValue(selected, value));
  }
  return isSameValue(value, props.modelValue);
}

const DROPDOWN_MIN_WIDTH = 180
const DROPDOWN_VIEWPORT_PADDING = 8

function calculateDropdownPosition() {
  if (!wrapperRef.value) return;

  const rect = wrapperRef.value.getBoundingClientRect();
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
  const isMobile = viewportWidth <= 768;

  const maxDropdownHeight = isMobile ? 400 : 300;
  const dropdownHeight = Math.min(maxDropdownHeight, props.options.length * 50 + 100);

  const filtersBounds = getMobileFiltersBounds(wrapperRef.value);
  const widthScale = getFloatingPanelWidthScale(wrapperRef.value);
  const minWidth = getFloatingPanelMinWidth(wrapperRef.value, DROPDOWN_MIN_WIDTH);
  const placementResult = computeFloatingPlacement(rect, {
    estimatedHeight: dropdownHeight,
    maxHeight: maxDropdownHeight,
    padding: DROPDOWN_VIEWPORT_PADDING,
    minWidth,
    widthScale,
    containerRect: filtersBounds,
  });

  openUpward.value = props.disableAutoPosition
    ? false
    : placementResult.placement === 'above';

  const baseZIndex = props.dropdownZIndex;

  if (openUpward.value) {
    dropdownStyles.value = {
      ...buildFixedFloatingStyles(rect, placementResult, {
        padding: DROPDOWN_VIEWPORT_PADDING,
        containerRect: filtersBounds,
        zIndex: baseZIndex,
      }),
      right: 'auto',
    };
  } else {
    dropdownStyles.value = {
      position: 'fixed',
      top: `${placementResult.top ?? rect.bottom + DROPDOWN_VIEWPORT_PADDING}px`,
      bottom: 'auto',
      left: `${placementResult.left}px`,
      right: 'auto',
      width: `${placementResult.width}px`,
      zIndex: baseZIndex,
      maxHeight: `${placementResult.maxHeight}px`
    };
  }
}

function toggleDropdown() {
  if (props.disabled) return;

  if (isCompact.value) {
    sheetOpen.value = !sheetOpen.value;
    return;
  }

  if (showInlineSearchInput.value) {
    if (!dropdownOpen.value) {
      openDropdown();
    }
    return;
  }

  if (dropdownOpen.value) {
    closeDropdown();
  } else {
    openDropdown();
  }
}

function openDropdown() {
  if (isCompact.value) {
    sheetOpen.value = true;
    return;
  }
  calculateDropdownPosition();
  dropdownOpen.value = true;
  highlightedIndex.value = -1;
  if (!showInlineSearchInput.value) {
    searchQuery.value = '';
  }

  nextTick(() => {
    if ((props.searchable || showInlineSearchInput.value) && searchInput.value) {
      if (searchInput.value.focus) {
        try {
          searchInput.value.focus({ preventScroll: true });
        } catch (e) {
          searchInput.value.focus();
        }
      }
    }
  });
}

function closeDropdown() {
  dropdownOpen.value = false;
  sheetOpen.value = false;
  highlightedIndex.value = -1;
  if (!showInlineSearchInput.value) {
    searchQuery.value = '';
  } else {
    syncSearchQueryFromSelection();
  }
}

function onSheetOpenChange(open) {
  sheetOpen.value = open;
}

function onSheetApply(value) {
  emit('update:modelValue', value);
  emit('change', value);
}

function selectOption(option) {
  const value = getOptionValue(option);

  if (props.multiple) {
    const currentValues = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    const index = currentValues.findIndex(selected => isSameValue(selected, value));

    if (index > -1) {
      currentValues.splice(index, 1);
    } else {
      currentValues.push(value);
    }

    emit('update:modelValue', currentValues);
    emit('change', currentValues);
    highlightedIndex.value = -1;
  } else {
    emit('update:modelValue', value);
    emit('change', value);
    searchQuery.value = String(getOptionLabel(option));
    closeDropdown();
  }
}

function removeOption(option) {
  if (props.disabled || !props.multiple) return;

  const value = getOptionValue(option);
  const currentValues = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
  const index = currentValues.findIndex(selected => isSameValue(selected, value));

  if (index > -1) {
    currentValues.splice(index, 1);
    emit('update:modelValue', currentValues);
    emit('change', currentValues);
  }
}

function onSearchFocus() {
  if (!dropdownOpen.value) {
    openDropdown();
  }
  if (showInlineSearchInput.value && searchInput.value?.select) {
    searchInput.value.select();
  }
}

function onSearchInput() {
  highlightedIndex.value = -1;
}

function handleClickOutside(event) {
  if (sheetOpen.value) return;
  if (wrapperRef.value && !wrapperRef.value.contains(event.target) &&
      dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    closeDropdown();
  }
}

function handleKeydown(event) {
  if (!dropdownOpen.value) return;

  switch (event.key) {
    case 'Escape':
      closeDropdown();
      break;
    case 'ArrowDown':
      event.preventDefault();
      if (highlightedIndex.value < filteredOptions.value.length - 1) {
        highlightedIndex.value++;
      }
      break;
    case 'ArrowUp':
      event.preventDefault();
      if (highlightedIndex.value > 0) {
        highlightedIndex.value--;
      }
      break;
    case 'Enter':
      event.preventDefault();
      if (highlightedIndex.value >= 0 && highlightedIndex.value < filteredOptions.value.length) {
        selectOption(filteredOptions.value[highlightedIndex.value]);
      }
      break;
  }
}

function handleResize() {
  if (dropdownOpen.value) {
    calculateDropdownPosition();
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', handleResize, true);
  applySingleOptionIfNeeded();
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside);
  document.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('scroll', handleResize, true);
});

watch(() => props.modelValue, () => {
  syncSearchQueryFromSelection();
});

watch(() => props.options, () => {
  applySingleOptionIfNeeded();
  syncSearchQueryFromSelection();
});

watch(() => props.hideWhenSingle, () => {
  applySingleOptionIfNeeded();
});

watch(isCompact, (compact) => {
  if (!compact && sheetOpen.value) {
    sheetOpen.value = false;
  }
  if (compact && dropdownOpen.value) {
    closeDropdown();
  }
  if (!compact) {
    syncSearchQueryFromSelection();
  }
});

syncSearchQueryFromSelection();
</script>

<style scoped>
.status-select-wrapper {
  position: relative;
  width: 100%;
  font-family: var(--russ-font-family);
  overflow: visible;
}

.status-select-label {
  display: block;
  margin-bottom: 8px;
  font-size: var(--status-select-label-font-size, 14px);
  font-weight: var(--status-select-label-font-weight, 600);
  color: var(--russ-text-secondary);
  line-height: var(--status-select-label-line-height, 1.4);
}

.status-select-container {
  position: relative;
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.status-select-trigger {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  min-height: var(--status-select-height, var(--ui-control-height, var(--filter-control-height, var(--filter-control-height-md, 40px))));
  padding: var(--status-select-padding, 6px var(--filter-control-padding-x, 12px));
  background: var(--russ-bg);
  border: 1px solid var(--russ-border);
  border-radius: var(--status-select-radius, var(--filter-control-radius, 10px));
  font-family: var(--filter-control-font-family, var(--russ-font-family));
  font-size: var(--status-select-font-size, var(--filter-control-font-size, var(--filter-control-font-size-md, 14px)));
  font-weight: var(--filter-control-font-weight, 500);
  line-height: var(--filter-control-line-height, 1.2);
  cursor: pointer;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.status-select-trigger:hover:not(.disabled) {
  border-color: var(--russ-accent);
}

.status-select-trigger.open {
  border-color: var(--russ-accent);
  box-shadow: 0 0 0 3px var(--russ-shadow-accent-light);
}

.status-select-trigger.has-value {
  border-color: var(--russ-border);
}

.status-select-trigger.disabled {
  background: var(--russ-bg-disabled);
  cursor: not-allowed;
  opacity: 0.6;
}

.status-select-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex-wrap: wrap;
  height: 100%;
}

.status-select-container.multiple .status-select-content {
  gap: 8px;
}

.status-select-container.multiple.compact-multiple .status-select-content {
  gap: 6px;
  flex-wrap: nowrap;
}

.status-select-compact-multiple {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
  overflow: hidden;
  padding-left: 0;
}

.status-select-compact-multiple .status-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--russ-text-primary);
  font-weight: 500;
}

.status-select-more {
  flex-shrink: 0;
  color: var(--russ-text-tertiary, #8b919a);
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
}

.status-select-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  width: 100%;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: var(--russ-info-light);
  border: 1px solid var(--russ-info-border);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--russ-info-text);
  transition: all 0.15s ease;
  cursor: pointer;
  flex-shrink: 0;
}

.status-tag:hover {
  background: var(--russ-info-light);
  border-color: var(--russ-info-border);
}

.status-tag .status-color-dot {
  width: 10px;
  height: 10px;
  box-shadow: none;
}

.tag-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.tag-remove {
  width: 14px;
  height: 14px;
  color: var(--russ-text-muted);
  flex-shrink: 0;
  transition: color 0.15s ease;
}

.status-tag:hover .tag-remove {
  color: var(--russ-error);
}

.status-select-selected {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--russ-text-primary);
  font-weight: 500;
  min-width: 0;
  flex: 1;
  overflow: hidden;
  padding-left: 5px;
}

.status-select-selected--overlay {
  pointer-events: none;
  position: absolute;
  inset: 0 28px 0 0;
  padding-right: 4px;
}

.status-select-selected--badge {
  padding-left: 0;
}

.status-select-inline-input {
  width: 100%;
  min-width: 0;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--russ-text-primary);
  font: inherit;
  font-weight: 500;
  outline: none;
}

.status-select-inline-input::placeholder {
  color: var(--russ-text-quaternary);
  font-weight: 400;
}

.status-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
}

.status-select-placeholder {
  color: var(--russ-text-quaternary);
  font-weight: 400;
}

.status-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 2px var(--russ-shadow-color);
}

.status-select-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--russ-text-tertiary);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.status-select-arrow.rotated {
  transform: rotate(180deg);
  color: var(--russ-accent-dark);
}

.status-select-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: var(--russ-bg);
  border: 1px solid var(--russ-border);
  border-radius: 8px;
  z-index: 999;
  max-height: 300px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideDown 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px var(--russ-shadow-color);
  will-change: transform;
  contain: layout style paint;
}

.status-select-dropdown.dropdown-upward {
  animation: slideUp 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.status-select-search {
  position: relative;
  padding: 10px 12px;
  border-bottom: 1px solid var(--russ-border);
  flex-shrink: 0;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--russ-text-quaternary);
  pointer-events: none;
}

.search-input {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: 8px 12px 8px 36px;
  border: 1px solid var(--russ-border);
  border-radius: 6px;
  font-size: 14px;
  color: var(--russ-text-primary);
  background: var(--russ-bg-quaternary);
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--russ-input-border-focus);
  background: var(--russ-bg);
  box-shadow: 0 0 0 3px var(--russ-shadow-accent-light);
}

.status-select-options {
  max-height: 220px;
  padding: 6px 0;
  flex: 1;
  min-height: 0;
}

.status-select-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.15s ease;
  position: relative;
  min-width: 0;
}

.status-select-option:hover {
  background: var(--russ-bg-hover);
}

.status-select-option.highlighted {
  background: var(--russ-bg-blue-tint);
}

.status-select-option.selected {
  background: var(--russ-info-light);
  color: var(--russ-info-text);
}

.option-text {
  flex: 1;
  font-weight: 500;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.check-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  color: var(--russ-accent);
  flex-shrink: 0;
}

.no-options {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 16px;
  color: var(--russ-text-quaternary);
  font-size: 14px;
}

.no-options-icon {
  font-size: 24px;
  opacity: 0.6;
}

.status-select-error {
  margin-top: 6px;
  font-size: 12px;
  color: var(--russ-error);
  font-weight: 500;
}

/* Адаптивность */
@media (max-width: 768px) {
  .status-select-trigger {
    min-height: var(--status-select-height-mobile, var(--status-select-height, var(--ui-control-height, var(--filter-control-height, var(--filter-control-height-sm, 36px)))));
    padding: var(--status-select-padding-mobile, var(--status-select-padding, 6px var(--filter-control-padding-x, 12px)));
  }

  .status-select-dropdown {
    max-height: calc(100vh - 100px);
  }

  .status-select-options {
    max-height: calc(100vh - 200px);
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }

  .status-select-search {
    padding: 8px 10px;
    flex-shrink: 0;
  }
}

/* Анимации для hover эффектов */
.status-select-trigger,
.status-select-option {
  will-change: transform;
}

/* Фокус для accessibility */
.status-select-trigger:focus-visible {
  outline: none;
  border-color: var(--russ-accent);
  box-shadow: 0 0 0 3px var(--russ-shadow-accent-light);
}

.search-input:focus-visible {
  outline: none;
}
</style>
