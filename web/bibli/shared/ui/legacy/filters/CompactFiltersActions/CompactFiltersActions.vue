<template>
  <div class="compact-filters-actions">
    <button
      type="button"
      class="compact-filters-btn compact-filters-btn--primary"
      :disabled="loading"
      @click="$emit('apply')"
    >
      Применить
    </button>
    <button
      v-if="secondaryLabel"
      type="button"
      class="compact-filters-btn compact-filters-btn--secondary"
      :disabled="secondaryDisabled || loading"
      @click="$emit('secondary')"
    >
      {{ secondaryLabel }}
    </button>
    <button
      v-if="showReset"
      type="button"
      class="compact-filters-btn compact-filters-btn--ghost"
      :disabled="loading"
      @click="$emit('reset')"
    >
      Сбросить
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  loading?: boolean;
  showReset?: boolean;
  secondaryLabel?: string;
  secondaryDisabled?: boolean;
}>();

defineEmits<{
  (e: "apply"): void;
  (e: "reset"): void;
  (e: "secondary"): void;
}>();
</script>

<style scoped>
.compact-filters-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.compact-filters-btn {
  height: 36px;
  min-height: 36px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
}

.compact-filters-btn--primary {
  background: var(--russ-primary);
  border-color: var(--russ-primary);
  color: var(--russ-text-inverse);
}

.compact-filters-btn--primary:hover:not(:disabled) {
  background: var(--russ-primary-dark);
  border-color: var(--russ-primary-dark);
}

.compact-filters-btn--ghost {
  background: var(--russ-bg);
  border-color: var(--russ-border);
  color: var(--russ-text-secondary);
}

.compact-filters-btn--ghost:hover:not(:disabled) {
  background: var(--russ-bg-hover);
  border-color: var(--russ-border-dark);
}

.compact-filters-btn--secondary {
  background: var(--russ-bg);
  border-color: var(--russ-border);
  color: var(--russ-text-secondary);
}

.compact-filters-btn--secondary:hover:not(:disabled) {
  background: var(--russ-bg-hover);
  border-color: var(--russ-primary);
}

.compact-filters-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
