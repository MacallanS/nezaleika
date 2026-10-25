<template>
  <AppShellRR
    :logo-url="logoUrl"
    :nav-items="navItems"
    :mobile-tabs="mobileTabs"
    :title="chrome.title"
    :description="chrome.description"
    :child-page="chrome.childPage"
    :parent-title="chrome.parentTitle"
    :parent-to="chrome.parentTo"
    :show-header="true"
    :show-notifications="false"
    :show-user-chip="true"
    :user-name="userName"
    :user-role="userRole"
    :avatar-url="avatarUrl"
    :user-menu-items="userMenuItems"
    @mobile-navigate="onTabNavigate"
  >
    <slot />
    <UndoToast />
    <NotificationsSheet />
  </AppShellRR>
</template>

<script setup lang="ts">
import { useRussRedesignShell } from 'bibli/shared/theme/rr'
import { AppShellRR } from 'bibli/widgets/Layout/rr'
import type { AppUserChipMenuItem } from 'bibli/widgets/Layout/rr'
import NotificationsSheet from '~/components/shell/NotificationsSheet.vue'
import UndoToast from '~/components/planner/UndoToast.vue'
import { usePageChromeState } from '~/composables/usePageChrome'
import {
  useNezaleikaLogoUrl,
  useNezaleikaMobileTabs,
  useNezaleikaNavItems,
} from '~/composables/useNezaleikaShell'
import { addDays, isoDate, parseIsoDate } from '~/utils/dates'

useRussRedesignShell({ colorMode: 'light', density: '100', mobileBreakpoint: 1024 })

const auth = useAuthStore()
const plants = usePlantsStore()
const chrome = usePageChromeState()
const allMobileTabs = useNezaleikaMobileTabs()
const baseNav = useNezaleikaNavItems()
const logoUrl = useNezaleikaLogoUrl()

/** Таббар только ≤1024 — иначе shell думает, что это мобилка и на десктопе. */
const isPhoneOrTablet = useMediaQuery('(max-width: 1024px)')

/** Есть что полить сегодня или просрочено — точка на «Графике», без колокольчика в шапке. */
const needsWater = computed(() => {
  if (plants.agenda) {
    return plants.agenda.sections.overdue.length + plants.agenda.sections.today.length > 0
  }
  const cal = plants.calendar
  if (cal) {
    const day = cal.days[cal.today]
    return (day?.overdue.length ?? 0) + (day?.planned.length ?? 0) > 0
  }
  return plants.todoCount > 0
})

const mobileTabs = computed(() => {
  if (!isPhoneOrTablet.value) return []
  return allMobileTabs.map((tab) => (tab.key === 'today' ? { ...tab, badge: needsWater.value } : tab))
})

const navItems = computed(() => ({
  ...baseNav,
  main: baseNav.main.map((item) => (item.to === '/' ? { ...item, badge: needsWater.value } : item)),
}))

const userName = computed(() => auth.user?.first_name || auth.user?.username || 'Профиль')
const userRole = computed(() => '')
const avatarUrl = computed(() => auth.user?.avatar_url || '')

const userMenuItems = computed((): AppUserChipMenuItem[] => [
  {
    label: 'Профиль',
    to: '/profile',
  },
  {
    label: 'Выйти',
    command: () => {
      void auth.logout().then(() => {
        void navigateTo('/login')
      })
    },
  },
])

function onTabNavigate(to: string) {
  if (!to) return
  void navigateTo(to)
}

onMounted(() => {
  if (plants.calendar || !auth.user) return
  const today = isoDate(new Date())
  void plants.fetchCalendar(today, isoDate(addDays(parseIsoDate(today), 14))).catch(() => {})
})
</script>
