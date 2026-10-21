<template>
  <div class="header-wrapper">
    <div class="header-main-row">
      <div class="header-left">
        <div class="menu-toggle-wrapper">
          <div v-if="showProjectNudge" class="project-nudge" title="Выберите проект в селекторе справа">
            <i class="pi pi-info-circle"></i>
            <span>Выберите проект</span>
          </div>
          <button
            type="button"
            class="header-icon-btn menu-toggle"
            data-nav-menu-toggle
            :aria-label="navigation?.isMobileOpen ? 'Закрыть меню' : 'Открыть меню'"
            :aria-expanded="Boolean(navigation?.isMobileOpen)"
            @click.stop="toggleNavigation"
          >
            <svg
              v-if="!navigation?.isMobileOpen"
              class="header-icon-btn__svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M3 6H21M3 12H21M3 18H21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
            <svg
              v-else
              class="header-icon-btn__svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M5 5l14 14M19 5 5 19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </button>
        </div>
        <h1 class="page_name">{{ pageTitle }}</h1>
      </div>

      <div v-if="showProjectSwitcher" class="header-project-switcher desktop-switcher">
        <CurrentProjectSwitcher
          :key="projectSwitcherResetKey ?? 'project-switcher-desktop'"
          :project-options="projectOptions"
          :current-project-id="currentProjectId"
          :project-switching="projectSwitching"
          @change="handleProjectChange"
        />
      </div>

      <div class="header-wrapper-menu">
        <button
          v-if="showNotifications"
          type="button"
          class="header-icon-btn"
          aria-label="Уведомления"
          @click="emit('notifications')"
        >
          <img class="header-icon-btn__img" :src="notificationsIconUrl" alt="" width="20" height="20" />
        </button>
        <a
          v-if="showSupport"
          :href="supportHref"
          target="_blank"
          rel="noopener"
          class="support-header-btn"
        >
          <span class="support-header-text">{{ supportLabel }}</span>
        </a>
        <div
          class="personal"
          role="button"
          tabindex="0"
          aria-haspopup="true"
          aria-controls="overlay_menu"
          :aria-label="userName || 'Профиль'"
          @click="toggle"
          @keydown.enter.prevent="toggle"
          @keydown.space.prevent="toggle"
        >
          <i class="pi pi-user" aria-hidden="true"></i>
          <span class="personal-text">{{ userName }}</span>
        </div>
        <Menu ref="menuRef" id="overlay_menu" :model="menuItems" :popup="true" />
      </div>
    </div>

    <div v-if="showProjectSwitcher" class="header-project-switcher mobile-switcher">
      <CurrentProjectSwitcher
        :key="projectSwitcherResetKey ?? 'project-switcher-mobile'"
        :project-options="projectOptions"
        :current-project-id="currentProjectId"
        :project-switching="projectSwitching"
        @change="handleProjectChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Menu } from '../../../shared/ui'
import CurrentProjectSwitcher from '../../Project/CurrentProjectSwitcher.vue'
import { navRrIcons } from '../rr/assets/icons'

export interface ProjectMenuItemOption { label: string; icon: string; command?: () => void; to?: string }
export interface ProjectNavigationState {
  isMobileOpen?: boolean
  openNavigation?: () => void
  closeNavigation?: () => void
  toggleNavigation?: () => void
}
type ProjectOption = { id: string | number; name: string }

const props = withDefaults(defineProps<{
  pageTitle?: string
  userName?: string
  menuItems?: ProjectMenuItemOption[]
  supportHref?: string
  supportLabel?: string
  navigation?: ProjectNavigationState
  projectOptions?: ProjectOption[]
  currentProjectId?: string | number | null
  projectSwitching?: boolean
  showProjectSwitcher?: boolean
  projectSelectionRequired?: boolean
  noProjectsAvailable?: boolean
  showNotifications?: boolean
  showSupport?: boolean
  projectSwitcherResetKey?: number | string
}>(), {
  pageTitle: '', userName: '', menuItems: () => [], supportHref: 'https://t.me/uliasupport', supportLabel: 'Помощь',
  navigation: undefined, projectOptions: () => [], currentProjectId: null, projectSwitching: false, showProjectSwitcher: false,
  projectSelectionRequired: false, noProjectsAvailable: false, showNotifications: false, showSupport: true,
})

const emit = defineEmits<{
  (e: 'projectChange', value: string | number | null): void
  (e: 'notifications'): void
}>()

const menuRef = ref<any>(null)
const notificationsIconUrl = navRrIcons.bell
const showProjectNudge = computed(() => props.showProjectSwitcher && !props.noProjectsAvailable && !props.projectSwitching && props.projectSelectionRequired && props.projectOptions.length > 0 && (props.currentProjectId == null || props.currentProjectId === ''))
function toggleNavigation() {
  if (!props.navigation) return
  if (typeof props.navigation.toggleNavigation === 'function') {
    props.navigation.toggleNavigation()
    return
  }
  if (props.navigation.isMobileOpen) props.navigation.closeNavigation?.()
  else props.navigation.openNavigation?.()
}
function toggle(event: Event) { menuRef.value?.toggle?.(event) }
function handleProjectChange(value: string | number | null) {
  emit('projectChange', value)
}
</script>

<style scoped>
.header-wrapper {
  min-height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  padding: 10px 30px 10px 50px;
  box-shadow: none;
  position: relative;
  top: 0;
  right: 0;
  box-sizing: border-box;
  background: var(--Backgrounds-Quaternary, var(--rr-backgrounds-quaternary, #f2f3f7));
  border-bottom: 1px solid var(--Border-Neutral-Subtle, #78788029);
}

.header-main-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1 1 auto;
}

.menu-toggle-wrapper {
  position: relative;
  display: none;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.project-nudge {
  position: absolute;
  left: 0;
  top: -12px;
  transform: translateY(-100%);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  background: var(--Backgrounds-Primary, #fff);
  border: 1px solid var(--Border-Neutral-Subtle, #78788029);
  color: var(--rr-labels-neutral-primary, #101012);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(16, 16, 18, 0.08);
}

.project-nudge i {
  font-size: 12px;
  opacity: 0.9;
}

.header-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  padding: 0;
  margin: 0;
  border: none;
  outline: none;
  box-shadow: none;
  border-radius: 8px;
  background: transparent;
  color: var(--rr-labels-neutral-primary, #101012);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease;
  font: inherit;
}

.header-icon-btn:hover {
  background: var(--Backgrounds-Tetriary, var(--rr-backgrounds-tetriary, #e7e8ee));
}

.header-icon-btn:focus,
.header-icon-btn:focus-visible {
  border: none;
  outline: none;
  box-shadow: none;
}

.header-icon-btn__svg,
.header-icon-btn__img {
  display: block;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  object-fit: contain;
}

.menu-toggle {
  display: none;
}

.page_name {
  margin: 0;
  min-width: 0;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
  letter-spacing: 0;
  color: var(--rr-labels-neutral-primary, #101012);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-project-switcher {
  min-width: 0;
}

.desktop-switcher {
  flex: 0 1 320px;
  width: min(320px, 28vw);
  max-width: 100%;
}

.mobile-switcher {
  display: none;
  width: 100%;
}

.header-wrapper-menu {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
  flex-shrink: 0;
}

.personal {
  display: flex;
  align-items: center;
  gap: clamp(6px, 2vw, 16px);
  cursor: pointer;
  min-width: 0;
  color: var(--rr-labels-neutral-primary, #101012);
  font-size: clamp(15px, calc(15px + (18 - 15) * ((100vw - 320px) / (960 - 320))), 18px);
}

.personal i {
  font-size: 18px !important;
  width: 18px;
  height: 18px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: inherit;
}

.personal-text {
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-size: 15px;
  font-weight: 500;
  line-height: 20px;
  color: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 28vw;
}

#overlay_menu {
  margin-top: 6px !important;
}

.support-header-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--Backgrounds-Tetriary, #e7e8ee);
  color: var(--rr-labels-brand-primary, #1c4ae5);
  border-radius: 8px;
  padding: 10px 16px;
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
  transition: background 0.15s ease;
  box-shadow: none;
}

.support-header-btn:hover {
  background: var(--Backgrounds-Primary, #fff);
  color: var(--rr-labels-brand-primary, #1c4ae5);
  box-shadow: none;
}

@media (max-width: 1024px) {
  .menu-toggle-wrapper {
    display: inline-flex;
  }

  .menu-toggle {
    display: inline-flex;
  }

  .header-wrapper {
    padding: 8px 16px;
    width: 100%;
  }

  .header-left {
    gap: 10px;
  }

  .page_name {
    font-size: 18px;
    line-height: 24px;
  }

  .desktop-switcher {
    display: none;
  }

  .mobile-switcher {
    display: block;
  }

  .personal-text {
    display: none;
  }

  .support-header-btn {
    padding: 10px 12px;
  }
}
</style>
