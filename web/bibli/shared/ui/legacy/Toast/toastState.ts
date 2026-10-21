import { ref } from 'vue'
import type { ToastMessage, ToastMessageOptions, ToastSeverity, ToastMessageOptionsSeverity } from './types'

let idCounter = 0
function nextId(): string {
  idCounter += 1
  return `toast-${idCounter}-${Date.now()}`
}

const DEFAULT_LIFE = 3000

export const toastMessages = ref<ToastMessage[]>([])

function normalizeSeverity(s?: ToastMessageOptionsSeverity): ToastSeverity {
  if (s === 'warn' || s === 'warning') return 'warn'
  if (s === 'success' || s === 'info' || s === 'error') return s
  return 'info'
}

export function addToast(options: ToastMessageOptions): void {
  const severity = normalizeSeverity(options.severity)
  const message: ToastMessage = {
    id: nextId(),
    severity,
    summary: options.summary ?? '',
    detail: options.detail ?? '',
    life: options.life ?? DEFAULT_LIFE,
    group: options.group,
  }
  toastMessages.value = [...toastMessages.value, message]
}

export function removeToast(id: string): void {
  toastMessages.value = toastMessages.value.filter((m) => m.id !== id)
}

export function removeToastGroup(group: string): void {
  toastMessages.value = toastMessages.value.filter((m) => m.group !== group)
}

export function clearAllToasts(): void {
  toastMessages.value = []
}
