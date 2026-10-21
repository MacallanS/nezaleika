<template>
  <div class="filters-actions" :class="{ 'filters-actions--single': isSingleAction }">
    <button
      type="button"
      class="filters-actions__btn filters-actions__btn--primary"
      :disabled="loading"
      @click="$emit('apply')"
    >
      Применить
    </button>
    <button
      v-if="secondaryLabel"
      type="button"
      class="filters-actions__btn filters-actions__btn--secondary"
      :disabled="secondaryDisabled || loading"
      @click="$emit('secondary')"
    >
      {{ secondaryLabel }}
    </button>
    <button
      v-if="showReset"
      type="button"
      class="reset-filters-btn"
      :disabled="loading"
      title="Сбросить все фильтры"
      @click="$emit('reset')"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M21 3v5h-5"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M3 21v-5h5"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      Сбросить
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  loading?: boolean;
  showReset?: boolean;
  secondaryLabel?: string;
  secondaryDisabled?: boolean;
}>();

const isSingleAction = computed(() => !props.secondaryLabel && !props.showReset);

defineEmits<{
  (e: "apply"): void;
  (e: "reset"): void;
  (e: "secondary"): void;
}>();
</script>

<style scoped>
.filters-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.filters-actions--single {
  display: flex;
  width: 100%;
}

.filters-actions--single .filters-actions__btn {
  width: 100%;
}

.filters-actions__btn,
.reset-filters-btn {
  font-family: var(--filter-control-font-family, var(--russ-font-family));
  font-size: var(--filter-control-font-size, 14px);
  font-weight: var(--filter-control-font-weight, 500);
  line-height: var(--filter-control-line-height, 1.2);
  min-height: var(--filter-control-height, var(--ui-control-height, 40px));
  height: var(--filter-control-height, var(--ui-control-height, 40px));
  padding: 0 var(--filter-control-padding-x, 12px);
  border-radius: var(--filter-control-radius, 10px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  box-sizing: border-box;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}

.filters-actions__btn--primary {
  border: 1px solid transparent;
  background: var(--russ-primary);
  color: var(--russ-text-inverse);
  cursor: pointer;
}

.filters-actions__btn--primary:hover:not(:disabled) {
  background: var(--russ-primary-dark);
}

.filters-actions__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.filters-actions__btn--secondary {
  background: var(--russ-bg-hover);
  border: 1px solid var(--russ-border);
  color: var(--russ-text-secondary);
  cursor: pointer;
}

.filters-actions__btn--secondary:hover:not(:disabled) {
  background: var(--russ-border);
  border-color: var(--russ-border-dark);
}

.reset-filters-btn {
  border: 1px solid var(--russ-border);
  background: var(--russ-bg);
  color: var(--russ-text-secondary);
  gap: 8px;
  cursor: pointer;
}

.reset-filters-btn:hover:not(:disabled) {
  background: var(--russ-bg-hover);
  border-color: var(--russ-border-dark);
}

.reset-filters-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
