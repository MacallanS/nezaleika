<template>
  <header
    class="app-page-header-rr"
    :class="{
      'app-page-header-rr--child': childPage,
      'app-page-header-rr--root': !childPage,
      'app-page-header-rr--child-back-absolute': childPage && childBackMode === 'absolute',
      'app-page-header-rr--child-back-block': childPage && childBackMode === 'block',
    }"
  >
    <div v-if="isMobileLayout || childPage" class="app-page-header-rr__nav-row">
      <button
        v-if="childPage"
        type="button"
        class="app-page-header-rr__back"
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

      <button
        v-else-if="!hideMenu"
        type="button"
        class="app-page-header-rr__menu"
        data-nav-menu-toggle
        :aria-label="menuOpen ? 'Закрыть меню' : 'Открыть меню'"
        :aria-expanded="menuOpen"
        @click.stop="emit('menu')"
      >
        <img
          class="app-page-header-rr__menu-icon"
          :src="navRrIcons.menu"
          alt=""
          width="20"
          height="20"
        />
      </button>

      <h1
        v-if="childPage && title && childBackMode !== 'absolute'"
        class="app-page-header-rr__title"
      >
        {{ title }}
      </h1>
      <h1
        v-else-if="isMobileLayout && mobileToolbarTitle"
        class="app-page-header-rr__toolbar-title"
      >
        {{ mobileToolbarTitle }}
      </h1>

      <AppUserChipRR
        v-if="isMobileLayout && !childPage && showUserChip"
        class="app-page-header-rr__user app-page-header-rr__user--nav"
        compact
        :user-name="userName"
        :user-role="userRole"
        :avatar-url="avatarUrl"
        :menu-items="menuItems"
      />
    </div>

    <div v-if="showContentRow" class="app-page-header-rr__content-row">
      <div
        v-if="(title && showDesktopTitle && !isMobileLayout) || description"
        class="app-page-header-rr__intro"
      >
        <h1 v-if="title && showDesktopTitle && !isMobileLayout" class="app-page-header-rr__title">{{ title }}</h1>
        <p v-if="description" class="app-page-header-rr__subtitle">{{ description }}</p>
      </div>
    </div>

    <!--
      Единственная стабильная цель Teleport: id не пересоздаётся при смене childPage.
      Позиция (рядом с nav на child / с title на root) — через CSS grid на header.
    -->
    <div
      :id="APP_RR_HEADER_ACTIONS_ID"
      class="app-page-header-rr__actions"
      :class="{ 'app-page-header-rr__actions--child': childPage }"
    >
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppUserChipRR from './AppUserChipRR.vue'
import type { AppUserChipMenuItem } from './AppUserChipRR.vue'
import { APP_RR_HEADER_ACTIONS_ID } from './headerActions'
import { navRrIcons } from './assets/icons'
import './app-page-header-rr.css'

/** Props шапки RR-страницы. */
const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    childPage?: boolean
    childBackMode?: 'absolute' | 'block'
    parentTitle?: string
    parentTo?: string
    userName?: string
    userRole?: string
    avatarUrl?: string
    menuItems?: AppUserChipMenuItem[]
    showUserChip?: boolean
    menuOpen?: boolean
    /** Скрыть гамбургер (мобильный таббар вместо drawer). */
    hideMenu?: boolean
  }>(),
  {
    title: '',
    description: '',
    childPage: false,
    childBackMode: 'block',
    parentTitle: '',
    parentTo: '',
    userName: '',
    userRole: '',
    avatarUrl: '',
    menuItems: () => [],
    showUserChip: true,
    menuOpen: false,
    hideMenu: false,
  },
)

const emit = defineEmits<{
  menu: []
  back: []
}>()

const isMobileLayout = ref(false)

const DRAWER_MQ = '(max-width: 1024px)'

const mobileToolbarTitle = computed(() => {
  if (props.childPage) {
    return ''
  }
  return props.title || ''
})

const showDesktopTitle = computed(() => Boolean(props.title) && !props.childPage)

/** Строка заголовка: на child title+actions в nav-row; здесь — корневые страницы / description. */
const showContentRow = computed(() => {
  if (props.childPage) {
    return Boolean(props.description)
  }
  // Корневая страница: всегда держим ряд (Teleport + title на desktop).
  return true
})

function syncHeaderLayoutVisibility() {
  if (typeof window === 'undefined') return
  isMobileLayout.value = window.matchMedia(DRAWER_MQ).matches
}

function onBack() {
  emit('back')
}

onMounted(() => {
  syncHeaderLayoutVisibility()
  window.addEventListener('resize', syncHeaderLayoutVisibility, { passive: true })
})

watch(
  () => props.childPage,
  () => {
    syncHeaderLayoutVisibility()
  },
)

onBeforeUnmount(() => {
  if (typeof window === 'undefined') return
  window.removeEventListener('resize', syncHeaderLayoutVisibility)
})
</script>
