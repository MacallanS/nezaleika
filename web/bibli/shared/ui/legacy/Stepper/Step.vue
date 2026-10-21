<template>
  <div class="step" @click="$emit('click')">
    <slot />
  </div>
</template>

<script setup>
defineEmits(['click'])
</script>

<style scoped>
.step {
  cursor: pointer;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  transition: background 0.2s;
}
.step:hover {
  background: var(--russ-bg-hover, var(--russ-bg-hover));
}
</style>
