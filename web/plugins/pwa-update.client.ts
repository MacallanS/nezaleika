/**
 * Подтягивает обновления установленной PWA:
 * autoUpdate + needRefresh → splash «Обновляем» → activate SW → hard reload.
 * Probe при visibility / focus, чтобы standalone не залипал на старом SW.
 */
import { watch } from 'vue'
import {
  hideBootShell,
  PWA_INSTALL_COPY,
  PWA_UPDATE_COPY,
  showBootShell,
} from '~/utils/bootShell'
import {
  hardReloadWithCacheBust,
  hasCacheBustParam,
  isStandalonePwa,
  markSwUpdateApplied,
  probeServiceWorkerUpdate,
  stripCacheBustParam,
  wasSwUpdateAppliedRecently,
} from '~/utils/pwaUpdate'

const PROBE_STANDALONE_MS = 90_000
const PROBE_BROWSER_MS = 5 * 60_000

function trackWorker(worker: ServiceWorker | null): void {
  if (!worker) return

  const applyState = () => {
    if (worker.state === 'installing') {
      if (!navigator.serviceWorker.controller) {
        showBootShell(PWA_INSTALL_COPY)
      }
      return
    }
    if (worker.state === 'installed') {
      if (navigator.serviceWorker.controller) {
        if (!wasSwUpdateAppliedRecently() && !hasCacheBustParam()) {
          showBootShell(PWA_UPDATE_COPY)
        }
      } else {
        showBootShell(PWA_INSTALL_COPY)
      }
      return
    }
    if (worker.state === 'activated' || worker.state === 'redundant') {
      if (!hasCacheBustParam()) hideBootShell()
    }
  }

  applyState()
  worker.addEventListener('statechange', applyState)
}

function watchServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return

  void navigator.serviceWorker.getRegistration().then((registration) => {
    if (!registration) return
    trackWorker(registration.installing)
    registration.addEventListener('updatefound', () => {
      trackWorker(registration.installing)
    })
  })
}

export default defineNuxtPlugin(() => {
  if (!import.meta.client) return

  const arrivedWithCacheBust = hasCacheBustParam()
  stripCacheBustParam()
  // After a successful update reload, drop the splash.
  if (arrivedWithCacheBust || wasSwUpdateAppliedRecently()) {
    hideBootShell()
  }

  watchServiceWorker()

  const { $pwa } = useNuxtApp()
  if (!$pwa) return

  let handling = false

  async function applySwUpdate() {
    if (handling) return
    if (!$pwa.needRefresh) return

    handling = true

    if (arrivedWithCacheBust || wasSwUpdateAppliedRecently()) {
      try {
        await $pwa.updateServiceWorker(false)
      } catch (error) {
        console.warn('[pwa-update] updateServiceWorker(activate-only) failed:', error)
      }
      markSwUpdateApplied()
      hideBootShell()
      handling = false
      return
    }

    showBootShell(PWA_UPDATE_COPY)
    markSwUpdateApplied()

    try {
      await $pwa.updateServiceWorker(false)
    } catch (error) {
      console.warn('[pwa-update] updateServiceWorker failed:', error)
    }

    hardReloadWithCacheBust()
  }

  watch(
    () => $pwa.needRefresh,
    (need) => {
      if (need) void applySwUpdate()
    },
    { immediate: true },
  )

  const probeIfDue = () => {
    if (document.hidden) return
    if (wasSwUpdateAppliedRecently()) return
    void probeServiceWorkerUpdate()
  }

  document.addEventListener('visibilitychange', probeIfDue)
  window.addEventListener('focus', probeIfDue)

  const intervalMs = isStandalonePwa() ? PROBE_STANDALONE_MS : PROBE_BROWSER_MS
  const timer = window.setInterval(probeIfDue, intervalMs)

  // App hydrated — hide install splash if we are not mid-update.
  void Promise.resolve().then(() => {
    if (!$pwa.needRefresh) hideBootShell()
  })

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      document.removeEventListener('visibilitychange', probeIfDue)
      window.removeEventListener('focus', probeIfDue)
      window.clearInterval(timer)
    })
  }
})
