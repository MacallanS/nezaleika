/** Keeps SW ready for Web Push; subscription is triggered from Profile. */
export default defineNuxtPlugin(() => {
  if (!import.meta.client || !('serviceWorker' in navigator)) return
  navigator.serviceWorker.ready.catch(() => {
    /* PWA module registers SW */
  })
})
