<template>
  <div class="step-item">
    <slot />
  </div>
</template>

<script setup>
import { provide, toRef } from 'vue'

const props = defineProps({
  value: { type: String, required: true }
})

provide('stepValue', toRef(props, 'value'))
</script>

<style scoped>
.step-item {
  display: contents;
}
</style>
