/**
 * Подтягивает обновления установленной PWA:
 * autoUpdate + needRefresh → activate SW → один hard reload с cache-bust.
 * Probe при visibility / focus, чтобы standalone не залипал на старом SW.
 */
import { watch } from 'vue'
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

export default defineNuxtPlugin(() => {
  if (!import.meta.client) return

  stripCacheBustParam()

  const { $pwa } = useNuxtApp()
  if (!$pwa) return

  let handling = false

  async function applySwUpdate() {
    if (handling) return
    if (!$pwa.needRefresh) return

    handling = true

    // Уже прошли update+reload — только активируем SW, без второго reload (петля на iOS).
    if (hasCacheBustParam() || wasSwUpdateAppliedRecently()) {
      try {
        await $pwa.updateServiceWorker(false)
      } catch (error) {
        console.warn('[pwa-update] updateServiceWorker(activate-only) failed:', error)
      }
      markSwUpdateApplied()
      handling = false
      return
    }

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

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      document.removeEventListener('visibilitychange', probeIfDue)
      window.removeEventListener('focus', probeIfDue)
      window.clearInterval(timer)
    })
  }
})
