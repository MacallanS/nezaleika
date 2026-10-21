<template>
  <div class="filters-bar-wrapper">
    <!-- Mobile filters button -->
    <div v-if="showMobileButton" class="mobile-filters-btn-wrapper">
      <button
        type="button"
        class="reporting-header-action reporting-header-action--filters"
        aria-label="Фильтры"
        title="Фильтры"
        :aria-expanded="showMobileFilters"
        @click="toggleMobileFilters"
      >
        <span class="reporting-header-action-icon" aria-hidden="true">
          <RrFilterToggleIcon :size="24" />
        </span>
        <span v-if="hasActiveFilters" class="filter-indicator"></span>
      </button>
    </div>

    <RrBottomSheet
      v-model="showMobileFilters"
      placement="sheet"
      height-mode="fit"
      :height-percent="90"
      title="Фильтры"
      :title-id="filtersSheetTitleId"
    >
      <div class="mobile-filters-modal">
        <div class="mobile-filters-content filters-grid-mobile">
          <FilterItem
            v-for="(filter, index) in filters"
            :key="filterItemKey(filter, index)"
            :filter="filter"
            :model-value="getFilterValue(filter.key)"
            @update:model-value="handleFilterChange(filter.key, $event)"
            @search-submit="(value) => handleSearchSubmit(filter.key, value)"
            @filter-close="(key) => emit('filter-close', key)"
          />
          <slot name="actions"></slot>
        </div>
      </div>
      <template #footer>
        <AuthRRButton
          v-if="showResetButton"
          type="button"
          variant="brand-secondary"
          label="Сбросить"
          @click="handleReset"
        />
        <AuthRRButton type="button" label="Применить" @click="closeMobileFilters" />
      </template>
    </RrBottomSheet>

    <!-- Desktop filters -->
    <div class="filters-container desktop-filters" :class="{ 'always-visible': !showMobileButton && isInsideModal }"
      ref="wrapperRef">
      <div class="filters-grid">
        <FilterItem v-for="(filter, index) in filters" :key="filterItemKey(filter, index)" :filter="filter"
          :model-value="getFilterValue(filter.key)" @update:model-value="handleFilterChange(filter.key, $event)"
          @search-submit="(value) => handleSearchSubmit(filter.key, value)"
          @filter-close="(key) => emit('filter-close', key)" />
        <slot name="actions"></slot>
        <div v-if="showResetButton" class="filter-item-wrapper filter-item-wrapper--reset">
          <button class="reset-filters-btn" @click="handleReset" title="Сбросить все фильтры">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round" />
              <path d="M21 3v5h-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round" />
              <path d="M3 21v-5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
            <span>Сбросить</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import '../../../styles/reporting-header-actions.css';
import { ref, computed, watch, onMounted, nextTick, useId } from 'vue';
import { FilterItem } from '../FilterItem';
import { AuthRRButton, RrBottomSheet, RrFilterToggleIcon } from 'bibli/shared/ui/rr';

export interface FilterConfig {
  key: string;
  type: 'select' | 'input' | 'date' | 'date-range' | 'search' | 'custom';
  label?: string;
  placeholder?: string;
  options?: Array<{ id: any; name: string }>;
  optionLabel?: string;
  optionValue?: string;
  searchable?: boolean;
  disabled?: boolean;
  /** Только для type: input — поле только для чтения (например, пока не выбран соседний фильтр). */
  readonly?: boolean;
  /** Только для type: input — нативный focus на поле ввода. */
  onInputFocus?: (e: FocusEvent) => void;
  loading?: boolean;
  width?: string;
  multiple?: boolean;
  hideWhenSingle?: boolean;
  component?: any; // For custom components
  props?: Record<string, any>; // Additional props for the component
  onChange?: (value: any) => void;
}

interface Props {
  filters: FilterConfig[];
  modelValue: Record<string, any>;
  showResetButton?: boolean;
  showMobileButton?: boolean;
  mobileBreakpoint?: number;
}

const props = withDefaults(defineProps<Props>(), {
  showResetButton: true,
  showMobileButton: true,
  mobileBreakpoint: 1024,
});

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>];
  'filter-change': [key: string, value: any];
  'filter-close': [key: string];
  'search-submit': [key: string, value: any];
  'reset': [];
}>();

const showMobileFilters = ref(false);
const filtersSheetTitleId = useId();
const isMobile = ref(false);
const isInsideModal = ref(false);
const wrapperRef = ref<HTMLElement | null>(null);

// Проверяем, находится ли компонент внутри модального окна
const checkIfInsideModal = () => {
  if (!wrapperRef.value) return;
  const modal = wrapperRef.value.closest(
    '.base-modal, .modal-overlay, .planned-shifts-page, .edit-shifts-embedded, [class*="modal"], [class*="Modal"], .staff-results-base-modal, .effectiveness-base-modal',
  );
  isInsideModal.value = !!modal;
};

const getFilterValue = (key: string) => {
  return props.modelValue[key];
};

/** Стабильный ключ: при подгрузке options у select пересоздаём строку, чтобы BaseSelect подхватил новый список. */
function filterItemKey(filter: FilterConfig, index: number) {
  const optLen =
    filter.type === 'select' && Array.isArray(filter.options) ? filter.options.length : 0;
  return `${filter.key}-${index}-${optLen}`;
}

const handleFilterChange = (key: string, value: any) => {
  const newValue = { ...props.modelValue, [key]: value };
  emit('update:modelValue', newValue);
  emit('filter-change', key, value);

  const filter = props.filters.find(f => f.key === key);
  if (filter?.onChange) {
    filter.onChange(value);
  }
};

const handleSearchSubmit = (key: string, value: any) => {
  const newValue = { ...props.modelValue, [key]: value };
  emit('update:modelValue', newValue);
  emit('search-submit', key, value);
};

const handleReset = () => {
  const resetValue: Record<string, any> = {};
  props.filters.forEach(filter => {
    if (filter.type === 'select') {
      resetValue[filter.key] = undefined;
    } else if (filter.type === 'date') {
      resetValue[filter.key] = null;
    } else if (filter.type === 'date-range') {
      resetValue[filter.key] = { from: null, to: null };
    } else if (filter.type === 'custom') {
      resetValue[filter.key] = null;
    } else {
      resetValue[filter.key] = '';
    }
  });
  emit('update:modelValue', resetValue);
  emit('reset');
};

const hasActiveFilters = computed(() => {
  return Object.values(props.modelValue).some(value => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (Array.isArray(value)) return value.length > 0;
    return true;
  });
});

const toggleMobileFilters = () => {
  showMobileFilters.value = !showMobileFilters.value;
};

const openMobileFilters = () => {
  showMobileFilters.value = true;
};

const closeMobileFilters = () => {
  showMobileFilters.value = false;
};

// Expose methods for parent component
defineExpose({
  openMobileFilters,
  closeMobileFilters,
  toggleMobileFilters
});

const checkMobile = () => {
  isMobile.value = window.innerWidth < props.mobileBreakpoint;
};

watch(isMobile, (mobile) => {
  if (!mobile) showMobileFilters.value = false;
});

if (typeof window !== 'undefined') {
  checkMobile();
  window.addEventListener('resize', checkMobile);
}

onMounted(() => {
  nextTick(() => {
    checkIfInsideModal();
    setTimeout(checkIfInsideModal, 100);
  });
});
</script>

<style scoped>
.filters-bar-wrapper {
  /* Единая «компактная» высота контролов внутри панели фильтров.
     Глобальный :root --ui-control-height (48px) иначе переопределяет BaseSelect/InputText до первого var(). */
  --filters-bar-inner-height: var(--filters-bar-control-height, var(--filter-control-height-md, 40px));
  --filter-control-height-sm: 36px;
  --filter-control-height-md: 40px;
  --filter-control-height-lg: 48px;
  --filter-control-height: var(--filters-bar-inner-height);
  --ui-control-height: var(--filters-bar-inner-height);
  --base-select-height: var(--filters-bar-inner-height);
  --filter-control-radius: 10px;
  --filter-control-gap: 12px;
  --filter-control-padding-x: 12px;
  --filter-control-font-family: var(--russ-font-family);
  --filter-control-font-size-sm: 13px;
  --filter-control-font-size-md: 14px;
  --filter-control-font-size-lg: 16px;
  --filter-control-font-size: var(--filter-control-font-size-md);
  --filter-control-font-weight: 500;
  --filter-control-line-height: 1.2;
  --filter-control-placeholder-color: var(--russ-text-quaternary);
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mobile-filters-btn-wrapper {
  display: none;
  margin-bottom: 0;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  box-sizing: border-box;
}

.mobile-filters-btn-wrapper .reporting-header-action.reporting-header-action--filters {
  display: inline-flex;
  width: 44px;
  flex: 0 0 auto;
}

.filters-container {
  display: flex;
  align-items: flex-end;
  background: linear-gradient(135deg, var(--russ-bg) 0%, var(--russ-bg-secondary) 100%);
  border: 1px solid var(--russ-border-light);
  border-radius: 16px;
  box-shadow: 0 4px 20px var(--russ-shadow-primary-light);
  padding: 15px 20px;
  gap: 16px;
  flex-wrap: wrap;
  width: 100%;
  box-sizing: border-box;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--filter-control-gap);
  flex: 1 1 auto;
  align-items: end;
  width: 100%;
}

.filters-grid-mobile {
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-l, 16px);
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: auto;
}

.filter-item-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.filter-item-wrapper--reset {
  min-height: auto;
  justify-content: flex-end;
}

.filter-item--actions {
  min-height: auto;
  display: flex;
  align-items: flex-end;
  width: 100%;
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

.reset-filters-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 var(--filter-control-padding-x);
  background: var(--russ-bg-hover);
  border: 1.5px solid var(--russ-border-dark);
  border-radius: var(--filter-control-radius);
  color: var(--russ-text-tertiary);
  font-family: var(--filter-control-font-family);
  font-size: var(--filter-control-font-size);
  font-weight: var(--filter-control-font-weight);
  line-height: var(--filter-control-line-height);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  box-sizing: border-box;
  width: 100%;
  height: var(--filter-control-height);
  min-height: var(--filter-control-height);
  justify-content: center;
}

.reset-filters-btn:hover {
  background: var(--russ-border);
  border-color: var(--russ-text-quaternary);
  color: var(--russ-text-secondary);
}

.reset-filters-btn:active {
  background: var(--russ-border-dark);
  transform: translateY(1px);
}

.reset-filters-btn svg {
  flex-shrink: 0;
}

/* Mobile filters sheet (teleported; vars must live here, not only on .filters-bar-wrapper) */
.mobile-filters-modal {
  --filters-bar-inner-height: var(--filters-bar-control-height, var(--filter-control-height-md, 40px));
  --filter-control-height-sm: 36px;
  --filter-control-height-md: 40px;
  --filter-control-height-lg: 48px;
  --filter-control-height: var(--filters-bar-inner-height);
  --ui-control-height: var(--filters-bar-inner-height);
  --base-select-height: var(--filters-bar-inner-height);
  --filter-control-radius: 10px;
  --filter-control-gap: 12px;
  --filter-control-padding-x: 12px;
  --filter-control-font-family: var(--russ-font-family);
  --filter-control-font-size-sm: 13px;
  --filter-control-font-size-md: 14px;
  --filter-control-font-size-lg: 16px;
  --filter-control-font-size: var(--filter-control-font-size-md);
  --filter-control-font-weight: 500;
  --filter-control-line-height: 1.2;
  --filter-control-placeholder-color: var(--russ-text-quaternary);
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 0;
}

.mobile-filters-content {
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-l, 16px);
  min-height: 0;
}

.mobile-filters-modal :deep(.filter-label) {
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-size: var(--auth-rr-fs-xs, var(--rr-font-size-font-size-xs, 13px));
  font-weight: 400;
  font-style: normal;
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
  text-transform: none;
  letter-spacing: var(--auth-rr-track-s, var(--rr-tracking-tracking-s, 0));
  height: auto;
  line-height: var(--auth-rr-lh-xs, var(--rr-line-height-line-height-xs, 1.3));
  white-space: normal;
}

/* Responsive */
@media (max-width: 1024px) {
  .filters-bar-wrapper {
    flex-wrap: wrap;
    align-items: stretch;
  }

  .mobile-filters-btn-wrapper {
    display: flex;
    margin-left: 0;
    justify-content: flex-end;
  }

  /* Скрываем desktop-фильтры на мобильных устройствах */
  .desktop-filters {
    display: none;
  }

  /* Если кнопка мобильных фильтров скрыта (showMobileButton=false), показываем desktop-фильтры */
  /* Это работает только в модальных окнах, где showMobileButton=false */
  /* Проверяем, что мы внутри модального окна */
  .base-modal .desktop-filters.always-visible,
  .modal-overlay .desktop-filters.always-visible,
  .planned-shifts-page .desktop-filters.always-visible,
  .edit-shifts-embedded .desktop-filters.always-visible,
  [class*="modal"] .desktop-filters.always-visible,
  [class*="Modal"] .desktop-filters.always-visible {
    display: flex !important;
  }
}

@media (min-width: 1025px) {
  .mobile-filters-btn-wrapper {
    display: none;
  }

  .desktop-filters {
    display: flex !important;
  }
}

@media (max-width: 900px) {
  .filters-container {
    padding: 14px 18px 10px 18px;
  }

  .filters-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px 14px;
  }
}

@media (max-width: 600px) {
  .filters-container {
    padding: 12px 16px 8px 16px;
  }

  .filters-grid {
    grid-template-columns: 1fr;
    gap: 12px 0;
  }

  .reset-filters-btn {
    width: 100%;
    justify-content: center;
    padding: 12px 16px;
    font-size: 15px;
  }
}
</style>
