<template>
  <span
    class="pill"
    :class="{
      ghost,
      'pill-status': status,
      'pill-sm': size === 'sm',
      'pill-md': size === 'md',
      'pill-lg': size === 'lg',
    }"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  ghost?: boolean
  status?: boolean
  size?: 'sm' | 'md' | 'lg'
}>(), {
  ghost: false,
  status: false,
  size: 'md',
})
</script>

<style scoped>
.pill {
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--russ-primary);
  color: var(--russ-text-inverse);
  font-weight: 700;
  font-size: 12px;
  line-height: 1.2;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.pill.pill-sm {
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 800;
}

.pill.pill-lg {
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 800;
}

.pill.ghost {
  background: var(--russ-bg-hover);
  border: 1px solid var(--russ-border);
  color: var(--russ-text-secondary);
}

.pill.pill-status {
  border: none;
}
</style>
