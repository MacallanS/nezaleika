<template>
  <div v-if="isVisible" class="filter-item-wrapper" :class="filterItemClass">
    <label v-if="filter.label" class="filter-label">{{ filter.label }}</label>
    
    <!-- Select -->
    <BaseSelect
      v-if="filter.type === 'select'"
      :model-value="modelValue"
      :options="filter.options || []"
      :option-label="filter.optionLabel || 'name'"
      :option-value="filter.optionValue || 'id'"
      :placeholder="filter.placeholder"
      :searchable="filter.searchable !== false"
      :multiple="filter.multiple === true"
      :disabled="filter.disabled"
      :loading="filter.loading"
      :width="filter.width"
      :hide-when-single="hideWhenSingle"
      @update:model-value="handleChange"
      @dropdown-close="handleDropdownClose"
    />

    <!-- Input -->
    <InputText
      v-else-if="filter.type === 'input'"
      :model-value="modelValue"
      :placeholder="filter.placeholder"
      :disabled="filter.disabled"
      :readonly="filter.readonly"
      variant="off"
      @update:model-value="handleChange"
      @focus="onInputFocusNative"
    />

    <!-- Date -->
    <DatePicker
      v-else-if="filter.type === 'date'"
      :model-value="modelValue"
      :placeholder="filter.placeholder"
      :disabled="filter.disabled"
      @update:model-value="handleChange"
    />

    <!-- Date Range -->
    <DateRangePicker
      v-else-if="filter.type === 'date-range'"
      :model-value="modelValue"
      :placeholder="filter.placeholder"
      :disabled="filter.disabled"
      @update:model-value="handleChange"
      @dropdown-close="handleDropdownClose"
    />

    <!-- Search -->
    <div v-else-if="filter.type === 'search'" class="filter-search-wrapper">
      <input
        :value="modelValue"
        class="search-input-modern"
        :placeholder="filter.placeholder"
        @input="handleSearchInput"
        @keyup.enter="handleSearchEnter"
      />
      <button class="search-submit-btn" type="button" @click="handleSearchEnter" title="Найти">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <!-- Custom component -->
    <component
      v-else-if="filter.type === 'custom' && filter.component"
      :is="filter.component"
      :model-value="modelValue"
      v-bind="filter.props || {}"
      @update:model-value="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import type { FilterConfig } from '../FiltersBar/FiltersBar.vue';
import { DatePicker } from '../DatePicker';
import { DateRangePicker } from '../DateRangePicker';
import { BaseSelect, InputText } from '@/shared/ui';
import { getSingleSelectableValue, shouldHideSingleOption } from 'bibli/shared/utils';

interface Props {
  filter: FilterConfig;
  modelValue: any;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: any];
  'filter-close': [key: string];
  'search-submit': [value: any];
}>();

const hideWhenSingle = computed(() => props.filter.hideWhenSingle !== false);

const isVisible = computed(() => {
  if (props.filter.type !== 'select' || !hideWhenSingle.value) {
    return true;
  }
  return !shouldHideSingleOption(props.filter.options, {
    hideWhenSingle: true,
    multiple: props.filter.multiple === true,
    loading: props.filter.loading === true,
    optionLabel: props.filter.optionLabel || 'name',
    optionValue: props.filter.optionValue || 'id',
  });
});

const filterItemClass = computed(() => {
  return {
    'filter-item--disabled': props.filter.disabled,
  };
});

const handleChange = (value: any) => {
  emit('update:modelValue', value);
};

function applySingleOptionIfNeeded() {
  if (!hideWhenSingle.value || props.filter.type !== 'select' || props.filter.multiple || props.filter.loading) {
    return;
  }
  const value = getSingleSelectableValue(
    props.filter.options,
    props.filter.optionLabel || 'name',
    props.filter.optionValue || 'id',
  );
  if (value != null && props.modelValue !== value) {
    handleChange(value);
  }
}

watch(
  () => [props.filter.options, props.filter.loading, hideWhenSingle.value],
  applySingleOptionIfNeeded,
  { immediate: true, deep: true },
);

const handleDropdownClose = () => {
  emit('filter-close', props.filter.key);
};

function onInputFocusNative(e: FocusEvent) {
  props.filter.onInputFocus?.(e);
}

const handleSearchInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};

const handleSearchEnter = (event: Event) => {
  const button = event.currentTarget as HTMLElement | null;
  const input = button?.closest('.filter-search-wrapper')
    ?.querySelector('.search-input-modern') as HTMLInputElement | null;
  const value = input?.value ?? props.modelValue ?? '';
  emit('update:modelValue', value);
  emit('search-submit', value);
};
</script>

<style scoped>
.filter-item-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.filter-item-wrapper :deep(.input-wrapper) {
  min-height: var(--filter-control-height, var(--ui-control-height, 40px));
  height: var(--filter-control-height, var(--ui-control-height, 40px));
}

.filter-item-wrapper :deep(.custom-input) {
  min-height: var(--filter-control-height, var(--ui-control-height, 40px));
  height: var(--filter-control-height, var(--ui-control-height, 40px));
  padding: 0 var(--filter-control-padding-x, 12px);
  border-radius: var(--filter-control-radius, 10px);
  font-family: var(--filter-control-font-family, var(--russ-font-family));
  font-size: var(--filter-control-font-size, 14px);
  font-weight: var(--filter-control-font-weight, 500);
  line-height: var(--filter-control-line-height, 1.2);
  box-sizing: border-box;
}

.filter-item-wrapper :deep(.base-select-wrapper) {
  width: 100%;
  gap: 0;
}

.filter-item-wrapper :deep(.base-select-container) {
  height: var(--filter-control-height, var(--ui-control-height, 40px));
  min-height: var(--filter-control-height, var(--ui-control-height, 40px));
}

.filter-item-wrapper :deep(.base-select-combo),
.filter-item-wrapper :deep(.base-select-combo--readonly),
.filter-item-wrapper :deep(.base-select-search-input) {
  height: 100% !important;
  min-height: 0 !important;
  box-sizing: border-box;
}

.filter-item-wrapper :deep(.date-picker-wrapper),
.filter-item-wrapper :deep(.date-range-picker-wrapper),
.filter-item-wrapper :deep(.date-time-picker-wrapper) {
  width: 100%;
}

.filter-item-wrapper :deep(.date-picker-input),
.filter-item-wrapper :deep(.date-range-picker-input),
.filter-item-wrapper :deep(.date-time-picker__input) {
  height: var(--filter-control-height, var(--ui-control-height, 40px));
  min-height: var(--filter-control-height, var(--ui-control-height, 40px));
  box-sizing: border-box;
}

.filter-label {
  font-family: var(--filter-control-font-family, var(--russ-font-family));
  font-size: 13px;
  font-weight: 600;
  color: var(--russ-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  height: 18px;
  line-height: 18px;
  display: flex;
  align-items: center;
}


.filter-search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  border: 1.5px solid var(--russ-border);
  border-radius: var(--filter-control-radius, 10px);
  background: var(--russ-bg-quaternary);
  transition: border-color 0.2s, box-shadow 0.2s;
  overflow: hidden;
  box-shadow: 0 1px 4px var(--russ-shadow-accent-light);
  box-sizing: border-box;
  min-height: var(--filter-control-height, var(--ui-control-height, 40px));
  height: var(--filter-control-height, var(--ui-control-height, 40px));
}

.filter-search-wrapper:focus-within {
  border-color: var(--russ-input-border-focus);
  box-shadow: inset 0 0 0 3px var(--russ-shadow-accent-light);
  background: var(--russ-input-bg);
}

.search-input-modern {
  flex: 1;
  padding: 0 0 0 var(--filter-control-padding-x, 12px);
  border: none;
  border-radius: 0;
  font-family: var(--filter-control-font-family, var(--russ-font-family));
  font-size: var(--filter-control-font-size, 14px);
  font-weight: var(--filter-control-font-weight, 500);
  line-height: var(--filter-control-line-height, 1.2);
  background: transparent;
  color: var(--russ-text-primary);
  transition: all 0.2s ease;
  height: 100%;
  box-sizing: border-box;
  min-width: 0;
}

.search-input-modern:focus {
  outline: none;
}

.search-input-modern::placeholder {
  color: var(--filter-control-placeholder-color, var(--russ-text-quaternary));
}

.search-submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--filter-control-height, var(--ui-control-height, 40px));
  padding: 0;
  border: none;
  border-left: 1px solid var(--russ-border-light);
  background: transparent;
  color: var(--russ-text-tertiary);
  cursor: pointer;
  transition: color 0.2s;
  height: 100%;
  flex-shrink: 0;
}

.search-submit-btn:hover {
  color: var(--russ-secondary);
}

.filter-item--disabled {
  opacity: 0.6;
  pointer-events: none;
}
</style>
