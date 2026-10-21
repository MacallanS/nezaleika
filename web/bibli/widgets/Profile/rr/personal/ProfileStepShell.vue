<template>
  <div class="profile-step-shell">
    <header class="profile-step-shell__header">
      <button
        type="button"
        class="profile-step-shell__back"
        aria-label="Назад"
        @click="$emit('back')"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M14.5 6.5L9 12l5.5 5.5"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <p v-if="!hideProgress" class="profile-step-shell__step" aria-live="polite">
        {{ stepLabel }}
      </p>
    </header>

    <AuthRRStepProgress v-if="!hideProgress" :current="current" :total="total" />

    <div ref="bodyRef" class="profile-step-shell__body">
      <div class="profile-step-shell__content">
        <div v-if="rejection || title || subtitle" class="profile-step-shell__intro">
          <ProfileStepRejectionBlock
            v-if="rejection"
            :reason-label="rejection.reasonLabel"
            :comment="rejection.comment"
            :hint="rejection.hint"
          />
          <template v-else>
            <h1 v-if="title" class="profile-step-shell__title">{{ title }}</h1>
            <p v-if="subtitle" class="profile-step-shell__subtitle">{{ subtitle }}</p>
          </template>
        </div>
        <slot />
      </div>
    </div>

    <div class="profile-step-shell__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { AuthRRStepProgress } from 'bibli/shared/ui/rr'
import ProfileStepRejectionBlock from './ProfileStepRejectionBlock.vue'

const props = defineProps({
  current: { type: Number, required: true },
  total: { type: Number, default: 5 },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  stepText: { type: String, default: '' },
  /** Режим просмотра: без счётчика шага и полоски прогресса */
  hideProgress: { type: Boolean, default: false },
  /** Блок «Причина отклонения» вместо заголовка на итоговом шаге */
  rejection: {
    type: Object,
    default: null,
  },
})

defineEmits(['back'])

const bodyRef = ref(null)

const stepLabel = computed(() => {
  if (props.stepText) return props.stepText
  return `Шаг ${props.current} из ${props.total}`
})

/** На мобилке открытый native select + скролл контейнера ломает вёрстку. */
function blurFocusedSelect() {
  const active = document.activeElement
  if (active && active.tagName === 'SELECT') {
    active.blur()
  }
}

onMounted(() => {
  bodyRef.value?.addEventListener('scroll', blurFocusedSelect, { passive: true })
})

onBeforeUnmount(() => {
  bodyRef.value?.removeEventListener('scroll', blurFocusedSelect)
})
</script>

<style scoped>
.profile-step-shell,
.profile-step-shell *,
.profile-step-shell *::before,
.profile-step-shell *::after {
  box-sizing: border-box;
}

.profile-step-shell {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  flex: 1 1 0;
  overflow: hidden;
  overscroll-behavior: none;
  -webkit-overscroll-behavior: none;
  touch-action: pan-y;
  background: var(--rr-backgrounds-primary);
  color: var(--rr-labels-neutral-primary);
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  padding:
    calc(var(--app-page-rr-header-top, var(--rr-spacing-padding-m)) + env(safe-area-inset-top, 0px))
    0
    calc(var(--rr-spacing-padding-xl) + env(safe-area-inset-bottom, 0px));
}

/* Desktop: пока колонка как на мобилке / home activation (480px по центру). */
@media (min-width: 768px) {
  .profile-step-shell {
    max-width: 480px;
    width: 100%;
    margin-inline: auto;
  }
}

@media (max-width: 767px) {
  .profile-step-shell {
    padding-bottom: calc(
      var(--rr-spacing-padding-xl) + var(--app-mobile-tabbar-content-inset, 68px)
    );
  }
}

.profile-step-shell__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--rr-size-3-xl);
  margin-bottom: var(--rr-spacing-padding-xl);
  padding: 0 var(--app-page-rr-gutter, var(--rr-spacing-padding-xl));
  flex: 0 0 auto;
}

.profile-step-shell__back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--rr-size-3-xl);
  height: var(--rr-size-3-xl);
  margin: 0 0 0 var(--rr-spacing-margin-neg-l);
  padding: 0;
  border: none;
  border-radius: var(--rr-radius-m);
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.profile-step-shell__step {
  margin: 0;
  font-size: var(--rr-font-size-font-size-s);
  line-height: var(--rr-line-height-line-height-s);
  font-weight: 500;
  color: var(--rr-labels-neutral-secondary);
}

.profile-step-shell :deep(.auth-rr-step-progress) {
  flex: 0 0 auto;
  gap: var(--rr-spacing-padding-m);
  padding:
    0
    var(--app-page-rr-gutter, var(--rr-spacing-padding-xl))
    var(--rr-spacing-padding-3-xl, 24px);
}

.profile-step-shell :deep(.auth-rr-step-progress__segment--active) {
  background: var(--rr-labels-brand-primary);
}

.profile-step-shell__body {
  flex: 1 1 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  overscroll-behavior-x: none;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  display: block;
  overflow-anchor: none;
  padding:
    var(--rr-spacing-padding-none)
    0
    var(--rr-spacing-padding-l);
  scrollbar-width: none;
}

.profile-step-shell__body::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.profile-step-shell__content {
  padding-inline: var(--app-page-rr-gutter, var(--rr-spacing-padding-xl));
}

.profile-step-shell__intro {
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-s);
  margin-bottom: var(--rr-spacing-padding-3-xl, 24px);
}

.profile-step-shell__title {
  margin: 0;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 600;
  font-style: normal;
  font-size: var(--rr-font-size-font-size-xl);
  line-height: var(--rr-line-height-line-height-xl);
  letter-spacing: var(--rr-tracking-tracking-xl);
}

.profile-step-shell__subtitle {
  margin: 0;
  font-size: var(--rr-font-size-font-size-m);
  line-height: var(--rr-line-height-line-height-m);
  color: var(--rr-labels-neutral-secondary);
}

.profile-step-shell__footer {
  flex: 0 0 auto;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-m);
  padding: var(--rr-spacing-padding-l) var(--app-page-rr-gutter, var(--rr-spacing-padding-xl)) 0;
  background: var(--rr-backgrounds-primary);
}

.profile-step-shell__footer :deep(.profile-rr-checkbox) {
  width: 100%;
}

.profile-step-shell :deep(.auth-rr-input__control) {
  box-sizing: border-box;
  height: var(--rr-size-4-xl);
  min-height: var(--rr-size-4-xl);
  max-height: var(--rr-size-4-xl);
  padding: 0 var(--app-page-rr-gutter, var(--rr-spacing-padding-xl));
  border: none;
  border-radius: var(--rr-radius-m);
  background-color: var(--rr-input-background-default);
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-size: var(--rr-font-size-font-size-m);
  font-weight: 400;
  font-style: normal;
  line-height: var(--rr-line-height-line-height-m);
  letter-spacing: var(--rr-tracking-tracking-m);
  text-align: left;
  color: var(--rr-input-text-fill);
}

.profile-step-shell :deep(.auth-rr-input__control::placeholder) {
  text-align: left;
  color: var(--rr-input-text-default);
}

.profile-step-shell :deep(.auth-rr-input__control:hover:not(:disabled):not([readonly]):not(.auth-rr-input__control--error):not(:focus):not(:focus-visible)) {
  border: none;
  background-color: var(--rr-input-background-hover);
}

.profile-step-shell :deep(.auth-rr-input__control:focus),
.profile-step-shell :deep(.auth-rr-input__control:focus-visible) {
  outline: none;
  border: none;
  background-color: var(--rr-input-background-default);
}

.profile-step-shell :deep(.auth-rr-input__control:disabled),
.profile-step-shell :deep(.auth-rr-input__control[readonly]) {
  border: none;
  background-color: var(--rr-input-background-default);
  color: var(--rr-input-text-fill);
  opacity: 0.6;
}

.profile-step-shell :deep(.auth-rr-input__control:-webkit-autofill),
.profile-step-shell :deep(.auth-rr-input__control:-webkit-autofill:hover),
.profile-step-shell :deep(.auth-rr-input__control:-webkit-autofill:focus) {
  -webkit-text-fill-color: var(--rr-input-text-fill);
  caret-color: var(--rr-input-text-fill);
  border: none;
  box-shadow: 0 0 0 1000px var(--rr-input-background-default) inset;
}

.profile-step-shell :deep(.auth-rr-input-phone) {
  --auth-rr-phone-h: var(--rr-size-4-xl);
  --auth-rr-phone-bg: var(--rr-input-background-default);
  height: var(--rr-size-4-xl);
  min-height: var(--rr-size-4-xl);
  max-height: var(--rr-size-4-xl);
  gap: var(--rr-spacing-padding-m);
  border: none;
  border-radius: var(--rr-radius-m);
  background-color: var(--rr-input-background-default);
}

.profile-step-shell :deep(.auth-rr-input-phone:hover:not(.auth-rr-input-phone--error):not(:focus-within)) {
  --auth-rr-phone-bg: var(--rr-input-background-hover);
  border: none;
  background-color: var(--auth-rr-phone-bg);
}

.profile-step-shell :deep(.auth-rr-input-phone:focus-within:not(.auth-rr-input-phone--error)) {
  --auth-rr-phone-bg: var(--rr-input-background-default);
  border: none;
  background-color: var(--auth-rr-phone-bg);
}

.profile-step-shell :deep(.auth-rr-input-phone:has(.auth-rr-input-phone__input:disabled)) {
  --auth-rr-phone-bg: var(--rr-input-background-default);
  border: none;
  background-color: var(--auth-rr-phone-bg);
  opacity: 0.6;
}

.profile-step-shell :deep(.auth-rr-input-phone:has(.auth-rr-input-phone__input[readonly])) {
  cursor: pointer;
}

.profile-step-shell :deep(.auth-rr-input-phone:has(.auth-rr-input-phone__input[readonly]) .auth-rr-input-phone__input) {
  cursor: pointer;
}

.profile-step-shell :deep(.auth-rr-input-phone__flag) {
  margin-left: var(--rr-spacing-padding-m);
}

.profile-step-shell :deep(.auth-rr-input-phone__prefix),
.profile-step-shell :deep(.auth-rr-input-phone__display),
.profile-step-shell :deep(.auth-rr-input-phone__typed),
.profile-step-shell :deep(.auth-rr-input-phone__mask),
.profile-step-shell :deep(.auth-rr-input-phone__input) {
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-size: var(--rr-font-size-font-size-m);
  font-weight: 400;
  font-style: normal;
  line-height: var(--rr-line-height-line-height-m);
  letter-spacing: var(--rr-tracking-tracking-m);
}

.profile-step-shell :deep(.auth-rr-field__label) {
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-size: var(--rr-font-size-font-size-s);
  font-weight: 400;
  font-style: normal;
  line-height: 140%;
  letter-spacing: 0;
  vertical-align: middle;
  color: #000000;
  margin-bottom: var(--rr-spacing-margin-m);
}

.profile-step-shell--review-muted :deep(.auth-rr-input__control),
.profile-step-shell--review-muted :deep(.auth-rr-input__control[readonly]),
.profile-step-shell--review-muted :deep(.auth-rr-input__control:disabled) {
  color: var(--rr-labels-neutral-primary, #101012);
  -webkit-text-fill-color: var(--rr-labels-neutral-primary, #101012);
  background-color: var(--rr-input-background-fills, #f8f9fb);
  opacity: 1;
}

.profile-step-shell--review-muted :deep(.auth-rr-input-phone),
.profile-step-shell--review-muted :deep(.auth-rr-input-phone:has(.auth-rr-input-phone__input[readonly])),
.profile-step-shell--review-muted :deep(.auth-rr-input-phone:has(.auth-rr-input-phone__input:disabled)) {
  --auth-rr-phone-bg: var(--rr-input-background-fills, #f8f9fb);
  background-color: var(--auth-rr-phone-bg);
  opacity: 1;
}

.profile-step-shell--review-muted :deep(.auth-rr-input-phone__prefix),
.profile-step-shell--review-muted :deep(.auth-rr-input-phone__cc),
.profile-step-shell--review-muted :deep(.auth-rr-input-phone__paren),
.profile-step-shell--review-muted :deep(.auth-rr-input-phone__paren--filled) {
  color: var(--rr-labels-neutral-primary, #101012);
}

.profile-step-shell--review-muted :deep(.auth-rr-input-phone__input) {
  color: var(--rr-labels-neutral-primary, #101012);
  -webkit-text-fill-color: var(--rr-labels-neutral-primary, #101012);
  caret-color: var(--rr-labels-neutral-primary, #101012);
}

/* Пол: та же высота контрола, что у инпутов (на desktop --rr-size-4-xl = 64px). */
.profile-step-shell :deep(.profile-rr-gender__control) {
  height: var(--rr-size-4-xl);
  min-height: var(--rr-size-4-xl);
  max-height: var(--rr-size-4-xl);
  border-radius: var(--rr-radius-m);
  background: var(--rr-input-background-default);
}

.profile-step-shell--review-muted :deep(.profile-rr-gender__control) {
  background: var(--rr-input-background-fills, #f8f9fb);
}

.profile-step-shell--review-muted :deep(.profile-rr-gender__option:disabled) {
  opacity: 1;
  cursor: default;
}
</style>
