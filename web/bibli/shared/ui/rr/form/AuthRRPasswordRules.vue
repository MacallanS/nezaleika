<template>
  <ul class="auth-rr-password-rules" role="list">
    <li
      v-for="rule in rules"
      :key="rule.id"
      class="auth-rr-password-rules__item"
      :class="{ 'auth-rr-password-rules__item--met': rule.met }"
    >
      <span class="auth-rr-password-rules__icon" aria-hidden="true">
        <img :src="authRrIcons.checkContained" width="12" height="12" alt="" />
      </span>
      <span class="auth-rr-password-rules__label">{{ rule.label }}</span>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { authRrIcons } from 'bibli/shared/assets/auth/rr';
import { getPasswordRulesList } from './composables/usePasswordRules.js';
import './auth-rr-password-rules.css';

const props = defineProps<{
  password?: string;
}>();

const rules = computed(() => getPasswordRulesList(props.password));
</script>
