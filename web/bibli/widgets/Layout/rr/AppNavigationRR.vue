<template>
  <Teleport to="body">
    <button
      v-if="isMobileOpen && !mobileTabBarMode"
      type="button"
      class="app-nav-rr__backdrop is-visible"
      aria-label="Закрыть меню"
      @click="closeNavigation"
    />
  </Teleport>

  <aside
    ref="navRef"
    class="app-nav-rr"
    :class="{
      'is-collapsed': isSidebarCollapsed,
      'is-mobile-open': isMobileOpen,
      'app-nav-rr--mobile-tabbar': mobileTabBarMode,
    }"
    aria-label="Навигация"
    @touchstart.passive="onNavTouchStart"
    @touchmove.passive="onNavTouchMove"
    @touchend.passive="onNavTouchEnd"
    @touchcancel.passive="onNavTouchCancel"
    @click.capture="onNavClickCapture"
  >
    <header class="app-nav-rr__header">
      <RouterLink :to="logoTo" class="app-nav-rr__logo-link" @click="closeNavigation">
        <img
          v-if="!isSidebarCollapsed"
          class="app-nav-rr__logo"
          :src="resolvedLogoUrl"
          height="32"
          alt="Логотип"
        />
        <img
          v-else
          class="app-nav-rr__logo-mark"
          :src="authRrBrand.logoMark"
          width="65"
          height="32"
          alt="РУССАЙФИН"
        />
      </RouterLink>

      <button
        v-if="showNotifications && !isSidebarCollapsed"
        type="button"
        class="app-nav-rr__bell"
        aria-label="Уведомления"
        @click="emit('notifications')"
      >
        <img class="app-nav-rr__icon" :src="navRrIcons.bell" alt="" width="20" height="20" />
      </button>

      <button
        type="button"
        class="app-nav-rr__close"
        aria-label="Закрыть меню"
        @click="closeNavigation"
      >
        <img class="app-nav-rr__icon" :src="navRrIcons.close" alt="" width="20" height="20" />
      </button>
    </header>

    <div
      v-if="showUserChip && !isDrawerViewport"
      class="app-nav-rr__user"
    >
      <AppUserChipRR
        :compact="isSidebarCollapsed"
        :user-name="userName"
        :user-role="userRole"
        :avatar-url="avatarUrl"
        :menu-items="userMenuItems"
      />
    </div>

    <div class="app-nav-rr__scroll">
      <div
        v-if="loading || !loaded"
        class="app-nav-rr__skeleton"
        aria-busy="true"
        aria-label="Загрузка меню"
        role="status"
      >
        <ul class="app-nav-rr__list app-nav-rr__list--skeleton">
          <li v-for="row in 8" :key="`nav-skel-${row}`">
            <div class="app-nav-rr__skel-row">
              <span class="app-nav-rr__skel-icon"></span>
              <span class="app-nav-rr__skel-label"></span>
            </div>
          </li>
        </ul>
      </div>

      <div v-else-if="error" class="app-nav-rr__status is-error">
        <span>Не удалось загрузить меню</span>
        <button type="button" class="app-nav-rr__retry" @click="onRetry">
          Повторить
        </button>
      </div>

      <template v-else>
        <nav v-if="sidebarItems.length" aria-label="Основное меню">
          <ul class="app-nav-rr__list">
            <li v-for="item in sidebarItems" :key="itemKey(item)">
              <template v-if="item.children?.length">
                <button
                  type="button"
                  class="app-nav-rr__row-btn"
                  :class="{
                    'is-active': isGroupActive(item),
                    'is-open': isGroupOpen(item),
                  }"
                  :aria-expanded="isGroupOpen(item)"
                  :title="isSidebarCollapsed ? item.label : undefined"
                  @click="toggleGroup(item)"
                >
                  <img
                    class="app-nav-rr__icon"
                    :src="iconUrlFor(item)"
                    alt=""
                    width="20"
                    height="20"
                  />
                  <span class="app-nav-rr__label">{{ item.label }}</span>
                  <span
                    v-if="item.badge"
                    class="app-nav-rr__badge"
                    aria-label="Требует внимания"
                  />
                  <img
                    class="app-nav-rr__chevron"
                    :class="{ 'is-open': isGroupOpen(item) }"
                    :src="navRrIcons.chevron"
                    alt=""
                    width="16"
                    height="16"
                  />
                </button>
                <ul v-if="isGroupOpen(item) && !isSidebarCollapsed" class="app-nav-rr__sub">
                  <li
                    v-for="(child, index) in item.children"
                    :key="itemKey(child)"
                    class="app-nav-rr__sub-item"
                    :class="{ 'is-last': index === item.children.length - 1 }"
                  >
                    <img
                      class="app-nav-rr__tree"
                      :src="index === item.children.length - 1 ? navRrIcons.treeEnd : navRrIcons.treeMid"
                      alt=""
                      width="17"
                      :height="index === item.children.length - 1 ? 23 : 42"
                      aria-hidden="true"
                    />
                    <RouterLink
                      v-if="child.to"
                      class="app-nav-rr__link"
                      :to="child.to"
                      active-class=""
                      exact-active-class=""
                      :class="{ 'is-active': isChildActive(child, item.children) }"
                      @click="closeNavigation"
                    >
                      <span class="app-nav-rr__label">{{ child.label }}</span>
                      <span
                        v-if="child.badge"
                        class="app-nav-rr__badge"
                        aria-label="Требует внимания"
                      />
                    </RouterLink>
                  </li>
                </ul>
              </template>

              <span
                v-else-if="item.disabled || !item.to"
                class="app-nav-rr__link is-disabled"
                aria-disabled="true"
                :title="isCollapsed ? item.label : undefined"
              >
                <img
                  class="app-nav-rr__icon"
                  :src="iconUrlFor(item)"
                  alt=""
                  width="20"
                  height="20"
                />
                <span class="app-nav-rr__label">{{ item.label }}</span>
                <span
                  v-if="item.badge"
                  class="app-nav-rr__badge"
                  aria-label="Требует внимания"
                />
              </span>

              <RouterLink
                v-else-if="item.to"
                class="app-nav-rr__link"
                :to="item.to"
                active-class=""
                exact-active-class=""
                :class="{ 'is-active': isTopLevelActive(item) }"
                :title="isCollapsed ? item.label : undefined"
                @click="closeNavigation"
              >
                <img
                  class="app-nav-rr__icon"
                  :src="iconUrlFor(item)"
                  alt=""
                  width="20"
                  height="20"
                />
                <span class="app-nav-rr__label">{{ item.label }}</span>
                <span
                  v-if="item.badge"
                  class="app-nav-rr__badge"
                  aria-label="Требует внимания"
                />
              </RouterLink>
            </li>
          </ul>
        </nav>

        <div v-else class="app-nav-rr__status">
          Нет доступных страниц
        </div>

        <div v-if="showServices || showProject" class="app-nav-rr__meta">
          <div v-if="showServices" class="app-nav-rr__services">
            <RouterLink
              v-if="servicesTo"
              class="app-nav-rr__link"
              :to="servicesTo"
              :class="{ 'is-active': isActive(servicesTo) }"
              :title="isCollapsed ? servicesLabel : undefined"
              @click="closeNavigation"
            >
              <img class="app-nav-rr__icon" :src="navRrIcons.services" alt="" width="20" height="20" />
              <span class="app-nav-rr__label">{{ servicesLabel }}</span>
            </RouterLink>
            <button
              v-else
              ref="servicesBtnRef"
              type="button"
              class="app-nav-rr__row-btn"
              :class="{ 'is-active': servicesMenuOpen }"
              :title="isCollapsed ? servicesLabel : undefined"
              :aria-expanded="servicesMenuOpen"
              aria-haspopup="menu"
              @click="onServicesClick"
            >
              <img class="app-nav-rr__icon" :src="navRrIcons.services" alt="" width="20" height="20" />
              <span class="app-nav-rr__label">{{ servicesLabel }}</span>
            </button>
          </div>

          <div v-if="showProject" class="app-nav-rr__project-wrap">
            <button
              ref="projectBtnRef"
              type="button"
              class="app-nav-rr__project"
              :disabled="!projectClickable || projectOptions.length === 0"
              :title="isCollapsed ? (projectName || 'Проект') : undefined"
              :aria-expanded="projectMenuOpen"
              aria-haspopup="listbox"
              @click="onProjectClick"
            >
              <img
                v-if="resolvedProjectLogoUrl && !brokenTriggerLogo"
                class="app-nav-rr__project-logo"
                :class="{ 'app-nav-rr__project-logo--folder': isAllProjectsSelected }"
                :src="resolvedProjectLogoUrl"
                alt=""
                width="32"
                height="32"
                @error="brokenTriggerLogo = true"
              />
              <span
                v-else
                class="app-nav-rr__project-fallback"
                :class="{
                  'app-nav-rr__project-fallback--wb': projectInitial === 'wb',
                  'app-nav-rr__project-fallback--mts': projectInitial === 'МТС',
                  'app-nav-rr__project-fallback--bordered':
                    Boolean(projectFallbackStyle?.color) &&
                    projectFallbackStyle?.background === '#FFFFFF',
                }"
                :style="projectFallbackStyle"
                aria-hidden="true"
              >
                {{ projectInitial }}
              </span>
              <span class="app-nav-rr__project-text">
                <span class="app-nav-rr__project-name">{{ projectName || 'Выберите проект' }}</span>
                <span v-if="!isAllProjectsSelected" class="app-nav-rr__project-caption">{{
                  projectCaption
                }}</span>
              </span>
              <img
                v-if="projectClickable && projectOptions.length > 0"
                class="app-nav-rr__project-chevron"
                :class="{ 'is-open': projectMenuOpen }"
                :src="navRrIcons.chevron"
                alt=""
                width="16"
                height="16"
              />
            </button>
          </div>
        </div>
      </template>
    </div>

    <Teleport to="body">
      <div
        v-if="servicesMenuOpen && services.length"
        ref="servicesMenuRef"
        class="app-nav-rr__services-menu"
        :style="servicesMenuStyle"
        role="menu"
      >
        <button
          v-for="svc in services"
          :key="svc.id"
          type="button"
          class="app-nav-rr__service-tile"
          :class="{
            'is-current': svc.current,
            'is-disabled': svc.disabled && !svc.current,
          }"
          :disabled="svc.disabled && !svc.current"
          role="menuitem"
          @click="selectService(svc)"
        >
          <span class="app-nav-rr__service-brand" aria-hidden="true">РУССАЙ</span>
          <img
            class="app-nav-rr__service-icon"
            :src="crmIconUrl(svc.id, svc.icon)"
            alt=""
            width="16"
            height="16"
          />
          <span class="app-nav-rr__service-label">{{ svc.label }}</span>
        </button>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="projectMenuOpen && projectOptions.length"
        ref="projectMenuRef"
        class="app-nav-rr__project-menu"
        :style="projectMenuStyle"
      >
        <ul class="app-nav-rr__project-menu-list" role="listbox">
          <li v-for="opt in projectOptions" :key="String(opt.id)">
            <button
              type="button"
              class="app-nav-rr__project-option app-nav-rr__project-option--card"
              :class="{ 'is-active': String(opt.id) === String(currentProjectId) }"
              role="option"
              @click="selectProject(opt.id)"
            >
              <img
                v-if="optionLogoUrl(opt) && !brokenProjectLogos[String(opt.id)]"
                class="app-nav-rr__project-logo"
                :class="{ 'app-nav-rr__project-logo--folder': isAllProjectsId(opt.id) }"
                :src="optionLogoUrl(opt)"
                alt=""
                width="32"
                height="32"
                @error="markProjectLogoBroken(opt.id)"
              />
              <span
                v-else
                class="app-nav-rr__project-fallback"
                :class="{
                  'app-nav-rr__project-fallback--wb': optionInitial(opt) === 'wb',
                  'app-nav-rr__project-fallback--mts': optionInitial(opt) === 'МТС',
                  'app-nav-rr__project-fallback--bordered':
                    Boolean(opt.fallbackTextColor) && opt.fallbackColor === '#FFFFFF',
                }"
                :style="optionFallbackStyle(opt)"
                aria-hidden="true"
              >
                {{ optionInitial(opt) }}
              </span>
              <span class="app-nav-rr__project-text">
                <span class="app-nav-rr__project-name">{{ opt.name }}</span>
                <span
                  v-if="!isAllProjectsId(opt.id)"
                  class="app-nav-rr__project-caption"
                >{{ opt.caption || projectCaption }}</span>
              </span>
            </button>
          </li>
        </ul>
      </div>
    </Teleport>

    <footer class="app-nav-rr__footer">
      <a
        class="app-nav-rr__link"
        :href="supportHref"
        target="_blank"
        rel="noopener noreferrer"
        :title="isCollapsed ? supportLabel : undefined"
      >
        <img class="app-nav-rr__icon" :src="navRrIcons.support" alt="" width="20" height="20" />
        <span class="app-nav-rr__label">{{ supportLabel }}</span>
      </a>

      <button
        type="button"
        class="app-nav-rr__row-btn app-nav-rr__collapse-btn"
        :aria-pressed="isCollapsed"
        :title="collapseLabel"
        @click="toggleCollapsed"
      >
        <img class="app-nav-rr__icon" :src="navRrIcons.collapse" alt="" width="20" height="20" />
        <span class="app-nav-rr__label">{{ collapseLabel }}</span>
      </button>
    </footer>
  </aside>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { authRrBrand } from 'bibli/shared/assets/auth/rr'
import { acquireAppOverlay, releaseAppOverlay } from 'bibli/shared/utils/appOverlay'
import AppUserChipRR from './AppUserChipRR.vue'
import type { AppUserChipMenuItem } from './AppUserChipRR.vue'
import {
  navRrIcons,
  NAV_RR_ICON_BY_KEY,
  NAV_RR_ICON_BY_PI,
  NAV_RR_LOCKED_ICON_BY_NAME,
  CRM_ICON_BY_ID,
  type NavRrIconName,
} from './assets/icons'
import { ALL_PROJECTS_OPTION_ID } from './crmAccess'
import 'bibli/shared/tokens/index.css'
import './app-navigation-rr.css'

export interface NavItemRR {
  to?: string
  label: string
  /** PrimeIcons class или ключ (home, agents, …) */
  icon?: string
  key?: string
  disabled?: boolean
  /** Красная точка «нужно внимание» (например, инвентаризация карт). */
  badge?: boolean
  children?: NavItemRR[]
}

export interface NavItemsConfigRR {
  main: NavItemRR[]
  more: NavItemRR[]
}

export interface NavProjectOptionRR {
  id: string | number
  name: string
  logoUrl?: string
  caption?: string
  fallbackColor?: string
  /** Text on colored avatar when logo is missing (e.g. «wb», «Я»). */
  fallbackLabel?: string
  fallbackTextColor?: string
}

export interface NavServiceItemRR {
  id: string
  label: string
  color?: string
  icon?: string
  href?: string
  disabled?: boolean
  current?: boolean
}

const COLLAPSE_STORAGE_KEY = 'app-nav-rr-collapsed'
/** Phone + tablet: drawer / tab bar. Desktop (>1024): sidebar. */
const DRAWER_MQ = '(max-width: 1024px)'

const props = withDefaults(
  defineProps<{
    logoUrl?: string
    navItems?: NavItemsConfigRR
    loading?: boolean
    loaded?: boolean
    error?: boolean
    onRetry?: () => void
    showNotifications?: boolean
    /** Показать группу «Админка» (Настройки, Логирование) */
    showAdminSettings?: boolean
    showServices?: boolean
    servicesTo?: string
    servicesLabel?: string
    services?: NavServiceItemRR[]
    showProject?: boolean
    projectName?: string
    projectCaption?: string
    projectLogoUrl?: string
    projectClickable?: boolean
    projectOptions?: NavProjectOptionRR[]
    currentProjectId?: string | number | null
    supportHref?: string
    supportLabel?: string
    /** На ≤1024 скрыть drawer — навигация через нижний таббар. */
    mobileTabBarMode?: boolean
    /** Чип пользователя под логотипом (только desktop sidebar). */
    showUserChip?: boolean
    userName?: string
    userRole?: string
    avatarUrl?: string
    userMenuItems?: AppUserChipMenuItem[]
  }>(),
  {
    logoUrl: '',
    navItems: () => ({ main: [], more: [] }),
    loading: false,
    loaded: true,
    error: false,
    onRetry: () => {},
    showNotifications: true,
    showAdminSettings: false,
    showServices: false,
    servicesTo: '',
    servicesLabel: 'Все сервисы',
    services: () => [],
    showProject: false,
    projectName: '',
    projectCaption: 'проект',
    projectLogoUrl: '',
    projectClickable: false,
    projectOptions: () => [],
    currentProjectId: null,
    supportHref: 'https://t.me/uliasupport',
    supportLabel: 'Поддержка',
    mobileTabBarMode: false,
    showUserChip: true,
    userName: '',
    userRole: '',
    avatarUrl: '',
    userMenuItems: () => [],
  },
)

const emit = defineEmits<{
  notifications: []
  services: []
  'service-select': [service: NavServiceItemRR]
  project: []
  'project-change': [value: string | number]
  collapse: [collapsed: boolean]
  'update:mobileOpen': [open: boolean]
}>()

const route = useRoute()
const router = useRouter()
const navRef = ref<HTMLElement | null>(null)
const projectBtnRef = ref<HTMLElement | null>(null)
const projectMenuRef = ref<HTMLElement | null>(null)
const servicesBtnRef = ref<HTMLElement | null>(null)
const servicesMenuRef = ref<HTMLElement | null>(null)
const isMobileOpen = ref(false)
const isCollapsed = ref(false)
const isDrawerViewport = ref(false)
const openGroups = ref<Record<string, boolean>>({})
const projectMenuOpen = ref(false)
const projectMenuStyle = ref<Record<string, string>>({})
const servicesMenuOpen = ref(false)
const servicesMenuStyle = ref<Record<string, string>>({})
const brokenProjectLogos = ref<Record<string, boolean>>({})
const brokenTriggerLogo = ref(false)

function markProjectLogoBroken(id: string | number): void {
  brokenProjectLogos.value = { ...brokenProjectLogos.value, [String(id)]: true }
}

const HIDDEN_NAV_KEYS = new Set(['options', 'tasks', 'chats', 'documents', 'mentoring'])
const SETTINGS_SECTION_KEYS = new Set(['logging'])

function isHiddenNavItem(item: NavItemRR): boolean {
  const key = (item.key || '').toLowerCase()
  if (key && HIDDEN_NAV_KEYS.has(key)) return true
  const to = item.to || ''
  return (
    to === '/options/' ||
    to === '/options' ||
    to === '/tasks/' ||
    to === '/tasks' ||
    to === '/chats/' ||
    to === '/chats' ||
    to === '/documents/' ||
    to === '/documents' ||
    to === '/mentoring/' ||
    to === '/mentoring'
  )
}

function isSettingsSectionItem(item: NavItemRR): boolean {
  const key = (item.key || '').toLowerCase()
  return Boolean(key && SETTINGS_SECTION_KEYS.has(key))
}

const resolvedLogoUrl = computed(() => {
  const fromProp = typeof props.logoUrl === 'string' ? props.logoUrl.trim() : ''
  return fromProp || authRrBrand.logo
})

/** Мобилка: логотип → хаб профиля; десктоп — на главную. */
const logoTo = computed(() => (isDrawerViewport.value ? '/profile' : '/'))

const mainItems = computed(() => {
  const raw = [...(props.navItems?.main ?? []), ...(props.navItems?.more ?? [])]
  return raw.filter((item) => !isHiddenNavItem(item) && !isSettingsSectionItem(item))
})

const adminGroup = computed((): NavItemRR | null => {
  if (!props.showAdminSettings) return null

  const fromPages = [...(props.navItems?.main ?? []), ...(props.navItems?.more ?? [])].filter(
    (item) => !isHiddenNavItem(item) && isSettingsSectionItem(item),
  )

  return {
    label: 'Админка',
    icon: 'pi pi-cog',
    key: 'admin',
    children: [
      {
        to: '/admin',
        label: 'Настройки',
        key: 'admin-settings',
      },
      ...fromPages,
    ],
  }
})

const sidebarItems = computed(() => {
  const items = [...mainItems.value]
  if (adminGroup.value) items.push(adminGroup.value)
  return items
})

const collapseLabel = computed(() =>
  isCollapsed.value ? 'Раскрыть меню' : 'Свернуть меню',
)

const isSidebarCollapsed = computed(
  () => !isDrawerViewport.value && isCollapsed.value,
)

const isAllProjectsSelected = computed(() =>
  isAllProjectsId(props.currentProjectId),
)

const resolvedProjectLogoUrl = computed(() => {
  if (props.projectLogoUrl) return props.projectLogoUrl
  if (isAllProjectsSelected.value) return navRrIcons.allProjects
  const current = props.projectOptions.find(
    (o) => String(o.id) === String(props.currentProjectId ?? ''),
  )
  if (current?.logoUrl) return current.logoUrl
  if (isAllProjectsId(current?.id)) return navRrIcons.allProjects
  return ''
})

const projectInitial = computed(() => {
  if (isAllProjectsSelected.value) return ''
  const current = props.projectOptions.find(
    (o) => String(o.id) === String(props.currentProjectId ?? ''),
  )
  if (current?.fallbackLabel) return current.fallbackLabel
  const name = (props.projectName || '').trim()
  return name ? name.charAt(0).toUpperCase() : 'П'
})

const projectFallbackStyle = computed(() => {
  const current = props.projectOptions.find(
    (o) => String(o.id) === String(props.currentProjectId ?? ''),
  )
  if (!current?.fallbackColor) return undefined
  const style: Record<string, string> = { background: current.fallbackColor }
  if (current.fallbackTextColor) style.color = current.fallbackTextColor
  return style
})

function isAllProjectsId(id: string | number | null | undefined): boolean {
  return String(id ?? '') === ALL_PROJECTS_OPTION_ID
}

function optionLogoUrl(opt: NavProjectOptionRR): string {
  if (opt.logoUrl) return opt.logoUrl
  if (isAllProjectsId(opt.id)) return navRrIcons.allProjects
  return ''
}

function optionInitial(opt: NavProjectOptionRR): string {
  if (isAllProjectsId(opt.id)) return ''
  if (opt.fallbackLabel) return opt.fallbackLabel
  const name = (opt.name || '').trim()
  return name ? name.charAt(0).toUpperCase() : 'П'
}

function optionFallbackStyle(opt: NavProjectOptionRR): Record<string, string> | undefined {
  if (!opt.fallbackColor) return undefined
  const style: Record<string, string> = { background: opt.fallbackColor }
  if (opt.fallbackTextColor) style.color = opt.fallbackTextColor
  return style
}

function crmIconUrl(id: string, custom?: string): string {
  const key = String(id || '').toLowerCase().trim()
  // Всегда Figma-бейджи для известных CRM; custom/logo_url только для прочих.
  if (CRM_ICON_BY_ID[key]) return CRM_ICON_BY_ID[key]
  if (custom) return custom
  return navRrIcons.services
}

function itemKey(item: NavItemRR): string {
  return item.key || item.to || item.label
}

function resolveIconName(item: NavItemRR): NavRrIconName {
  const key = (item.key || '').toLowerCase()
  if (key && NAV_RR_ICON_BY_KEY[key]) return NAV_RR_ICON_BY_KEY[key]

  const icon = item.icon || ''
  for (const [pi, name] of Object.entries(NAV_RR_ICON_BY_PI)) {
    if (icon.includes(pi)) return name
  }

  return 'home'
}

function iconUrlFor(item: NavItemRR): string {
  const name = resolveIconName(item)
  if (item.disabled === true) {
    const lockedIcon = NAV_RR_LOCKED_ICON_BY_NAME[name]
    if (lockedIcon) return lockedIcon
  }
  return navRrIcons[name]
}

function normalizePath(path: string): string {
  if (!path) return '/'
  const bare = path.split('?')[0].split('#')[0]
  if (bare.length > 1 && bare.endsWith('/')) return bare.slice(0, -1)
  return bare || '/'
}

function isActive(to?: string, exact = false): boolean {
  if (!to) return false
  const current = normalizePath(route.path)
  const target = normalizePath(to)
  if (target === '/') return current === '/'
  if (exact) return current === target
  return current === target || current.startsWith(`${target}/`)
}

function isChildActive(child: NavItemRR, siblings: NavItemRR[]): boolean {
  if (!child.to || !isActive(child.to)) return false
  const current = normalizePath(route.path)
  const target = normalizePath(child.to)
  if (current === target) return true
  return !siblings.some((sibling) => {
    if (!sibling.to || sibling === child) return false
    const other = normalizePath(sibling.to)
    if (other === target || other.length <= target.length) return false
    return current === other || current.startsWith(`${other}/`)
  })
}

/** Плоский сайдбар (Реестр): /cards/ не должен быть active на /cards/split/. */
function isTopLevelActive(item: NavItemRR): boolean {
  return isChildActive(item, sidebarItems.value)
}

function isGroupActive(item: NavItemRR): boolean {
  return Boolean(item.children?.some((child) => isActive(child.to)))
}

function isGroupOpen(item: NavItemRR): boolean {
  const key = itemKey(item)
  if (key in openGroups.value) return openGroups.value[key]
  return isGroupActive(item)
}

function toggleGroup(item: NavItemRR): void {
  if (isSidebarCollapsed.value) {
    const first = item.children?.find((child) => child.to)
    if (first?.to) void router.push(first.to)
    return
  }

  const key = itemKey(item)
  openGroups.value = {
    ...openGroups.value,
    [key]: !isGroupOpen(item),
  }
}

function closeNavigation(): void {
  clearSwipeTransform()
  isMobileOpen.value = false
}

function openNavigation(): void {
  clearSwipeTransform()
  isMobileOpen.value = true
}

function toggleNavigation(): void {
  if (isMobileOpen.value) closeNavigation()
  else openNavigation()
}

const SWIPE_ARM_DX = 28
const SWIPE_CLOSE_DX = 112
const SWIPE_DOMINANCE = 1.75
const SWIPE_MIN_MS = 70
const SWIPE_MAX_MS = 1200
const CLICK_GUARD_MS = 450

const swipeStartX = ref(0)
const swipeStartY = ref(0)
const swipeStartAt = ref(0)
const swipeTracking = ref(false)
const swipeDragging = ref(false)
const swipeLockedVertical = ref(false)
let suppressClicksUntil = 0

function clearSwipeTransform(): void {
  const el = navRef.value
  if (!el) return
  el.classList.remove('is-swiping')
  el.style.transform = ''
  el.style.transition = ''
}

function armClickGuard(): void {
  suppressClicksUntil = Date.now() + CLICK_GUARD_MS
}

function onNavTouchStart(event: TouchEvent): void {
  if (!isMobileOpen.value || !isDrawerViewport.value) return
  if (event.touches.length !== 1) {
    onNavTouchCancel()
    return
  }
  const touch = event.touches[0]
  if (!touch) return
  swipeStartX.value = touch.clientX
  swipeStartY.value = touch.clientY
  swipeStartAt.value = Date.now()
  swipeTracking.value = true
  swipeDragging.value = false
  swipeLockedVertical.value = false
}

function onNavTouchMove(event: TouchEvent): void {
  if (!swipeTracking.value || swipeLockedVertical.value || !navRef.value) return
  const touch = event.touches[0]
  if (!touch) return

  const dx = touch.clientX - swipeStartX.value
  const dy = touch.clientY - swipeStartY.value
  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)

  if (!swipeDragging.value) {
    if (absDx < SWIPE_ARM_DX && absDy < SWIPE_ARM_DX) return
    if (absDy >= absDx * SWIPE_DOMINANCE) {
      swipeLockedVertical.value = true
      swipeTracking.value = false
      clearSwipeTransform()
      return
    }
    if (dx >= 0 || absDx < SWIPE_ARM_DX) return
    swipeDragging.value = true
    navRef.value.classList.add('is-swiping')
  }

  if (dx >= 0) {
    navRef.value.style.transition = 'none'
    navRef.value.style.transform = 'translateX(0)'
    return
  }

  navRef.value.style.transition = 'none'
  navRef.value.style.transform = `translateX(${dx}px)`
}

function onNavTouchEnd(event: TouchEvent): void {
  const wasDragging = swipeDragging.value
  const wasTracking = swipeTracking.value
  swipeTracking.value = false
  swipeDragging.value = false
  swipeLockedVertical.value = false

  if (!wasTracking) return

  const touch = event.changedTouches[0]
  const el = navRef.value
  if (!touch || !el) {
    clearSwipeTransform()
    return
  }

  const dx = touch.clientX - swipeStartX.value
  const dy = Math.abs(touch.clientY - swipeStartY.value)
  const elapsed = Date.now() - swipeStartAt.value
  const shouldClose =
    wasDragging &&
    dx <= -SWIPE_CLOSE_DX &&
    Math.abs(dx) > dy * SWIPE_DOMINANCE &&
    elapsed >= SWIPE_MIN_MS &&
    elapsed <= SWIPE_MAX_MS

  if (shouldClose) {
    armClickGuard()
    clearSwipeTransform()
    closeNavigation()
    return
  }

  if (wasDragging) {
    // свайп не дотянули — блокируем «ложный» клик по пункту под пальцем
    armClickGuard()
  }
  clearSwipeTransform()
}

function onNavTouchCancel(): void {
  if (swipeDragging.value) armClickGuard()
  swipeTracking.value = false
  swipeDragging.value = false
  swipeLockedVertical.value = false
  clearSwipeTransform()
}

function onNavClickCapture(event: MouseEvent): void {
  if (Date.now() >= suppressClicksUntil) return
  event.preventDefault()
  event.stopPropagation()
}

watch(
  () => props.projectOptions.map((o) => `${o.id}:${o.logoUrl || ''}`).join('|'),
  () => {
    brokenProjectLogos.value = {}
  },
)

watch(
  () => resolvedProjectLogoUrl.value,
  () => {
    brokenTriggerLogo.value = false
  },
)

watch(isMobileOpen, (open) => {
  emit('update:mobileOpen', open)
})

const navOverlayHeld = ref(false)

function syncNavOverlay(): void {
  if (typeof document === 'undefined') return
  const shouldHold =
    isMobileOpen.value && isDrawerViewport.value && !props.mobileTabBarMode
  if (shouldHold && !navOverlayHeld.value) {
    acquireAppOverlay()
    navOverlayHeld.value = true
  } else if (!shouldHold && navOverlayHeld.value) {
    releaseAppOverlay()
    navOverlayHeld.value = false
  }
}

function syncBodyScrollLock(): void {
  if (typeof document === 'undefined') return
  const lock = isMobileOpen.value && isDrawerViewport.value
  document.body.style.overflow = lock ? 'hidden' : ''
}

function syncSidebarWidth(): void {
  if (typeof document === 'undefined') return
  const drawer = isDrawerViewport.value
  const width = drawer
    ? '0px'
    : isCollapsed.value
      ? 'var(--app-nav-rr-collapsed, 80px)'
      : 'var(--app-nav-rr-expanded, 264px)'
  document.documentElement.style.setProperty('--app-nav-rr-width', width)
}

function toggleCollapsed(): void {
  isCollapsed.value = !isCollapsed.value
  try {
    localStorage.setItem(COLLAPSE_STORAGE_KEY, isCollapsed.value ? '1' : '0')
  } catch {
    /* ignore */
  }
  syncSidebarWidth()
  emit('collapse', isCollapsed.value)
}

function updateAnchoredMenuPosition(
  btn: HTMLElement | null,
  styleRef: typeof projectMenuStyle,
  opts?: { minWidth?: number; maxHeight?: number },
): void {
  if (!btn || typeof window === 'undefined') return

  const rect = btn.getBoundingClientRect()
  const gap = 6
  const edgePad = 48
  const preferredMax = opts?.maxHeight ?? 240
  const spaceBelow = window.innerHeight - rect.bottom - gap - edgePad
  const spaceAbove = rect.top - gap - edgePad
  const openUp = spaceBelow < 140 && spaceAbove > spaceBelow
  const height = Math.min(preferredMax, Math.max(120, openUp ? spaceAbove : spaceBelow))

  const width = Math.max(rect.width, opts?.minWidth ?? 200)
  const left = Math.min(
    Math.max(8, rect.left),
    Math.max(8, window.innerWidth - width - 8),
  )

  styleRef.value = {
    position: 'fixed',
    left: `${left}px`,
    width: `${width}px`,
    maxHeight: `${height}px`,
    zIndex: '1100',
    ...(openUp
      ? { bottom: `${window.innerHeight - rect.top + gap}px`, top: 'auto' }
      : { top: `${rect.bottom + gap}px`, bottom: 'auto' }),
  }
}

function updateProjectMenuPosition(): void {
  updateAnchoredMenuPosition(projectBtnRef.value, projectMenuStyle, { minWidth: 240, maxHeight: 240 })
}

function updateServicesMenuPosition(): void {
  updateAnchoredMenuPosition(servicesBtnRef.value, servicesMenuStyle, { minWidth: 220, maxHeight: 280 })
}

function onServicesClick(): void {
  if (props.servicesTo) return
  if (!props.services.length) {
    emit('services')
    return
  }
  projectMenuOpen.value = false
  servicesMenuOpen.value = !servicesMenuOpen.value
  if (servicesMenuOpen.value) {
    void nextTick(() => updateServicesMenuPosition())
  }
}

function selectService(svc: NavServiceItemRR): void {
  servicesMenuOpen.value = false
  emit('service-select', svc)
  if (svc.current || svc.disabled) return
  if (!svc.href) return
  const href = svc.href.trim()
  if (href.startsWith('/') && !href.startsWith('//')) {
    void router.push(href)
    return
  }
  if (typeof window !== 'undefined') {
    window.location.assign(href)
  }
}

function onProjectClick(): void {
  if (!props.projectClickable) return
  if (props.projectOptions.length === 0) {
    emit('project')
    return
  }
  servicesMenuOpen.value = false
  projectMenuOpen.value = !projectMenuOpen.value
  if (projectMenuOpen.value) {
    void nextTick(() => updateProjectMenuPosition())
  }
}

function selectProject(id: string | number): void {
  projectMenuOpen.value = false
  if (String(id) === String(props.currentProjectId ?? '')) return
  emit('project-change', id)
}

function readCollapsed(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(COLLAPSE_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function syncNavViewport(): void {
  if (typeof window === 'undefined') return
  isDrawerViewport.value = window.matchMedia(DRAWER_MQ).matches
  if (!isDrawerViewport.value) {
    isMobileOpen.value = false
  }
  syncSidebarWidth()
}

function handleClickOutside(event: MouseEvent): void {
  const target = event.target
  if (!(target instanceof Node)) return

  if (projectMenuOpen.value) {
    const inBtn = projectBtnRef.value?.contains(target)
    const inMenu = projectMenuRef.value?.contains(target)
    if (!inBtn && !inMenu) projectMenuOpen.value = false
  }

  if (servicesMenuOpen.value) {
    const inBtn = servicesBtnRef.value?.contains(target)
    const inMenu = servicesMenuRef.value?.contains(target)
    if (!inBtn && !inMenu) servicesMenuOpen.value = false
  }

  if (!isMobileOpen.value || !navRef.value) return
  if (target instanceof Element && target.closest('[data-nav-menu-toggle]')) return
  if (!navRef.value.contains(target)) closeNavigation()
}

function onProjectMenuReposition(): void {
  if (projectMenuOpen.value) updateProjectMenuPosition()
  if (servicesMenuOpen.value) updateServicesMenuPosition()
}

onMounted(() => {
  isCollapsed.value = readCollapsed()
  syncNavViewport()
  window.addEventListener('resize', syncNavViewport)
  window.addEventListener('resize', onProjectMenuReposition)
  window.addEventListener('scroll', onProjectMenuReposition, true)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('resize', syncNavViewport)
  window.removeEventListener('resize', onProjectMenuReposition)
  window.removeEventListener('scroll', onProjectMenuReposition, true)
  document.removeEventListener('click', handleClickOutside)
  if (navOverlayHeld.value) {
    releaseAppOverlay()
    navOverlayHeld.value = false
  }
  if (typeof document !== 'undefined') {
    document.documentElement.style.removeProperty('--app-nav-rr-width')
    document.body.style.overflow = ''
  }
})

watch(
  () => route.fullPath,
  () => {
    closeNavigation()
    projectMenuOpen.value = false
    servicesMenuOpen.value = false
  },
)

watch([isCollapsed, isMobileOpen, isDrawerViewport], () => {
  syncSidebarWidth()
  syncBodyScrollLock()
  syncNavOverlay()
  projectMenuOpen.value = false
  servicesMenuOpen.value = false
})

watch(() => props.mobileTabBarMode, syncNavOverlay)

defineExpose({
  openNavigation,
  closeNavigation,
  toggleNavigation,
  isMobileOpen,
  isCollapsed,
})
</script>
