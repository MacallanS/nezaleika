<template>
  <!-- Loading UI живёт только в #app-bootstrap-shell — один компонент для всех экранов. -->
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { authRrLegalLinks, type AuthRrHeroVariant } from 'bibli/shared/assets/auth/rr'
import { AUTH_RR_LOADING_COPY } from './authRrLoadingCopy'
import { showAuthRrBootstrapLoading } from './showAuthRrBootstrapLoading'

const props = withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    policyHref?: string
    supportHref?: string
    heroVariant?: AuthRrHeroVariant
    /** @deprecated bootstrap-shell не прячется при mount loading-страницы */
    autoHideOverlay?: boolean
  }>(),
  {
    title: AUTH_RR_LOADING_COPY.title,
    subtitle: AUTH_RR_LOADING_COPY.subtitle,
    policyHref: authRrLegalLinks.personalDataPolicy,
    supportHref: authRrLegalLinks.support,
    heroVariant: 'login',
    autoHideOverlay: false,
  },
)

function syncBootstrapLoading(): void {
  showAuthRrBootstrapLoading({
    title: props.title,
    subtitle: props.subtitle,
  })
}

onMounted(syncBootstrapLoading)

watch(
  () => [props.title, props.subtitle] as const,
  syncBootstrapLoading,
)
</script>
