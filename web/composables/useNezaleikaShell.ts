import type { MobileTabBarItemRR } from 'bibli/widgets/Layout/rr/AppMobileTabBarRR.vue'
import type { NavItemsConfigRR } from 'bibli/widgets/Layout/rr/AppNavigationRR.vue'

const TABS: MobileTabBarItemRR[] = [
  {
    slot: 0,
    key: 'today',
    label: 'График',
    to: '/',
    iconKey: 'home',
    state: 'link',
    matchExact: true,
  },
  {
    slot: 1,
    key: 'calendar',
    label: 'Календарь',
    to: '/calendar',
    iconKey: 'shifts',
    state: 'link',
    matchExact: true,
  },
  {
    slot: 2,
    key: 'add',
    label: 'Добавить',
    to: '/plants/add',
    iconKey: 'onboarding',
    state: 'link',
    matchExact: true,
  },
  {
    slot: 3,
    key: 'plants',
    label: 'Растения',
    to: '/plants',
    iconKey: 'products',
    state: 'link',
    matchExact: true,
  },
  {
    slot: 4,
    key: 'profile',
    label: 'Профиль',
    to: '/profile',
    iconKey: 'user',
    state: 'link',
    matchExact: true,
  },
]

export function useNezaleikaMobileTabs(): MobileTabBarItemRR[] {
  return TABS
}

export function useNezaleikaNavItems(): NavItemsConfigRR {
  return {
    main: TABS.map(({ label, to, iconKey }) => ({
      // key must match NAV_RR_ICON_BY_KEY so the desktop sidebar picks the right icon
      key: iconKey,
      label,
      to,
      icon: iconKey,
    })),
    more: [],
  }
}

export function useNezaleikaLogoUrl(): string {
  const config = useRuntimeConfig()
  const base = String(config.app.baseURL || '/')
  const root = base.endsWith('/') ? base : `${base}/`
  return `${root}icons/leaf.svg`
}
