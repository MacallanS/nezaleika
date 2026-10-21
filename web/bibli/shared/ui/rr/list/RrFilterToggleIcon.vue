<template>
  <svg
    class="rr-filter-toggle-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M6.46154 12H17.5385M4 7H20M10.1538 17H13.8462"
      stroke="currentColor"
      stroke-width="1.3"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  size?: number | string
}>(), {
  size: 24,
})
</script>

<style scoped>
.rr-filter-toggle-icon {
  display: block;
  flex-shrink: 0;
}
</style>
