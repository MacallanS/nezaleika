import type { MobileTabBarItemRR } from 'bibli/widgets/Layout/rr/AppMobileTabBarRR.vue'

export function useNezaleikaMobileTabs(): MobileTabBarItemRR[] {
  return [
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
}
