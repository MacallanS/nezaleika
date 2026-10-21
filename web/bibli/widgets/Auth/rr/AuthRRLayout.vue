<template>
  <div class="auth-rr-shell" :class="shellClass">
  <div class="auth-rr">
    <div class="auth-rr-form">
      <header class="auth-rr-header">
        <button
          v-if="backLabel"
          type="button"
          class="auth-rr-back"
          @click="emit('back')"
        >
          <span class="auth-rr-back__icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M14.5 6.5L9 12l5.5 5.5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
          {{ backLabel }}
        </button>
        <a
          v-else-if="logoHref"
          class="auth-rr-logo-link"
          :href="logoHref"
          @click="onLogoClick"
        >
          <img class="auth-rr-logo" :src="resolvedLogoSrc" width="147" height="32" :alt="resolvedLogoAlt" />
        </a>
        <img
          v-else
          class="auth-rr-logo"
          :src="resolvedLogoSrc"
          width="147"
          height="32"
          :alt="resolvedLogoAlt"
        />
        <!--
        <a
          class="auth-rr-support"
          :href="supportHref"
          target="_blank"
          rel="noopener noreferrer"
        >Поддержка</a>
        -->
      </header>

      <main class="auth-rr-main">
        <slot name="prepend" />
        <h1 v-if="title" class="auth-rr-title">{{ title }}</h1>
        <p
          v-if="subtitle"
          class="auth-rr-subtitle"
          :class="subtitleSpacingClass"
        >
          {{ subtitle }}
        </p>
        <div class="auth-rr-body" :class="bodySpacingClass">
          <slot />
        </div>
      </main>

      <footer class="auth-rr-footer">
        Мы используем cookie. Подробнее в
        <a :href="policyHref" target="_blank" rel="noopener noreferrer">Политике</a>
      </footer>
    </div>

    <aside
      class="auth-rr-hero"
      :class="{ 'auth-rr-hero--has-mobile': Boolean(hero.mobile) }"
      aria-hidden="true"
      :style="heroStyle"
    >
      <img
        class="auth-rr-hero__img auth-rr-hero__img--desktop"
        :src="hero.src"
        :width="hero.width"
        :height="hero.height"
        alt=""
        loading="eager"
        decoding="async"
      />
      <img
        v-if="hero.mobile"
        class="auth-rr-hero__img auth-rr-hero__img--mobile"
        :src="hero.mobile.src"
        :width="hero.mobile.width"
        :height="hero.mobile.height"
        alt=""
        loading="eager"
        decoding="async"
      />
    </aside>
  </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  authRrBrand,
  authRrLegalLinks,
  getAuthRrHero,
  type AuthRrHeroVariant,
} from 'bibli/shared/assets/auth/rr';
import './auth-rr-layout.css';

export type AuthRRLayoutSpacing = 'none' | 'sm' | 'lg';
/** form — белый canvas входа; loading — #f2f3f7 как bootstrap-shell SSO↔SPA */
export type AuthRRLayoutShellVariant = 'form' | 'loading';
export type { AuthRrHeroVariant as AuthRRLayoutHeroVariant };

const props = withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    supportHref?: string;
    policyHref?: string;
    /** Если задан — логотип ведёт на страницу входа (клик через logoClick для SPA). */
    logoHref?: string;
    /** Переопределение wordmark (по умолчанию Руссайфин). */
    logoSrc?: string;
    logoAlt?: string;
    /** Отступ сверху у .auth-rr-body: none — 0, sm — 12px, lg — 24px */
    bodySpacing?: AuthRRLayoutSpacing;
    /** Нижний отступ у подзаголовка: sm — 16px, lg — 24px */
    subtitleSpacing?: AuthRRLayoutSpacing;
    /** login | password-recovery | enter-code — см. bibli/shared/assets/auth/rr */
    heroVariant?: AuthRrHeroVariant;
    /** Если задан — вместо логотипа кнопка «назад» */
    backLabel?: string;
    /**
     * loading — тот же canvas/отступы, что у #app-bootstrap-shell
     * (не перебивать preview-формой).
     */
    shellVariant?: AuthRRLayoutShellVariant;
  }>(),
  {
    subtitle: '',
    supportHref: authRrLegalLinks.support,
    policyHref: authRrLegalLinks.personalDataPolicy,
    logoHref: '',
    logoSrc: '',
    logoAlt: '',
    bodySpacing: 'sm',
    subtitleSpacing: 'sm',
    heroVariant: 'login',
    backLabel: '',
    shellVariant: 'form',
  },
);

const hero = computed(() => getAuthRrHero(props.heroVariant));

const resolvedLogoSrc = computed(() => props.logoSrc || authRrBrand.logo);
const resolvedLogoAlt = computed(() => props.logoAlt || 'РУССАЙФИН');

const heroStyle = computed(() => {
  const style = {
    '--auth-rr-hero-ar-w': hero.value.width,
    '--auth-rr-hero-ar-h': hero.value.height,
  };
  if (hero.value.mobile) {
    style['--auth-rr-hero-mobile-ar-w'] = hero.value.mobile.width;
    style['--auth-rr-hero-mobile-ar-h'] = hero.value.mobile.height;
  }
  return style;
});

const bodySpacingClass = computed(() =>
  props.bodySpacing ? `auth-rr-body--spacing-${props.bodySpacing}` : '',
);

const subtitleSpacingClass = computed(() =>
  props.subtitleSpacing ? `auth-rr-subtitle--spacing-${props.subtitleSpacing}` : '',
);

const shellClass = computed(() =>
  props.shellVariant === 'loading' ? 'auth-rr-shell--loading' : '',
);

const emit = defineEmits<{
  logoClick: [event: MouseEvent];
  back: [];
}>();

function onLogoClick(event: MouseEvent) {
  if (!props.logoHref) {
    return;
  }
  emit('logoClick', event);
}
</script>
