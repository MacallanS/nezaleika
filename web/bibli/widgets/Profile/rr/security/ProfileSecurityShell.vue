<template>
  <div class="profile-security-shell" :class="`profile-security-shell--${variant}`">
    <header class="profile-security-shell__header">
      <button
        v-if="!hideBack"
        type="button"
        class="profile-security-shell__back"
        aria-label="Назад"
        @click="onBack"
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
      <h1 v-if="title" class="profile-security-shell__title">{{ title }}</h1>
    </header>

    <div class="profile-security-shell__body">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="profile-security-shell__footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useProfileNavigate } from '../../composables/useProfileServices'

const props = withDefaults(
  defineProps<{
    title?: string
    backTo?: string
    variant?: 'card' | 'plain'
    hideBack?: boolean
  }>(),
  {
    title: '',
    backTo: '/profile',
    variant: 'card',
    hideBack: false,
  },
)

const navigateTo = useProfileNavigate()

function onBack() {
  void navigateTo(props.backTo)
}
</script>
