import type { ToastServiceMethods } from './types'
import { addToast, removeToastGroup, clearAllToasts } from './toastState'

/**
 * Composable для показа уведомлений Toast.
 * API совместим с useToast(): add({ severity, summary, detail?, life?, group? }).
 */
export function useToast(): ToastServiceMethods {
  return {
    add(options) {
      addToast(options)
    },
    removeGroup(group: string) {
      removeToastGroup(group)
    },
    removeAllGroups() {
      clearAllToasts()
    },
  }
}
