<template>
  <svg
    class="rr-search-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M16.6903 16.8L19.998 20M18.9314 11.4667C18.9314 15.5904 15.5884 18.9333 11.4647 18.9333C7.34099 18.9333 3.99805 15.5904 3.99805 11.4667C3.99805 7.34294 7.34099 4 11.4647 4C15.5884 4 18.9314 7.34294 18.9314 11.4667Z"
      stroke="currentColor"
      stroke-width="1.3"
      stroke-linecap="round"
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
.rr-search-icon {
  display: block;
  flex-shrink: 0;
}
</style>
