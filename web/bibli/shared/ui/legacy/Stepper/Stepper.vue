<template>
  <div :class="['stepper', props.class]">
    <slot />
  </div>
</template>

<script setup>
import { computed, provide } from 'vue'

const props = defineProps({
  value: { type: String, default: '' },
  modelValue: { type: String, default: '' },
  class: { type: String, default: '' }
})

const emit = defineEmits(['update:value', 'update:modelValue'])

const currentStep = computed(() => props.value || props.modelValue)

function goToStep(step) {
  emit('update:value', step)
  emit('update:modelValue', step)
}

provide('stepperContext', {
  currentStep,
  goToStep
})
</script>

<style scoped>
.stepper {
  display: flex;
  flex-direction: column;
  gap: 0;
}
</style>
