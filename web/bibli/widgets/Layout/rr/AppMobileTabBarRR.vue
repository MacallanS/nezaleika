<template>
  <nav
    class="app-mobile-tab-bar-rr"
    aria-label="Основная навигация"
  >
    <div
      v-for="item in items"
      :key="`${item.slot}-${item.key}`"
      class="app-mobile-tab-bar-rr__slot"
      :data-state="item.state"
    >
      <button
        v-if="item.state === 'link'"
        type="button"
        class="app-mobile-tab-bar-rr__btn"
        :class="{ 'is-active': isActive(item) }"
        :aria-current="isActive(item) ? 'page' : undefined"
        :aria-label="item.badge ? `${item.label}, есть полив` : item.label"
        @click="onSelect(item)"
      >
        <span class="app-mobile-tab-bar-rr__icon-wrap">
          <img
            class="app-mobile-tab-bar-rr__icon"
            :src="iconUrl(item)"
            alt=""
            width="24"
            height="24"
          />
          <span v-if="item.badge" class="app-mobile-tab-bar-rr__dot" aria-hidden="true" />
        </span>
        <span class="app-mobile-tab-bar-rr__label">{{ item.label }}</span>
      </button>

      <div
        v-else-if="item.state === 'locked'"
        class="app-mobile-tab-bar-rr__btn is-locked"
        aria-disabled="true"
        :aria-label="`${item.label} (недоступно)`"
      >
        <span class="app-mobile-tab-bar-rr__icon-wrap">
          <img
            class="app-mobile-tab-bar-rr__icon"
            :src="lockedIconUrl(item)"
            alt=""
            width="24"
            height="24"
          />
        </span>
        <span class="app-mobile-tab-bar-rr__label">{{ item.label }}</span>
      </div>

      <div
        v-else
        class="app-mobile-tab-bar-rr__btn is-empty"
        aria-hidden="true"
      />
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import {
  NAV_RR_ICON_BY_KEY,
  NAV_RR_LOCKED_ICON_BY_NAME,
  navRrIcons,
  type NavRrIconName,
} from './assets/icons'
import './app-mobile-tab-bar-rr.css'

export type MobileTabBarItemRR = {
  slot: number
  key: string
  label: string
  to?: string
  iconKey: string
  state: 'link' | 'empty' | 'locked'
  matchExact?: boolean
  badge?: boolean
}

const props = defineProps<{
  items: MobileTabBarItemRR[]
  /** Текущий path — если не передан, берётся из vue-router */
  currentPath?: string
}>()

const emit = defineEmits<{
  navigate: [to: string]
}>()

const route = useRoute()

function resolveIconName(iconKey: string): NavRrIconName {
  if (iconKey === 'user' || iconKey === 'profile') return 'user'
  return (NAV_RR_ICON_BY_KEY[iconKey] || 'home') as NavRrIconName
}

function iconUrl(item: MobileTabBarItemRR): string {
  const name = resolveIconName(item.iconKey)
  return navRrIcons[name] || navRrIcons.home
}

function lockedIconUrl(item: MobileTabBarItemRR): string {
  const name = resolveIconName(item.iconKey)
  return NAV_RR_LOCKED_ICON_BY_NAME[name] || iconUrl(item)
}

function normalizePath(path: string): string {
  return path.replace(/\/+$/, '') || '/'
}

function isActive(item: MobileTabBarItemRR): boolean {
  if (!item.to) return false
  const path = normalizePath(props.currentPath || route.path || '/')
  const target = normalizePath(item.to)
  if (target === '/') return path === '/'
  if (target === '/profile') return path === '/profile' || path.startsWith('/profile/')
  if (item.matchExact) return path === target
  return path === target || path.startsWith(`${target}/`)
}

function onSelect(item: MobileTabBarItemRR) {
  if (item.state !== 'link' || !item.to) return
  emit('navigate', item.to)
}
</script>
