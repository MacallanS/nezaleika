<template>
  <div class="page-wrapper page-wrapper--nav-rr page-wrapper--mobile-tabbar">
    <div class="content-wrapper content-wrapper--scroll">
      <main class="page-main page-main--rr">
        <div class="page-content page-content--rr page-content--mobile-tabbar page-content--planner">
          <slot />
        </div>
      </main>
    </div>
    <AppMobileTabBarRR :items="mobileTabs" :current-path="tabPath" @navigate="onTabNavigate" />
    <UndoToast />
  </div>
</template>

<script setup lang="ts">
import { AppMobileTabBarRR } from 'bibli/widgets/Layout/rr'
import UndoToast from '~/components/planner/UndoToast.vue'
import { useNezaleikaMobileTabs } from '~/composables/useNezaleikaShell'

const route = useRoute()
const mobileTabs = useNezaleikaMobileTabs()

const tabPath = computed(() => {
  const path = route.path.replace(/\/+$/, '') || '/'
  if (path.startsWith('/plants/') && path !== '/plants/add') return '/plants'
  return path
})

function onTabNavigate(to: string) {
  if (!to) return
  void navigateTo(to)
}
</script>
