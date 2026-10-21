<template>
  <div
    class="app-shell-rr"
    :class="{ 'app-shell-rr--mobile-tabbar': showMobileTabBar }"
  >
    <AppNavigationRR
      ref="navigationRef"
      :logo-url="logoUrl"
      :nav-items="navItems"
      :loading="navLoading"
      :loaded="navLoaded"
      :error="navError"
      :on-retry="onNavRetry"
      :show-notifications="showNotifications"
      :show-admin-settings="showAdminSettings"
      :show-services="showServices"
      :services="services"
      :show-project="showProject"
      :project-name="projectName"
      :project-caption="projectCaption"
      :project-logo-url="projectLogoUrl"
      :project-clickable="projectClickable"
      :project-options="projectOptions"
      :current-project-id="currentProjectId"
      :mobile-tab-bar-mode="showMobileTabBar"
      :show-user-chip="showUserChip"
      :user-name="userName"
      :user-role="userRole"
      :avatar-url="avatarUrl"
      :user-menu-items="userMenuItems"
      @update:mobile-open="navMobileOpen = $event"
      @notifications="emit('notifications')"
      @service-select="emit('service-select', $event)"
      @project-change="emit('project-change', $event)"
    />

    <div class="app-shell-rr__content">
      <main
        class="app-shell-rr__main page-main--rr"
        :class="{
          'page-main--rr-child-back-absolute': childPage && childBackMode === 'absolute',
        }"
      >
        <AppPageHeaderRR
          v-if="showHeader"
          :title="title"
          :description="description"
          :child-page="childPage"
          :child-back-mode="childBackMode"
          :parent-title="parentTitle"
          :parent-to="parentTo"
          :user-name="userName"
          :user-role="userRole"
          :avatar-url="avatarUrl"
          :menu-items="userMenuItems"
          :show-user-chip="showUserChip"
          :menu-open="navMobileOpen"
          :hide-menu="showMobileTabBar"
          @menu="toggleNavigation"
          @back="onBack"
        >
          <template v-if="$slots['header-actions']" #actions>
            <slot name="header-actions" />
          </template>
        </AppPageHeaderRR>

        <div
          class="app-shell-rr__page page-content--rr"
          :class="{
            'page-content--rr-child': childPage,
            'page-content--mobile-tabbar': showMobileTabBar,
          }"
        >
          <slot />
        </div>
      </main>
    </div>

    <AppMobileTabBarRR
      v-if="showMobileTabBar"
      :items="mobileTabs"
      @navigate="onMobileNavigate"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppNavigationRR from './AppNavigationRR.vue'
import type {
  NavItemsConfigRR,
  NavProjectOptionRR,
  NavServiceItemRR,
} from './AppNavigationRR.vue'
import AppPageHeaderRR from './AppPageHeaderRR.vue'
import AppMobileTabBarRR from './AppMobileTabBarRR.vue'
import type { MobileTabBarItemRR } from './AppMobileTabBarRR.vue'
import type { AppUserChipMenuItem } from './AppUserChipRR.vue'
import { runRrChildBack } from './composables/useRrChildBack'
import 'bibli/shared/tokens/index.css'
import './app-page-layout-rr.css'
import './app-shell-rr.css'

const props = withDefaults(
  defineProps<{
    navItems?: NavItemsConfigRR
    navLoading?: boolean
    navLoaded?: boolean
    navError?: boolean
    onNavRetry?: () => void
    logoUrl?: string
    title?: string
    description?: string
    childPage?: boolean
    childBackMode?: 'absolute' | 'block'
    parentTitle?: string
    parentTo?: string
    userName?: string
    userRole?: string
    avatarUrl?: string
    userMenuItems?: AppUserChipMenuItem[]
    showUserChip?: boolean
    showHeader?: boolean
    showNotifications?: boolean
    showAdminSettings?: boolean
    showServices?: boolean
    services?: NavServiceItemRR[]
    showProject?: boolean
    projectName?: string
    projectCaption?: string
    projectLogoUrl?: string
    projectClickable?: boolean
    projectOptions?: NavProjectOptionRR[]
    currentProjectId?: string | number | null
    /** Нижний таббар (обычно ≤1024). Пустой массив / не передано — без таббара. */
    mobileTabs?: MobileTabBarItemRR[]
  }>(),
  {
    navItems: () => ({ main: [], more: [] }),
    navLoading: false,
    navLoaded: true,
    navError: false,
    onNavRetry: () => {},
    logoUrl: '',
    title: '',
    description: '',
    childPage: false,
    childBackMode: 'block',
    parentTitle: '',
    parentTo: '',
    userName: '',
    userRole: '',
    avatarUrl: '',
    userMenuItems: () => [],
    showUserChip: true,
    showHeader: true,
    showNotifications: false,
    showAdminSettings: false,
    showServices: false,
    services: () => [],
    showProject: false,
    projectName: '',
    projectCaption: 'проект',
    projectLogoUrl: '',
    projectClickable: false,
    projectOptions: () => [],
    currentProjectId: null,
    mobileTabs: () => [],
  },
)

const emit = defineEmits<{
  notifications: []
  back: []
  'mobile-navigate': [to: string]
  'service-select': [service: NavServiceItemRR]
  'project-change': [value: string | number]
}>()

const router = useRouter()
const navigationRef = ref<{
  toggleNavigation: () => void
  openNavigation: () => void
  closeNavigation: () => void
} | null>(null)
const navMobileOpen = ref(false)

const showMobileTabBar = computed(
  () => Array.isArray(props.mobileTabs) && props.mobileTabs.length > 0,
)

function toggleNavigation() {
  navigationRef.value?.toggleNavigation()
}

function onBack() {
  emit('back')
  if (runRrChildBack()) return
  if (props.parentTo) {
    void router.push(props.parentTo)
    return
  }
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back()
  }
}

function onMobileNavigate(to: string) {
  emit('mobile-navigate', to)
  if (to) void router.push(to)
}

function syncShellClass(on: boolean) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('app-rr-shell', on)
}

function setViewportVars() {
  if (typeof window === 'undefined') return
  const h = window.innerHeight
  const root = document.documentElement
  root.style.setProperty('--app-shell-height', `${h}px`)
  root.style.setProperty('--vh', `${h * 0.01}px`)
}

onMounted(() => {
  syncShellClass(true)
  setViewportVars()
  window.addEventListener('resize', setViewportVars, { passive: true })
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', setViewportVars)
  }
  syncShellClass(false)
})

defineExpose({
  toggleNavigation,
  openNavigation: () => navigationRef.value?.openNavigation(),
  closeNavigation: () => navigationRef.value?.closeNavigation(),
  navigationRef,
})
</script>
