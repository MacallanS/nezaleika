<template>
  <div class="app-navigation" :class="{ 'mobile-open': isMobileOpen }" ref="navRef">
    <div class="mobile-header">
      <RouterLink to="/profile" class="app-header" @click="closeNavigation">
        <img :src="logoUrl" alt="Логотип" class="logo" />
      </RouterLink>
      <button class="close-nav" @click="closeNavigation">
        <i class="pi pi-times"></i>
      </button>
    </div>
    <RouterLink to="/" class="app-header desktop-only">
      <img :src="logoUrl" alt="Логотип" class="logo" />
    </RouterLink>

    <div v-if="loading || !loaded" class="loading-nav">
      <div class="loading-item">
        <i class="pi pi-spin pi-spinner"></i>
        <span>Загрузка навигации...</span>
      </div>
    </div>

    <div v-else-if="loaded">
      <div class="navigation-items">
        <div v-if="!navItems.main?.length && !navItems.more?.length" class="no-nav-items">
          <div class="no-nav-message">
            <i class="pi pi-exclamation-circle"></i>
            <span>Нет доступных страниц</span>
          </div>
        </div>
        <RouterLink v-for="item in (navItems.main || [])" :key="item.key || item.to" :to="item.to">
          <i :class="item.icon"></i> {{ item.label }}
        </RouterLink>
        <button v-if="navItems.more?.length" class="more-btn" @click="showMore = !showMore"
          :class="{ active: showMore }">
          <i class="pi pi-angle-down more-icon" :class="{ rotated: showMore }"></i> Ещё ({{
            navItems.more.length }})
        </button>
        <transition name="fade-slide">
          <div v-if="showMore" class="more-nav">
            <RouterLink v-for="item in (navItems.more || [])" :key="item.key || item.to" :to="item.to">
              <i :class="item.icon"></i> {{ item.label }}
            </RouterLink>
          </div>
        </transition>
      </div>
    </div>
    <div v-else-if="error" class="error-nav">
      <div class="error-item">
        <i class="pi pi-exclamation-triangle"></i>
        <span>Ошибка загрузки навигации</span>
        <button @click="onRetry" class="retry-btn">
          <i class="pi pi-refresh"></i> Повторить
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

export interface NavItem {
  to: string
  label: string
  icon: string
  key?: string
}

export interface NavItemsConfig {
  main: NavItem[]
  more: NavItem[]
}

const props = withDefaults(
  defineProps<{
    logoUrl: string
    navItems?: NavItemsConfig
    loading?: boolean
    loaded?: boolean
    error?: boolean
    onRetry?: () => void
  }>(),
  {
    navItems: () => ({ main: [], more: [] }),
    loading: false,
    loaded: false,
    error: false,
    onRetry: () => {},
  }
)

const isMobileOpen = ref(false)
const showMore = ref(false)
const navRef = ref<HTMLElement | null>(null)
const route = useRoute()

const closeNavigation = () => {
  isMobileOpen.value = false
}

const openNavigation = () => {
  isMobileOpen.value = true
}

const toggleNavigation = () => {
  isMobileOpen.value = !isMobileOpen.value
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target
  if (!(target instanceof Node)) return
  if (target instanceof Element && target.closest('[data-nav-menu-toggle], .menu-toggle')) return
  if (isMobileOpen.value && navRef.value && !navRef.value.contains(target)) {
    closeNavigation()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

watch(() => route.fullPath, () => {
  isMobileOpen.value = false
})

defineExpose({
  openNavigation,
  closeNavigation,
  toggleNavigation,
  isMobileOpen,
})
</script>

<style scoped>
.app-navigation {
  width: 250px;
  height: 100vh;
  background-color: var(--russ-bg);
  box-shadow: 0px 2px 10px var(--russ-shadow-color);
  padding: 10px;
  box-sizing: border-box;
  position: fixed;
  left: 0;
  top: 0;
  /* Выше menu-backdrop (1099), чтобы подложка popup-меню не блокировала ссылки сайдбара */
  z-index: 1000;
  transition: transform 0.3s ease;
  overflow-y: auto;
}

.app-navigation::-webkit-scrollbar {
  width: 4px;
}

.app-navigation::-webkit-scrollbar-track {
  background: var(--russ-bg-tertiary);
  border-radius: 2px;
}

.app-navigation::-webkit-scrollbar-thumb {
  background: var(--russ-primary);
  border-radius: 2px;
}

.app-header {
  display: flex;
  align-items: center;
  top: 0;
  background: var(--russ-bg);
  z-index: 1;
  height: 60px;
  margin: 20px 0;
  text-decoration: none;
  color: inherit;
}

.logo {
  width: 100%;
  max-width: 200px;
  height: auto;
}

.mobile-header {
  display: none;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding: 10px;
  position: sticky;
  top: 0;
  background: var(--russ-bg);
  z-index: 1;
}

.close-nav {
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
  flex-shrink: 0;
}

.close-nav:hover {
  background: var(--russ-bg-hover);
}

.close-nav i {
  font-size: 18px !important;
  width: 18px;
  height: 18px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.navigation-items a {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 14px;
  text-decoration: none;
  color: var(--russ-text-primary);
  border-radius: 5px;
}

.navigation-items a.router-link-active {
  background-color: var(--russ-bg-blue-lighter);
}

.navigation-items a i {
  color: var(--russ-primary);
}

.desktop-only {
  display: block;
}

@media (max-width: 1024px) {
  .app-navigation {
    transform: translateX(-100%);
    width: 100%;
    max-width: 100%;
  }

  .app-navigation.mobile-open {
    transform: translateX(0);
  }

  .mobile-header {
    display: flex;
    height: 60px;
  }

  .close-nav {
    display: flex;
  }

  .desktop-only {
    display: none;
  }
}

.more-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  background: none;
  border: none;
  color: var(--russ-primary);
  font-size: 1rem;
  cursor: pointer;
  margin: 10px 0;
  padding: 8px 12px;
  border-radius: 5px;
  transition: background 0.2s, color 0.2s;
}

.more-btn:hover {
  background: var(--russ-bg-blue-lighter);
  color: var(--russ-primary-dark);
}

.more-btn.active {
  background: var(--russ-primary);
  color: var(--russ-text-inverse);
}

.more-btn .more-icon {
  transition: transform 0.3s;
}

.more-btn .more-icon.rotated {
  transform: rotate(180deg);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-slide-enter-to,
.fade-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.more-nav {
  margin-top: 5px;
  padding-top: 5px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.loading-nav {
  padding: 30px 20px;
  text-align: center;
  background: linear-gradient(135deg, var(--russ-bg-blue-light) 0%, var(--russ-bg-blue-lighter) 100%);
  border-radius: 10px;
  margin: 10px;
}

.loading-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--russ-primary);
  font-size: 14px;
  font-weight: 500;
}

.loading-item i {
  font-size: 18px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error-nav {
  padding: 25px 20px;
  text-align: center;
  background: linear-gradient(135deg, var(--russ-error-light) 0%, var(--russ-error-light) 100%);
  border-radius: 10px;
  margin: 10px;
  border: 1px solid var(--russ-error-light);
}

.error-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  color: var(--russ-error);
  font-size: 14px;
}

.error-item i {
  font-size: 28px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--russ-error);
  color: var(--russ-text-inverse);
  border: none;
  padding: 8px 16px;
  border-radius: 5px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: var(--russ-error-dark);
}

.no-nav-items {
  margin-top: 20px;
  padding: 10px;
  background-color: var(--russ-bg-quaternary);
  border: 1px solid var(--russ-border);
  border-radius: 5px;
  text-align: center;
}

.no-nav-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  color: var(--russ-text-tertiary);
  font-size: 14px;
}

.no-nav-message i {
  color: var(--russ-text-quaternary);
  font-size: 24px;
}
</style>
