<template>
  <button
    class="auth-rr-button"
    :class="[
      `auth-rr-button--${variant}`,
      {
        'auth-rr-button--top-spacing': topSpacing,
        'auth-rr-button--loading': loading,
      },
    ]"
    :disabled="disabled || loading"
    :aria-busy="loading ? 'true' : undefined"
    v-bind="$attrs"
  >
    <span v-if="loading" class="auth-rr-button__spinner" aria-hidden="true" />
    <span class="auth-rr-button__label" :class="{ 'auth-rr-button__label--hidden': loading }">
      <slot>{{ label }}</slot>
    </span>
  </button>
</template>

<script setup lang="ts">
import './auth-rr-button.css';

withDefaults(
  defineProps<{
    label?: string;
    variant?: 'brand-primary' | 'brand-secondary' | 'neutral-secondary';
    disabled?: boolean;
    topSpacing?: boolean;
    loading?: boolean;
  }>(),
  {
    label: '',
    variant: 'brand-primary',
    disabled: false,
    topSpacing: false,
    loading: false,
  },
);
</script>
