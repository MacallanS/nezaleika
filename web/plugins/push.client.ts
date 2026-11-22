import { getStoredAuthToken } from '~/utils/api'

/** Keeps SW ready and re-registers an existing push subscription with the API. */
export default defineNuxtPlugin(() => {
  if (!import.meta.client || !('serviceWorker' in navigator)) return

  navigator.serviceWorker.ready.catch(() => {
    /* PWA module registers SW */
  })

  const { healSubscription } = useWebPush()

  async function healWhenAuthed() {
    if (!getStoredAuthToken()) return
    await healSubscription()
  }

  // After SW is ready and the user already granted permission.
  void navigator.serviceWorker.ready.then(() => {
    void healWhenAuthed()
  })

  // Also after a short delay in case auth bootstraps slightly later.
  window.setTimeout(() => {
    void healWhenAuthed()
  }, 2500)
})