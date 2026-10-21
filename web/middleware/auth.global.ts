import { getStoredAuthToken } from '~/utils/api'

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') return
  const auth = useAuthStore()
  if (!auth.loaded) await auth.bootstrap()
  if (!getStoredAuthToken() || !auth.user) {
    return navigateTo('/login')
  }
})
