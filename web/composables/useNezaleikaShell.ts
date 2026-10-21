import type { MobileTabBarItemRR } from 'bibli/widgets/Layout/rr/AppMobileTabBarRR.vue'

export function useNezaleikaMobileTabs(): MobileTabBarItemRR[] {
  return [
    {
      slot: 0,
      key: 'feed',
      label: 'Лента',
      to: '/',
      iconKey: 'home',
      state: 'link',
      matchExact: true,
    },
    {
      slot: 1,
      key: 'plants',
      label: 'Мои',
      to: '/plants',
      iconKey: 'products',
      state: 'link',
    },
    {
      slot: 2,
      key: 'add',
      label: 'Добавить',
      to: '/plants/add',
      iconKey: 'onboarding',
      state: 'link',
    },
    {
      slot: 3,
      key: 'spacer',
      label: '',
      iconKey: 'home',
      state: 'empty',
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
