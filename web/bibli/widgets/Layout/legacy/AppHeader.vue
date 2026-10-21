<template>
  <div class="header-wrapper">
    <div class="header-left">
      <button class="menu-toggle" @click="toggleNavigation">
        <i :class="navigation?.isMobileOpen ? 'pi pi-times' : 'pi pi-bars'"></i>
      </button>
      <h1 class="page_name">{{ pageTitle }}</h1>
    </div>

    <div class="header-wrapper-menu">
      <i class="pi pi-phone hidden-icon"></i>
      <i class="pi pi-send hidden-icon"></i>

      <a :href="supportHref" target="_blank" rel="noopener" class="support-header-btn">
        <span class="support-header-text">{{ supportLabel }}</span>
      </a>

      <div class="personal" @click="toggle" aria-haspopup="true" aria-controls="overlay_menu">
        <i class="pi pi-user"></i>
        <span class="personal-text">{{ userName }}</span>
      </div>

      <Menu ref="menuRef" id="overlay_menu" :model="menuItems" :popup="true" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Menu } from '../../../shared/ui'

export interface MenuItemOption {
  label: string
  icon: string
  command?: () => void
  to?: string
}

export interface NavigationState {
  isMobileOpen?: boolean
  openNavigation?: () => void
  closeNavigation?: () => void
}

const props = withDefaults(
  defineProps<{
    pageTitle?: string
    userName?: string
    menuItems?: MenuItemOption[]
    supportHref?: string
    supportLabel?: string
    navigation?: NavigationState
  }>(),
  {
    pageTitle: '',
    userName: '',
    menuItems: () => [],
    supportHref: 'https://t.me/uliasupport',
    supportLabel: 'Помощь',
    navigation: undefined,
  }
)

const menuRef = ref<InstanceType<typeof Menu> | null>(null)

function toggleNavigation() {
  if (!props.navigation) return
  if (props.navigation.isMobileOpen) {
    props.navigation.closeNavigation?.()
  } else {
    props.navigation.openNavigation?.()
  }
}

function toggle(event: Event) {
  menuRef.value?.toggle?.(event)
}
</script>

<style scoped>
.header-wrapper {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 30px;
  box-shadow: 0px 2px 10px var(--russ-shadow-color);
  position: relative;
  top: 0;
  right: 0;
  box-sizing: border-box;
  transition: width 0.3s ease;
  will-change: transform;
  backface-visibility: hidden;
}

.header-left {
  display: flex;
  align-items: center;
  gap: clamp(6px, 2vw, 16px);
  min-width: 0;
}

.menu-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  padding: 0;
  background: none;
  border: none;
  border-radius: 8px;
  color: var(--russ-primary);
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}

.menu-toggle:hover {
  background: var(--russ-bg-hover);
}

.menu-toggle i {
  font-size: 18px !important;
  width: 18px;
  height: 18px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.page_name {
  font-size: clamp(15px, calc(15px + (20 - 15) * ((100vw - 320px) / (960 - 320))), 20px);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 40vw;
}

.header-wrapper-menu {
  display: flex;
  gap: clamp(6px, 2vw, 20px);
  align-items: center;
  min-width: 0;
}

.header-wrapper-menu div:hover {
  cursor: pointer;
}

.personal {
  display: flex;
  align-items: center;
  gap: clamp(6px, 2vw, 16px);
  cursor: pointer;
  font-size: clamp(15px, calc(15px + (18 - 15) * ((100vw - 320px) / (960 - 320))), 18px);
  min-width: 0;
}

#overlay_menu {
  margin-top: 6px !important;
}

.hidden-icon {
  display: none;
}

.support-header-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--russ-bg-blue-lighter);
  color: var(--russ-accent);
  border-radius: 6px;
  padding: 10px 30px;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  transition: background 0.15s, box-shadow 0.15s, color 0.15s;
  box-shadow: 0 1px 4px var(--russ-shadow-secondary);
}

.support-header-btn:hover {
  background: var(--russ-info-light);
  color: var(--russ-secondary);
  box-shadow: 0 2px 8px var(--russ-shadow-secondary);
}

.support-header-btn .pi {
  font-size: 1.1em;
}

@media (max-width: 1024px) {
  .menu-toggle {
    display: flex;
  }

  .header-wrapper {
    padding: 8px clamp(4px, 3vw, 15px);
    width: 100%;
  }

  .personal-text {
    display: none;
  }
}
</style>
