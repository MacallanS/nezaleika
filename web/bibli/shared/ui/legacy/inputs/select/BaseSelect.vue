<template>
  <div v-if="!isHiddenBySingleOption" class="base-select-wrapper" ref="wrapperRef">
    <label v-if="label" :for="id" class="base-select-label">{{ label }}</label>
    <div class="base-select-container" ref="containerRef" :class="{ 'has-error': error, 'is-multiple': multiple }">
      <template v-if="props.searchable">
        <div v-if="multiple" class="base-select-combo base-select-combo--multiple" :style="comboMultipleStyle"
          @click="handleMultipleComboClick">
          <div v-if="selectedOptions.length > 0" class="base-select-tags">
            <div v-for="option in selectedOptions" :key="getOptionValue(option)" class="base-select-tag"
              @click.stop="removeOption(option)">
              <span class="tag-text">{{ getOptionLabel(option) }}</span>
              <svg class="tag-remove" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </div>
          </div>
          <input ref="searchInputRef" :id="id" v-model="inputValue" :placeholder="multiplePlaceholder" :disabled="disabled || loading"
            :required="required && selectedOptions.length === 0" class="base-select-search-input"
            @focus="isCompact ? null : handleFocus" @click.stop="handleFocus" @input="onInput"
            @keydown.down.prevent="highlightNext" @keydown.up.prevent="highlightPrev"
            @keydown.enter.prevent="selectHighlighted" @keydown.esc="closeDropdown" autocomplete="off"
            :inputmode="isCompact ? 'none' : undefined" :readonly="isCompact" />
        </div>
        <input v-else ref="searchInputRef" :id="id" v-model="inputValue" :placeholder="placeholder" :disabled="disabled || loading"
          :required="required" class="base-select-combo" @focus="isCompact ? null : handleFocus" @click="handleFocus"
          @input="onInput" @keydown.down.prevent="highlightNext" @keydown.up.prevent="highlightPrev"
          @keydown.enter.prevent="selectHighlighted" @keydown.esc="closeDropdown" autocomplete="off"
          :inputmode="isCompact ? 'none' : undefined" :readonly="isCompact" :style="comboStyle" />
      </template>
      <template v-else>
        <div v-if="multiple" class="base-select-combo base-select-combo--readonly base-select-combo--multiple"
          :style="comboReadonlyStyle" @click="!(disabled || loading) && toggleDropdown()">
          <div v-if="selectedOptions.length > 0" class="base-select-tags">
            <div v-for="option in selectedOptions" :key="getOptionValue(option)" class="base-select-tag"
              @click.stop="removeOption(option)">
              <span class="tag-text">{{ getOptionLabel(option) }}</span>
              <svg class="tag-remove" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </div>
          </div>
          <span v-else class="base-select-text base-select-placeholder">{{ placeholder || 'Выберите...' }}</span>
        </div>
        <div v-else class="base-select-combo base-select-combo--readonly" :style="comboReadonlyStyle"
          @click="!(disabled || loading) && toggleDropdown()">
          <span class="base-select-text">{{ inputValue || placeholder || 'Выберите...' }}</span>
        </div>
      </template>
      <span class="base-select-arrow" :class="{ 'active': dropdownOpen || sheetOpen }" @click.stop="toggleDropdown"></span>
      <Teleport to="body">
        <div
          v-if="dropdownOpen && !isCompact"
          ref="dropdownRef"
          class="base-select-dropdown"
          :class="{ 'dropdown-upward': openUpward }"
          :style="dropdownStyles"
        >
          <RrSelectScroll>
            <ul class="base-select-dropdown__list">
              <li v-if="filteredOptions.length > 0" v-for="(option, idx) in filteredOptions" :key="getOptionValue(option)"
                :class="{ highlighted: idx === highlightedIndex, selected: isOptionSelected(option) }"
                @mousedown.prevent="selectOption(option)">
                <span class="option-label">{{ getOptionLabel(option) }}</span>
                <span v-if="multiple && isOptionSelected(option)" class="option-check" aria-hidden="true">✓</span>
              </li>
              <li v-else class="no-options">Нет совпадений</li>
            </ul>
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
        @close="onSheetClose"
      />
    </div>
    <div v-if="error" class="base-select-error">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { Teleport } from 'vue';
import {
  strictFuzzyMatch,
  buildFixedFloatingStyles,
  computeFloatingPlacement,
  getFloatingScrollContainer,
  getMobileFiltersBounds,
  getSingleSelectableValue,
  shouldHideSingleOption,
  useCompactViewport,
  FLOATING_LAYER_Z_INDEX,
} from 'bibli/shared/utils';
import { RrSelectSheet, RrSelectScroll } from 'bibli/shared/ui/rr';
const props = defineProps({
  modelValue: [String, Number, Array],
  options: {
    type: Array,
    required: true,
  },
  label: String,
  placeholder: String,
  error: String,
  disabled: Boolean,
  required: Boolean,
  id: String,
  optionLabel: {
    type: String,
    default: 'name',
  },
  optionValue: {
    type: String,
    default: 'id',
  },
  width: {
    type: String,
    default: '',
  },
  height: {
    type: String,
    default: 'var(--base-select-height, var(--ui-control-height, var(--filter-control-height, var(--filter-control-height-md, 40px))))',
  },
  searchable: {
    type: Boolean,
    default: false,
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  max: {
    type: Number,
    default: undefined,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  useFixedPosition: {
    type: Boolean,
    default: false,
  },
  forceOpenUpward: {
    type: Boolean,
    default: false,
  },
  hideWhenSingle: {
    type: Boolean,
    default: false,
  },
  /** z-index teleported dropdown / compact sheet (выше BaseModal). */
  dropdownZIndex: {
    type: Number,
    default: FLOATING_LAYER_Z_INDEX,
  },
});
const emit = defineEmits(['update:modelValue', 'dropdown-close', 'max-reached']);

const isHiddenBySingleOption = computed(() =>
  shouldHideSingleOption(props.options, {
    hideWhenSingle: props.hideWhenSingle,
    multiple: props.multiple,
    loading: props.loading,
    optionLabel: props.optionLabel,
    optionValue: props.optionValue,
  }),
);

function applySingleOptionIfNeeded() {
  if (!props.hideWhenSingle || props.multiple || props.loading) {
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
  }
}

const comboStyle = computed(() => {
  const s = {};
  if (props.width) s.width = props.width;
  if (props.height) {
    s.height = props.height;
    s.minHeight = props.height;
  }
  return s;
});

const comboReadonlyStyle = computed(() => ({
  ...comboStyle.value,
  cursor: (props.disabled || props.loading) ? 'not-allowed' : 'pointer',
}));

const comboMultipleStyle = computed(() => {
  const s = { ...comboStyle.value };
  if (props.multiple) {
    s.height = 'auto';
    s.minHeight = props.height || comboStyle.value.minHeight;
  }
  return s;
});

const selectedValues = computed(() => {
  if (!props.multiple) return [];
  if (!props.modelValue) return [];
  return Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue];
});

const selectedOptions = computed(() => {
  if (!props.multiple) return [];
  return props.options.filter((opt) =>
    selectedValues.value.some((selected) => isSameValue(selected, getOptionValue(opt)))
  );
});

const multiplePlaceholder = computed(() => {
  if (selectedOptions.value.length > 0) return '';
  return props.placeholder || 'Выберите...';
});

const inputValue = ref('');
const dropdownOpen = ref(false);
const sheetOpen = ref(false);
const highlightedIndex = ref(-1);
const wrapperRef = ref(null);
const containerRef = ref(null);
const dropdownRef = ref(null);
const searchInputRef = ref(null);
const openUpward = ref(false);
const dropdownStyles = ref({});
let lastSelectedLabel = '';

function normalizeSearchValue(value) {
  return String(value ?? '').toLowerCase().replace(/ё/g, 'е').trim();
}

function exactSearchMatch(value, query) {
  const normalizedValue = normalizeSearchValue(value);
  const normalizedQuery = normalizeSearchValue(query);
  return !!normalizedQuery && normalizedValue.includes(normalizedQuery);
}

const isCompact = useCompactViewport();

function getOptionLabel(option) {
  return typeof option === 'object' ? option[props.optionLabel] : option;
}
function getOptionValue(option) {
  return typeof option === 'object' ? option[props.optionValue] : option;
}

function isSameValue(a, b) {
  return String(a) === String(b);
}

function isOptionSelected(option) {
  const value = getOptionValue(option);
  if (props.multiple) {
    return selectedValues.value.some((selected) => isSameValue(selected, value));
  }
  return isSameValue(value, props.modelValue);
}

const filteredOptions = computed(() => {
  const allOption = props.options.find(opt => {
    const label = String(getOptionLabel(opt)).toLowerCase();
    const value = getOptionValue(opt);
    return label === 'все' || value === '' || value === 'all' || value === undefined || value === null;
  });
  const restOptions = props.options.filter(opt => opt !== allOption);
  
  // Если включен поиск, всегда фильтруем по поисковому запросу
  if (props.searchable) {
    const q = inputValue.value.trim();
    if (!q) {
      return allOption ? [allOption, ...restOptions] : restOptions;
    } else {
      // Ищем и по label, и по value (ID) с использованием расстояния Левенштейна
      const filtered = restOptions.filter(opt => {
        const label = String(getOptionLabel(opt));
        const value = getOptionValue(opt);
        return strictFuzzyMatch(label, q) || exactSearchMatch(value, q);
      });
      // Если есть совпадения с "Все", включаем его в начало
      const allMatches = allOption && strictFuzzyMatch(String(getOptionLabel(allOption)), q);
      return allMatches && allOption ? [allOption, ...filtered] : filtered;
    }
  }
  
  // Если поиск не включен, возвращаем все опции
  if (props.multiple) {
    return allOption ? [allOption, ...restOptions] : restOptions;
  }
  const selected = props.options.find(opt => getOptionValue(opt) === props.modelValue);
  if (selected) {
    const selLabel = String(getOptionLabel(selected)).toLowerCase();
    const selValue = getOptionValue(selected);
    if (selLabel === 'все' || selValue === '' || selValue === 'all' || selValue === undefined || selValue === null) {
      return allOption ? [allOption, ...restOptions] : props.options;
    }
  }
  return allOption ? [allOption, ...restOptions] : restOptions;
});

let mobileFiltersScrollEl = null;

function attachMobileFiltersScrollListener() {
  detachMobileFiltersScrollListener();
  mobileFiltersScrollEl = containerRef.value
    ? getFloatingScrollContainer(containerRef.value)
    : null;
  if (mobileFiltersScrollEl) {
    mobileFiltersScrollEl.addEventListener('scroll', handleResize, { passive: true });
  }
}

function detachMobileFiltersScrollListener() {
  if (mobileFiltersScrollEl) {
    mobileFiltersScrollEl.removeEventListener('scroll', handleResize);
    mobileFiltersScrollEl = null;
  }
}

function calculateDropdownPosition() {
  if (!containerRef.value) return;

  const containerRect = containerRef.value.getBoundingClientRect();
  const filtersBounds = getMobileFiltersBounds(containerRef.value);

  const optionsCount = filteredOptions.value.length || props.options.length;
  const estimatedDropdownHeight = Math.min(265, optionsCount * 40 + 20);

  let dropdownHeight = estimatedDropdownHeight;
  if (dropdownRef.value) {
    dropdownHeight =
      dropdownRef.value.scrollHeight ||
      dropdownRef.value.offsetHeight ||
      estimatedDropdownHeight;
  }

  const padding = 8;
  const placementResult = computeFloatingPlacement(containerRect, {
    estimatedHeight: dropdownHeight,
    maxHeight: 265,
    padding,
    containerRect: filtersBounds,
  });

  const boundsTop = filtersBounds?.top ?? padding;
  const boundsBottom =
    filtersBounds?.bottom ??
    (typeof window !== 'undefined' ? window.innerHeight : 0);
  const spaceAbove = Math.max(0, containerRect.top - boundsTop);
  const spaceBelow = Math.max(0, boundsBottom - containerRect.bottom);
  const minOpen = Math.min(dropdownHeight, 120) + padding;

  let placementAbove = props.forceOpenUpward
    ? true
    : placementResult.placement === 'above';

  if (!props.forceOpenUpward && filtersBounds) {
    const contentMid = filtersBounds.top + filtersBounds.height * 0.5;
    const inUpperHalf = containerRect.top < contentMid;

    if (inUpperHalf) {
      placementAbove =
        spaceBelow < minOpen &&
        spaceAbove > spaceBelow &&
        spaceAbove >= minOpen;
    } else {
      placementAbove =
        spaceBelow < dropdownHeight + padding &&
        spaceAbove >= Math.min(dropdownHeight, 150) + padding;
    }
  }

  if (placementAbove && spaceAbove < minOpen && spaceBelow > spaceAbove) {
    placementAbove = false;
  }
  if (!placementAbove && spaceBelow < padding && spaceAbove > spaceBelow) {
    placementAbove = true;
  }

  openUpward.value = placementAbove;

  const available = openUpward.value ? spaceAbove : spaceBelow;
  const maxHeightPx = Math.min(265, Math.max(0, available - padding));

  const baseZIndex = props.dropdownZIndex;
  if (openUpward.value) {
    dropdownStyles.value = {
      ...buildFixedFloatingStyles(containerRect, {
        ...placementResult,
        placement: 'above',
        maxHeight: maxHeightPx,
      }, {
        padding,
        containerRect: filtersBounds,
        zIndex: baseZIndex,
      }),
      right: 'auto',
    };
  } else {
    dropdownStyles.value = {
      position: 'fixed',
      top: `${containerRect.bottom + padding}px`,
      bottom: 'auto',
      left: `${placementResult.left}px`,
      right: 'auto',
      width: `${placementResult.width}px`,
      zIndex: baseZIndex,
      maxHeight: `${maxHeightPx}px`,
    };
  }
}

function handleMultipleComboClick(event) {
  if (props.disabled || props.loading) return;
  if (event.target?.classList?.contains('base-select-search-input')) return;
  toggleDropdown();
}

/** Перед открытием searchable-селекта сбрасываем отображаемую метку, иначе список фильтруется как поиск. */
function prepareSearchableOpen() {
  if (!props.searchable || props.multiple) return;
  if (inputValue.value && inputValue.value === lastSelectedLabel) {
    inputValue.value = '';
  }
}

function handleFocus(event) {
  if (props.disabled || props.loading) return;
  if (isCompact.value) {
    openPicker();
    return;
  }

  if (props.multiple) {
    openDropdown();
    return;
  }

  prepareSearchableOpen();
  openDropdown();
}

function openPicker() {
  if (props.loading || props.disabled) return;
  if (isCompact.value) {
    sheetOpen.value = true;
    return;
  }
  openDropdown();
}

function openDropdown() {
  if (isCompact.value) {
    sheetOpen.value = true;
    return;
  }
  if (!props.loading) {
    if (!dropdownOpen.value) {
      dropdownOpen.value = true;
      highlightedIndex.value = -1;
      attachMobileFiltersScrollListener();
    }
    nextTick(() => {
      calculateDropdownPosition();
      if (dropdownRef.value) {
        setTimeout(() => {
          calculateDropdownPosition();
        }, 0);
        setTimeout(() => {
          calculateDropdownPosition();
        }, 50);
      }
    });
  }
}
function closeDropdown() {
  const wasOpen = dropdownOpen.value || sheetOpen.value;
  dropdownOpen.value = false;
  sheetOpen.value = false;
  detachMobileFiltersScrollListener();
  highlightedIndex.value = -1;
  if (props.multiple) {
    inputValue.value = '';
  } else if (lastSelectedLabel) {
    inputValue.value = lastSelectedLabel;
  }
  if (wasOpen) {
    emit('dropdown-close');
  }
}
function toggleDropdown() {
  if (props.loading) return;
  if (isCompact.value) {
    sheetOpen.value = !sheetOpen.value;
    return;
  }
  if (!dropdownOpen.value) {
    prepareSearchableOpen();
    openDropdown();
  } else {
    closeDropdown();
  }
}

function onSheetOpenChange(open) {
  sheetOpen.value = open;
}

function onSheetApply(value) {
  if (props.multiple) {
    inputValue.value = '';
    emit('update:modelValue', value);
    return;
  }
  const selected = props.options.find((opt) => isSameValue(getOptionValue(opt), value));
  if (selected) {
    inputValue.value = getOptionLabel(selected);
    lastSelectedLabel = getOptionLabel(selected);
  } else {
    inputValue.value = '';
    lastSelectedLabel = '';
  }
  emit('update:modelValue', value);
}

function onSheetClose() {
  emit('dropdown-close');
}
function onInput(e) {
  highlightedIndex.value = -1;
  openDropdown();
}
function selectOption(option) {
  const value = getOptionValue(option);

  if (props.multiple) {
    const currentValues = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    const index = currentValues.findIndex((selected) => isSameValue(selected, value));

    if (index > -1) {
      currentValues.splice(index, 1);
    } else {
      if (props.max != null && currentValues.length >= props.max) {
        emit('max-reached');
        return;
      }
      currentValues.push(value);
    }

    inputValue.value = '';
    highlightedIndex.value = -1;
    emit('update:modelValue', currentValues);
    return;
  }

  inputValue.value = getOptionLabel(option);
  lastSelectedLabel = getOptionLabel(option);
  emit('update:modelValue', value);
  closeDropdown();
}

function removeOption(option) {
  if (props.disabled || !props.multiple) return;

  const value = getOptionValue(option);
  const currentValues = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
  const index = currentValues.findIndex((selected) => isSameValue(selected, value));

  if (index > -1) {
    currentValues.splice(index, 1);
    emit('update:modelValue', currentValues);
  }
}
function highlightNext() {
  if (!dropdownOpen.value) openDropdown();
  if (filteredOptions.value.length === 0 && !props.loading) return;
  if (highlightedIndex.value < filteredOptions.value.length - 1) {
    highlightedIndex.value++;
  }
}
function highlightPrev() {
  if (!dropdownOpen.value) openDropdown();
  if (filteredOptions.value.length === 0 && !props.loading) return;
  if (highlightedIndex.value > 0) {
    highlightedIndex.value--;
  }
}
function selectHighlighted() {
  if (highlightedIndex.value >= 0 && highlightedIndex.value < filteredOptions.value.length) {
    selectOption(filteredOptions.value[highlightedIndex.value]);
  }
}
function handleClickOutside(e) {
  if (sheetOpen.value) return;
  const target = e.target;
  if (!(target instanceof Node)) return;
  if (wrapperRef.value?.contains(target)) return;
  if (dropdownRef.value?.contains(target)) return;
  if (target instanceof Element && target.closest('.base-select-dropdown')) return;
  if (dropdownOpen.value) {
    closeDropdown();
  }
}
function handleResize() {
  if (dropdownOpen.value) {
    calculateDropdownPosition();
  }
}

function handleVisualViewportResize() {
  if (dropdownOpen.value) {
    requestAnimationFrame(() => {
      setTimeout(() => {
        calculateDropdownPosition();
      }, 50);
    });
  }
}

function syncSingleSelectDisplay() {
  if (props.multiple) {
    inputValue.value = '';
    lastSelectedLabel = '';
    return;
  }
  const selected = props.options.find((opt) => isSameValue(getOptionValue(opt), props.modelValue));
  if (selected) {
    inputValue.value = getOptionLabel(selected);
    lastSelectedLabel = getOptionLabel(selected);
  } else {
    inputValue.value = '';
    lastSelectedLabel = '';
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', handleResize, true);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleVisualViewportResize);
    window.visualViewport.addEventListener('scroll', handleVisualViewportResize);
  }
  syncSingleSelectDisplay();
  applySingleOptionIfNeeded();
});
onBeforeUnmount(() => {
  detachMobileFiltersScrollListener();
  document.removeEventListener('mousedown', handleClickOutside);
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('scroll', handleResize, true);
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', handleVisualViewportResize);
    window.visualViewport.removeEventListener('scroll', handleVisualViewportResize);
  }
});
watch(() => props.modelValue, () => {
  syncSingleSelectDisplay();
});
watch(() => props.options, () => {
  syncSingleSelectDisplay();
  applySingleOptionIfNeeded();
});

watch(
  () => [props.loading, props.hideWhenSingle],
  () => {
    applySingleOptionIfNeeded();
  },
);

watch(() => props.loading, (isLoading) => {
  if (isLoading && dropdownOpen.value) {
    dropdownOpen.value = false;
  }
  if (isLoading && sheetOpen.value) {
    sheetOpen.value = false;
  }
});

watch(isCompact, (compact) => {
  if (!compact && sheetOpen.value) {
    sheetOpen.value = false;
  }
  if (compact && dropdownOpen.value) {
    closeDropdown();
  }
});
</script>

<style scoped>
.base-select-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  position: relative;
  overflow: visible;
}

.base-select-label {
  font-size: clamp(12px,
      calc(12px + (14 - 12) * ((100vw - 320px) / (1920 - 320))),
      14px);
  color: var(--russ-input-text);
  font-weight: 500;
  margin-bottom: 2px;
}

.base-select-container {
  position: relative;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  min-height: var(--base-select-min-height, var(--base-select-height, var(--ui-control-height, var(--filter-control-height, var(--filter-control-height-md, 40px)))));
  overflow: hidden;
  isolation: isolate;
}

.base-select-container.is-multiple {
  overflow: visible;
}

.base-select-combo {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  padding: var(--base-select-padding, 0 44px 0 var(--filter-control-padding-x, 14px));
  border: var(--base-select-border, 1.5px solid var(--russ-border));
  border-radius: var(--base-select-radius, var(--filter-control-radius, 10px));
  font-family: var(--filter-control-font-family, var(--russ-font-family));
  font-size: var(--base-select-font-size, var(--filter-control-font-size, var(--filter-control-font-size-md, 14px)));
  font-weight: var(--filter-control-font-weight, 500);
  line-height: var(--filter-control-line-height, 1.2);
  background: var(--base-select-bg, var(--russ-bg-quaternary));
  transition: border-color 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 4px var(--russ-shadow-accent-light);
  color: var(--russ-text-primary);
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.base-select-combo:focus {
  outline: none;
  border-color: var(--base-select-focus-border, var(--russ-input-border-focus));
  box-shadow: var(--base-select-focus-shadow, inset 0 0 0 1.5px var(--russ-shadow-accent-light));
  background: var(--base-select-focus-bg, var(--russ-input-bg));
}

.base-select-combo:disabled {
  background: var(--russ-input-bg-disabled);
  color: var(--russ-text-quaternary);
  cursor: not-allowed;
}

.base-select-arrow {
  pointer-events: auto;
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23666' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 20px;
  cursor: pointer;
  transition: transform 0.2s ease;
  opacity: 1;
  z-index: 1;
  flex-shrink: 0;
}

.base-select-arrow.active {
  transform: translateY(-50%) rotate(180deg);
}

.base-select-dropdown {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 100000;
  display: flex;
  flex-direction: column;
  background: var(--russ-input-bg);
  border: 1.5px solid var(--russ-border);
  border-radius: 10px;
  margin-top: 2px;
  max-height: 265px;
  overflow: hidden;
  box-shadow: 0 4px 16px var(--russ-shadow-accent-light);
  will-change: transform;
  contain: layout style paint;
}

.base-select-dropdown .rr-select-scroll {
  flex: 1 1 auto;
  min-height: 0;
}

.base-select-dropdown__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.base-select-dropdown.dropdown-upward {
  /* Позиционирование управляется через inline стили */
  margin-top: 0;
  margin-bottom: 0;
  box-shadow: 0 -4px 16px var(--russ-shadow-accent-light);
}

.base-select-dropdown li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 16px;
  cursor: pointer;
  font-size: clamp(12px,
      calc(12px + (14 - 12) * ((100vw - 320px) / (1920 - 320))),
      14px);
  color: var(--russ-text-primary);
  transition: background 0.18s;
}

.base-select-dropdown li .option-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.base-select-dropdown li .option-check {
  flex-shrink: 0;
  color: var(--russ-accent-dark, var(--russ-secondary-dark));
  font-weight: 700;
}

.base-select-dropdown li.selected {
  background: var(--russ-info-light);
}

.base-select-dropdown li.highlighted,
.base-select-dropdown li:hover {
  background: var(--russ-info-light);
}

.has-error .base-select-combo {
  border-color: var(--russ-input-error);
  background: var(--russ-error-light);
}

.base-select-error {
  color: var(--russ-input-error);
  font-size: clamp(10px,
      calc(10px + (12 - 10) * ((100vw - 320px) / (1920 - 320))),
      12px);
  margin-top: 2px;
}

.base-select-dropdown .no-options {
  padding: 12px 16px;
  color: var(--russ-text-quaternary);
  font-size: clamp(13px,
      calc(13px + (15 - 13) * ((100vw - 320px) / (1920 - 320))),
      15px);
  text-align: center;
  cursor: default;
}


.base-select-combo--readonly {
  position: relative;
  background: var(--base-select-bg, var(--russ-bg-quaternary));
  border: var(--base-select-border, 1.5px solid var(--russ-border));
  border-radius: var(--base-select-radius, var(--filter-control-radius, 10px));
  font-family: var(--filter-control-font-family, var(--russ-font-family));
  font-size: var(--base-select-font-size, var(--filter-control-font-size, var(--filter-control-font-size-md, 14px)));
  font-weight: var(--filter-control-font-weight, 500);
  line-height: var(--filter-control-line-height, 1.2);
  color: var(--russ-text-primary);
  padding: var(--base-select-padding, 0 44px 0 var(--filter-control-padding-x, 14px));
  min-height: var(--base-select-min-height, var(--base-select-height, var(--ui-control-height, var(--filter-control-height, var(--filter-control-height-md, 40px)))));
  display: flex;
  align-items: center;
  transition: border-color 0.2s, box-shadow 0.2s;
  min-width: 100px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}



.base-select-text {
  flex: 1 1 0;
  min-width: 0;
  width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.base-select-combo--readonly:disabled {
  background: var(--russ-input-bg-disabled);
  color: var(--russ-text-quaternary);
  cursor: not-allowed;
}

.base-select-combo--multiple {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 6px 44px 6px 10px;
  min-height: var(--base-select-min-height, var(--base-select-height, var(--ui-control-height, 40px)));
  height: auto;
  white-space: normal;
  overflow: visible;
  cursor: text;
}

.base-select-combo--multiple:focus-within {
  outline: none;
  border-color: var(--base-select-focus-border, var(--russ-input-border-focus));
  box-shadow: var(--base-select-focus-shadow, inset 0 0 0 1.5px var(--russ-shadow-accent-light));
  background: var(--base-select-focus-bg, var(--russ-input-bg));
}

.base-select-container.is-multiple .base-select-arrow {
  top: 14px;
  transform: none;
}

.base-select-container.is-multiple .base-select-arrow.active {
  transform: rotate(180deg);
}

.base-select-combo--readonly.base-select-combo--multiple {
  cursor: pointer;
}

.base-select-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  max-width: 100%;
}

.base-select-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: var(--russ-info-light);
  border: 1px solid var(--russ-info-border, var(--russ-border));
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--russ-info-text, var(--russ-text-primary));
  cursor: pointer;
  flex-shrink: 0;
  max-width: 100%;
}

.base-select-tag:hover .tag-remove {
  color: var(--russ-error);
}

.base-select-tag .tag-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.base-select-tag .tag-remove {
  flex-shrink: 0;
  color: var(--russ-text-muted, var(--russ-text-tertiary));
}

.base-select-search-input {
  flex: 1 1 80px;
  min-width: 60px;
  border: none;
  outline: none;
  background: transparent;
  padding: 4px 2px;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  line-height: inherit;
  color: var(--russ-text-primary);
  box-shadow: none;
}

.base-select-search-input::placeholder {
  color: var(--russ-text-quaternary);
}

.base-select-search-input:disabled {
  cursor: not-allowed;
}

.base-select-placeholder {
  color: var(--russ-text-quaternary);
  font-weight: 400;
}
</style>
