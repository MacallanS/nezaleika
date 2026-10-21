<template>
  <span
    :class="['p-chip', 'chip', { 'p-chip-selected': selected }, $attrs.class]"
    role="button"
    tabindex="0"
    @click="$emit('click', $event)"
    @keydown.enter="$emit('click', $event)"
  >
    {{ label }}
  </span>
</template>

<script setup lang="ts">
defineProps<{
  label?: string
  selected?: boolean
}>()
defineEmits<{ (e: 'click', ev: Event): void }>()
</script>

<style scoped>
.p-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  background: var(--russ-bg-tertiary);
  color: var(--russ-text-secondary);
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.2s, border-color 0.2s;
}
.p-chip:hover {
  background: var(--russ-bg-hover);
}
.p-chip-selected {
  background: var(--russ-primary);
  color: var(--russ-text-inverse);
  border-color: var(--russ-primary);
}
</style>
