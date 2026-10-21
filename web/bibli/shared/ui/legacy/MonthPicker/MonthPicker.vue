<template>
  <div class="date-picker-wrapper" ref="wrapperRef">
    <div
      class="date-picker-input"
      :class="{ 'is-focused': isOpen, 'is-disabled': disabled }"
      @click="!disabled && toggleCalendar()"
    >
      <span class="date-display" :class="{ 'placeholder': !displayValue }">
        {{ displayValue || placeholder }}
      </span>
      <span class="calendar-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </div>

    <Teleport to="body">
      <div
        v-if="isOpen"
        class="calendar-dropdown"
        :style="dropdownStyles"
        ref="dropdownRef"
        @click.stop
      >
        <div class="calendar-header">
          <button class="calendar-nav-btn" @click="previousYear" type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="calendar-month-year">
            {{ currentYear }}
          </div>
          <button class="calendar-nav-btn" @click="nextYear" type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

        <div class="calendar-months">
          <div
            v-for="(month, index) in months"
            :key="index"
            class="calendar-month"
            :class="{
              'is-selected': month.isSelected,
              'is-current': month.isCurrent
            }"
            @click="selectMonth(index)"
          >
            {{ month.name }}
          </div>
        </div>

        <div class="calendar-footer">
          <button class="calendar-today-btn" @click="selectCurrentMonth" type="button">Текущий месяц</button>
          <button class="calendar-clear-btn" @click="clearMonth" type="button">Очистить</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { Teleport } from 'vue';
import { buildFixedFloatingStyles, computeFloatingPlacement, getMobileFiltersBounds } from 'bibli/shared/utils';

const props = defineProps({
  modelValue: {
    type: Object,
    default: null,
    validator: (value) => {
      if (!value) return true;
      return value.hasOwnProperty('year') && value.hasOwnProperty('month');
    }
  },
  placeholder: {
    type: String,
    default: 'Выберите месяц'
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);
const wrapperRef = ref(null);
const dropdownRef = ref(null);
const currentYear = ref(new Date().getFullYear());
const dropdownStyles = ref({});

const monthNames = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const displayValue = computed(() => {
  if (!props.modelValue || !props.modelValue.year || props.modelValue.month === undefined) return '';
  
  const monthName = monthNames[props.modelValue.month];
  return `${monthName} ${props.modelValue.year}`;
});

const months = computed(() => {
  const today = new Date();
  const currentMonthIndex = today.getMonth();
  const currentYearValue = today.getFullYear();
  
  return monthNames.map((name, index) => {
    const isSelected = props.modelValue && 
      props.modelValue.year === currentYear.value && 
      props.modelValue.month === index;
    const isCurrent = currentYear.value === currentYearValue && index === currentMonthIndex;
    
    return {
      name,
      index,
      isSelected,
      isCurrent
    };
  });
});

const toggleCalendar = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    nextTick(() => {
      calculatePosition();
    });
  }
};

const selectMonth = (monthIndex) => {
  emit('update:modelValue', {
    year: currentYear.value,
    month: monthIndex
  });
  isOpen.value = false;
};

const selectCurrentMonth = () => {
  const today = new Date();
  emit('update:modelValue', {
    year: today.getFullYear(),
    month: today.getMonth()
  });
  isOpen.value = false;
};

const clearMonth = () => {
  emit('update:modelValue', null);
  isOpen.value = false;
};

const previousYear = () => {
  currentYear.value--;
};

const nextYear = () => {
  currentYear.value++;
};

const calculatePosition = () => {
  if (!wrapperRef.value) return;
  
  const rect = wrapperRef.value.getBoundingClientRect();
  const estimatedHeight = 350;

  const filtersBounds = getMobileFiltersBounds(wrapperRef.value);
  const placementResult = computeFloatingPlacement(rect, {
    estimatedHeight,
    maxHeight: estimatedHeight,
    padding: 8,
    containerRect: filtersBounds,
  });

  dropdownStyles.value = buildFixedFloatingStyles(rect, placementResult, {
    padding: 8,
    containerRect: filtersBounds,
  });
};

const handleClickOutside = (event) => {
  if (
    isOpen.value &&
    wrapperRef.value &&
    !wrapperRef.value.contains(event.target) &&
    dropdownRef.value &&
    !dropdownRef.value.contains(event.target)
  ) {
    isOpen.value = false;
  }
};

const handleResize = () => {
  if (isOpen.value) {
    calculatePosition();
  }
};

watch(() => props.modelValue, (newVal) => {
  if (newVal && newVal.year) {
    currentYear.value = newVal.year;
  }
}, { immediate: true });

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', handleResize, true);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside);
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('scroll', handleResize, true);
});
</script>

<style scoped>
.date-picker-wrapper {
  position: relative;
  width: 100%;
}

.date-picker-input {
  width: 100%;
  padding: 0 var(--filter-control-padding-x, 12px);
  border: 1.5px solid var(--russ-border);
  border-radius: var(--filter-control-radius, 10px);
  font-family: var(--filter-control-font-family, var(--russ-font-family));
  font-size: var(--filter-control-font-size, 13px);
  font-weight: var(--filter-control-font-weight, 500);
  line-height: var(--filter-control-line-height, 1.2);
  height: var(--ui-control-height, var(--filter-control-height, 40px));
  min-height: var(--ui-control-height, var(--filter-control-height, 40px));
  background: var(--russ-bg-quaternary);
  box-shadow: 0 1px 4px var(--russ-shadow-accent-light);
  color: var(--russ-text-primary);
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
}

.date-picker-input:hover:not(.is-disabled) {
  border-color: var(--russ-border-light);
}

.date-picker-input.is-focused {
  border-color: var(--russ-input-border-focus);
  box-shadow: inset 0 0 0 3px var(--russ-shadow-accent-light);
  background: var(--russ-input-bg);
}

.date-picker-input.is-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--russ-input-bg-disabled);
}

.date-display {
  flex: 1;
  text-align: left;
  color: var(--russ-text-primary);
}

.date-display.placeholder {
  color: var(--russ-text-quaternary);
}

.calendar-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--russ-text-tertiary);
  flex-shrink: 0;
  margin-left: 8px;
}

.date-picker-input.is-focused .calendar-icon {
  color: var(--russ-input-border-focus);
}

.calendar-dropdown {
  background: var(--russ-input-bg);
  border: 1.5px solid var(--russ-border);
  border-radius: 12px;
  box-shadow: 0 8px 24px var(--russ-shadow-color);
  padding: 16px;
  min-width: 280px;
  max-width: 320px;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--russ-bg-tertiary);
}

.calendar-nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: var(--russ-bg-quaternary);
  border-radius: 8px;
  cursor: pointer;
  color: var(--russ-text-muted);
  transition: all 0.2s;
}

.calendar-nav-btn:hover {
  background: var(--russ-border);
  color: var(--russ-primary);
}

.calendar-month-year {
  font-size: 15px;
  font-weight: 600;
  color: var(--russ-bg-dark);
}

.calendar-months {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.calendar-month {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  font-size: 13px;
  color: var(--russ-bg-dark);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  font-weight: 500;
}

.calendar-month:hover {
  background: var(--russ-bg-hover);
}

.calendar-month.is-current {
  background: var(--russ-bg-blue-lighter);
  color: var(--russ-primary);
  font-weight: 600;
}

.calendar-month.is-selected {
  background: var(--russ-secondary);
  color: var(--russ-text-inverse);
  font-weight: 600;
}

.calendar-month.is-selected.is-current {
  background: var(--russ-secondary);
  color: var(--russ-text-inverse);
}

.calendar-footer {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--russ-bg-tertiary);
}

.calendar-today-btn,
.calendar-clear-btn {
  flex: 1;
  padding: 8px 16px;
  border: 1px solid var(--russ-border);
  border-radius: 8px;
  background: var(--russ-text-inverse);
  color: var(--russ-text-muted);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.calendar-today-btn:hover {
  background: var(--russ-bg-quaternary);
  border-color: var(--russ-secondary);
  color: var(--russ-secondary);
}

.calendar-clear-btn:hover {
  background: var(--russ-error-light);
  border-color: var(--russ-input-error);
  color: var(--russ-input-error);
}
</style>
