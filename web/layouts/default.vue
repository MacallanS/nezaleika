<template>
  <div class="page-wrapper page-wrapper--nav-rr page-wrapper--mobile-tabbar">
    <div
      class="content-wrapper"
      :class="{
        'content-wrapper--scroll': !isFeedHome,
        'content-wrapper--feed-immersive': isFeedHome,
      }"
    >
      <main class="page-main page-main--rr">
        <div
          class="page-content page-content--rr"
          :class="{
            'page-content--mobile-tabbar': !isFeedHome,
            'page-content--feed-immersive': isFeedHome,
          }"
        >
          <slot />
        </div>
      </main>
    </div>
    <AppMobileTabBarRR :items="mobileTabs" @navigate="onTabNavigate" />
  </div>
</template>

<script setup lang="ts">
import { AppMobileTabBarRR } from 'bibli/widgets/Layout/rr'
import { useNezaleikaMobileTabs } from '~/composables/useNezaleikaShell'

const route = useRoute()
const mobileTabs = useNezaleikaMobileTabs()

const isFeedHome = computed(() => route.path === '/' || route.path === '')

function onTabNavigate(to: string) {
  if (!to) return
  void navigateTo(to)
}
</script>
