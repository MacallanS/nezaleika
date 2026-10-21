<template>
  <div
    class="auth-rr-step-progress"
    role="progressbar"
    :aria-valuenow="current"
    :aria-valuemin="1"
    :aria-valuemax="total"
    :aria-label="`Шаг ${current} из ${total}`"
  >
    <span
      v-for="index in total"
      :key="index"
      class="auth-rr-step-progress__segment"
      :class="{ 'auth-rr-step-progress__segment--active': index <= current }"
    />
  </div>
</template>

<script setup lang="ts">
import './auth-rr-step-progress.css';

withDefaults(
  defineProps<{
    current?: number;
    total?: number;
  }>(),
  {
    current: 1,
    total: 3,
  },
);
</script>
