<template>
  <div
    class="auth-page"
    :data-auth-redirecting="loading ? 'true' : undefined"
  >
    <AuthRRLayout
      :title="title"
      :subtitle="resolvedSubtitle"
      :policy-href="policy.policyHref"
      :logo-href="homeHref"
      hero-variant="login"
      body-spacing="lg"
      subtitle-spacing="lg"
    >
      <AuthRRButton
        type="button"
        top-spacing
        :label="loginButtonLabel"
        :loading="loading"
        :disabled="loading"
        @click="emit('login')"
      />

      <p v-if="authError" class="auth-rr-entry-error" role="alert">
        {{ authError }}
      </p>

      <AuthRRLegal
        :action-label="loginButtonLabel"
        :user-agreement-href="policy.userAgreementHref"
        :sopd-href="policy.sopdHref"
        :policy-href="policy.policyHref"
      />
    </AuthRRLayout>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { AuthRRLayout } from '../rr';
import { AuthRRButton } from 'bibli/shared/ui/rr';
import AuthRRLegal from '../rr/AuthRRLegal.vue';
import type { OidcRedirectAuthPolicy } from '../types';

const props = withDefaults(
  defineProps<{
    logo: string;
    logoAlt: string;
    title: string;
    policy: OidcRedirectAuthPolicy;
    subtitle?: string;
    homeHref?: string;
    loginButtonLabel?: string;
    loadingLabel?: string;
    hint?: string;
    loading?: boolean;
    authError?: string;
    showForgotPassword?: boolean;
    forgotPasswordHref?: string;
    forgotPasswordLabel?: string;
  }>(),
  {
    homeHref: '/',
    loginButtonLabel: 'Войти',
    loadingLabel: 'Переход…',
    hint: '',
    loading: false,
    authError: '',
    showForgotPassword: false,
    forgotPasswordHref: '/forgot_password/',
    forgotPasswordLabel: 'Забыли пароль?',
  },
);

const emit = defineEmits<{
  login: [];
}>();

const resolvedSubtitle = computed(
  () =>
    props.subtitle
    || 'Не удалось войти автоматически. Нажмите «Войти», чтобы повторить.',
);
</script>

<style scoped>
.auth-page {
  height: 100%;
  min-height: 0;
}

.auth-rr-entry-error {
  margin: 12px 0 0;
  font-family: var(--auth-rr-font-regular, inherit);
  font-size: var(--auth-rr-fs-s, var(--rr-font-size-font-size-s));
  line-height: var(--auth-rr-lh-s, var(--rr-line-height-line-height-s));
  color: var(--rr-input-text-error, #b42318);
}
</style>
