import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  type ComputedRef,
  type Ref,
} from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { APP_RR_HEADER_ACTIONS_ID } from '../headerActions'

/**
 * Teleport в `#app-rr-header-actions` только пока страница активна И хост уже в DOM.
 *
 * Без проверки хоста: уход с /profile (шапки нет) → cards монтирует Teleport в null
 * → Vue KeepAlive падает с emitsOptions / nextSibling.
 *
 * onBeforeRouteLeave снимает Teleport до смены шапки.
 */
export function useRrHeaderActionsTeleport(
  initiallyActive = true,
): {
  /** Можно монтировать Teleport (страница активна + хост есть). */
  headerActionsActive: ComputedRef<boolean>
  /** Страница ещё хочет actions (даже если хост пока не появился). */
  headerActionsWanted: Ref<boolean>
  headerHostReady: Ref<boolean>
  activateHeaderActions: () => void
  deactivateHeaderActions: () => void
} {
  const headerActionsWanted = ref(initiallyActive)
  const headerHostReady = ref(false)

  const headerActionsActive = computed(
    () => headerActionsWanted.value && headerHostReady.value,
  )

  function syncHeaderHost() {
    if (typeof document === 'undefined') {
      headerHostReady.value = false
      return
    }
    headerHostReady.value = Boolean(
      document.getElementById(APP_RR_HEADER_ACTIONS_ID),
    )
  }

  function activateHeaderActions() {
    headerActionsWanted.value = true
    syncHeaderHost()
    if (headerHostReady.value) return

    void nextTick(() => {
      syncHeaderHost()
      if (headerHostReady.value) return
      if (typeof requestAnimationFrame !== 'function') return
      requestAnimationFrame(() => {
        syncHeaderHost()
        if (headerHostReady.value) return
        requestAnimationFrame(syncHeaderHost)
      })
    })
  }

  function deactivateHeaderActions() {
    headerActionsWanted.value = false
  }

  onMounted(() => {
    if (headerActionsWanted.value) activateHeaderActions()
    else syncHeaderHost()
  })
  onActivated(activateHeaderActions)
  onDeactivated(deactivateHeaderActions)
  onBeforeUnmount(deactivateHeaderActions)
  onBeforeRouteLeave(() => {
    deactivateHeaderActions()
  })

  return {
    headerActionsActive,
    headerActionsWanted,
    headerHostReady,
    activateHeaderActions,
    deactivateHeaderActions,
  }
}
