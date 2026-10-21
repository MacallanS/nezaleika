<template>
  <!-- Single root: Nuxt route transitions require one vnode from the page tree. -->
  <div class="auth-rr-callback-page-root">
    <!-- Loading UI — только #app-bootstrap-shell (AuthRrLoadingPage). -->
    <AuthRrLoadingPage
      v-if="isLoading"
      :title="waitTitle"
      :subtitle="waitDescription"
      :policy-href="policyHref"
      :support-href="supportHref"
      :hero-variant="heroVariant"
    />

    <AuthRRLayout
      v-else
      :title="pageTitle"
      :subtitle="pageSubtitle"
      :policy-href="policyHref"
      :support-href="supportHref"
      :hero-variant="heroVariant"
      shell-variant="loading"
      body-spacing="lg"
      subtitle-spacing="lg"
    >
      <div class="auth-rr-callback-actions">
        <AuthRRButton
          variant="brand-primary"
          @click="emit('retry-login')"
        >
          {{ retryLoginText }}
        </AuthRRButton>
        <AuthRRButton
          v-if="canReloadCallback"
          variant="brand-secondary"
          @click="emit('reload')"
        >
          {{ reloadText }}
        </AuthRRButton>
        <button
          type="button"
          class="auth-rr-callback-link"
          @click="emit('back-to-auth')"
        >
          {{ backToAuthText }}
        </button>
      </div>
    </AuthRRLayout>
  </div>
</template>

<style scoped>
/* Реальный root-box нужен Nuxt route-provider (display:contents → warning + broken nav). */
.auth-rr-callback-page-root {
  display: block;
  min-height: 100%;
}
</style>

<script setup lang="ts">
import { computed, nextTick, onMounted, watch } from 'vue';
import { authRrLegalLinks, type AuthRrHeroVariant } from 'bibli/shared/assets/auth/rr';
import AuthRRLayout from './AuthRRLayout.vue'
import AuthRrLoadingPage from './AuthRrLoadingPage.vue'
import { AuthRRButton } from 'bibli/shared/ui/rr'
import { AUTH_RR_LOADING_COPY } from './authRrLoadingCopy'
import { hideAuthRrLoadingOverlay } from './hideAuthRrLoadingOverlay'
import './auth-rr-spinner.css'

function isAuthRrContentReady(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  const appShell = document.querySelector('.auth-rr-shell:not(#app-bootstrap-shell)');
  if (!appShell) {
    return false;
  }
  return Boolean(
    appShell.querySelector('.auth-rr-callback-status, .auth-rr-callback-actions'),
  );
}

function hideBootstrapShellWhenReady(): void {
  if (typeof window === 'undefined') {
    return;
  }
  const hideWhenReady = (window as Window & {
    __hideBootstrapShellWhenReady?: () => Promise<void>;
  }).__hideBootstrapShellWhenReady;
  if (hideWhenReady) {
    void hideWhenReady();
    return;
  }
  hideAuthRrLoadingOverlay();
}

function tryHideBootstrapShell(attempt = 0): void {
  if (isAuthRrContentReady() || attempt > 120) {
    hideBootstrapShellWhenReady();
    return;
  }
  requestAnimationFrame(() => tryHideBootstrapShell(attempt + 1));
}

function scheduleHideBootstrapForReplacementUi(): void {
  void nextTick(() => {
    requestAnimationFrame(() => tryHideBootstrapShell());
  });
}

const props = withDefaults(
  defineProps<{
    busy?: boolean;
    errorText?: string | null;
    canReloadCallback?: boolean;
    waitTitle?: string;
    waitDescription?: string;
    errorTitle?: string;
    retryLoginText?: string;
    reloadText?: string;
    backToAuthText?: string;
    policyHref?: string;
    supportHref?: string;
    heroVariant?: AuthRrHeroVariant;
  }>(),
  {
    busy: true,
    errorText: null,
    canReloadCallback: false,
    waitTitle: AUTH_RR_LOADING_COPY.title,
    waitDescription: AUTH_RR_LOADING_COPY.subtitle,
    errorTitle: 'Не удалось войти',
    retryLoginText: 'Попробовать снова',
    reloadText: 'Обновить страницу',
    backToAuthText: 'Вернуться ко входу',
    policyHref: authRrLegalLinks.personalDataPolicy,
    supportHref: authRrLegalLinks.support,
    heroVariant: 'login',
  },
);

const emit = defineEmits<{
  'retry-login': [];
  reload: [];
  'back-to-auth': [];
}>();

const isLoading = computed(() => props.busy && !props.errorText);

const pageTitle = computed(() =>
  isLoading.value ? props.waitTitle : props.errorTitle,
);

const pageSubtitle = computed(() =>
  isLoading.value ? props.waitDescription : (props.errorText ?? ''),
);

watch(isLoading, (loading, wasLoading) => {
  if (loading || wasLoading === undefined) {
    return;
  }
  scheduleHideBootstrapForReplacementUi();
});

onMounted(() => {
  if (!isLoading.value) {
    scheduleHideBootstrapForReplacementUi();
  }
});
</script>
