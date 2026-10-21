<template>
  <div class="auth-rr-field" :class="{ 'auth-rr-field--error': !!displayError }">
    <label v-if="label && !$slots['label-aside']" class="auth-rr-field__label" :for="fieldId">
      {{ label }}
    </label>
    <div v-else-if="label || $slots['label-aside']" class="auth-rr-field__label-row">
      <label v-if="label" class="auth-rr-field__label" :for="fieldId">{{ label }}</label>
      <slot name="label-aside" />
    </div>
    <div class="auth-rr-field__control">
      <slot :id="fieldId" />
    </div>
    <p v-if="displayError" class="auth-rr-field__error" role="alert">{{ displayError }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue';
import './auth-rr-input.css';

const props = withDefaults(
  defineProps<{
    label?: string;
    error?: string;
    fieldId?: string;
  }>(),
  {
    label: '',
    error: '',
    fieldId: '',
  },
);

const autoId = useId();
const fieldId = computed(() => props.fieldId || `auth-rr-field-${autoId}`);
const displayError = computed(() => props.error);
</script>
