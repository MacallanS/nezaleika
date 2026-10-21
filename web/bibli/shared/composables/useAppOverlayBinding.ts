import { onBeforeUnmount, watch, type WatchSource } from 'vue'
import { acquireAppOverlay, releaseAppOverlay } from '../utils/appOverlay'

/**
 * Связать dimmer / fullscreen overlay с html.app-overlay-open.
 * Любой такой слой должен иметь z-index > APP_SAFE_AREA_FILLER_Z_INDEX (9999).
 */
export function useAppOverlayBinding(open: WatchSource<boolean>): void {
  let held = false

  watch(
    open,
    (isOpen) => {
      if (isOpen && !held) {
        acquireAppOverlay()
        held = true
        return
      }
      if (!isOpen && held) {
        releaseAppOverlay()
        held = false
      }
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    if (!held) return
    releaseAppOverlay()
    held = false
  })
}

/** Overlay с v-if на родителе: hold на время жизни компонента. */
export function useAppOverlayWhileMounted(): void {
  acquireAppOverlay()
  onBeforeUnmount(() => releaseAppOverlay())
}
