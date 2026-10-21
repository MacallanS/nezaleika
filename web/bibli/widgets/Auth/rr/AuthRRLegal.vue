<template>
  <p class="auth-rr-legal">
    Нажимая на «{{ actionLabel }}», вы подтверждаете согласие с
    <a :href="userAgreementHref" target="_blank" rel="noopener noreferrer">Пользовательским соглашением</a>,
    <a :href="sopdHref" target="_blank" rel="noopener noreferrer">Согласием на обработку персональных данных</a>
    и
    <a :href="policyHref" target="_blank" rel="noopener noreferrer">Политикой в отношении обработки персональных данных</a>
  </p>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    actionLabel?: string;
    userAgreementHref: string;
    sopdHref: string;
    policyHref: string;
  }>(),
  {
    actionLabel: 'Войти',
  },
);
</script>

<style scoped>
.auth-rr-legal {
  margin: 16px 0 0;
  font-family: var(--auth-rr-font-regular, 'Onest Regular', 'Onest', system-ui, sans-serif);
  font-size: var(--auth-rr-fs-xs, var(--rr-font-size-font-size-xs));
  font-weight: normal;
  line-height: var(--auth-rr-lh-xs, var(--rr-line-height-line-height-xs));
  letter-spacing: var(--auth-rr-track-s, var(--rr-tracking-tracking-s));
  color: var(--rr-labels-neutral-secondary);
  text-align: left;
}

.auth-rr-legal a {
  font: inherit;
  letter-spacing: inherit;
  color: var(--rr-labels-brand-primary);
  text-decoration: none;
}

.auth-rr-legal a:hover {
  text-decoration: underline;
}
</style>
