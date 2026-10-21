<template>
  <div v-show="isActive" class="step-panel">
    <slot :activateCallback="goToStep" />
  </div>
</template>

<script setup>
import { computed, inject, unref } from 'vue'

defineProps({
  value: { type: String, default: '' }
})

const stepperContext = inject('stepperContext')
const stepValue = inject('stepValue', '')

const currentStep = computed(() => stepperContext?.currentStep?.value ?? '')
const goToStep = stepperContext?.goToStep ?? (() => {})

const isActive = computed(() => currentStep.value === String(unref(stepValue) ?? ''))

// Slot props for v-slot="{ activateCallback }"
const activateCallback = goToStep
</script>

<style scoped>

</style>
