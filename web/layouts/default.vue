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
    :show-notifications="true"
    :show-user-chip="true"
    :user-name="userName"
    :user-role="userRole"
    :user-menu-items="userMenuItems"
    @mobile-navigate="onTabNavigate"
    @notifications="notif.show()"
  >
    <template #header-actions>
      <NotificationBell :badge="badge" @click="notif.show()" />
    </template>
    <slot />
    <UndoToast />
    <NotificationsSheet />
  </AppShellRR>
</template>

<script setup lang="ts">
import { useRussRedesignShell } from 'bibli/shared/theme/rr'
import { AppShellRR } from 'bibli/widgets/Layout/rr'
import type { AppUserChipMenuItem } from 'bibli/widgets/Layout/rr'
import NotificationBell from '~/components/shell/NotificationBell.vue'
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
const notif = useNotificationsPanel()
const allMobileTabs = useNezaleikaMobileTabs()
const navItems = useNezaleikaNavItems()
const logoUrl = useNezaleikaLogoUrl()

/** Таббар только ≤1024 — иначе shell думает, что это мобилка и на десктопе. */
const isPhoneOrTablet = useMediaQuery('(max-width: 1024px)')
const mobileTabs = computed(() => (isPhoneOrTablet.value ? allMobileTabs : []))

const userName = computed(() => auth.user?.first_name || auth.user?.username || 'Профиль')
const userRole = computed(() => '')

const badge = computed(() => {
  const cal = plants.calendar
  if (!cal) return 0
  return (cal.days[cal.today]?.overdue ?? []).length
})

const userMenuItems = computed((): AppUserChipMenuItem[] => [
  {
    label: 'Профиль',
    to: '/profile',
  },
  {
    label: 'Уведомления',
    command: () => notif.show(),
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
