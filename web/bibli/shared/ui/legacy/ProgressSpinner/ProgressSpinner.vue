<template>
  <div :class="['p-progress-spinner', $attrs.class]" :style="$attrs.style || { width: '40px', height: '40px' }" role="status" aria-label="Загрузка">
    <svg class="p-progress-spinner-svg" viewBox="0 0 100 100">
      <circle class="p-progress-spinner-circle" cx="50" cy="50" r="45" fill="none" :stroke-width="props.strokeWidth" />
    </svg>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{ style?: string | Record<string, string>; strokeWidth?: string | number }>(),
  { strokeWidth: '3' }
)
</script>

<style scoped>
.p-progress-spinner {
  display: inline-block;
  animation: p-spinner-rotate 1s linear infinite;
}
.p-progress-spinner-svg {
  width: 100%;
  height: 100%;
}
.p-progress-spinner-circle {
  stroke: var(--russ-primary);
  stroke-dasharray: 283;
  stroke-dashoffset: 75;
  stroke-linecap: round;
}
@keyframes p-spinner-rotate {
  to { transform: rotate(360deg); }
}
</style>
