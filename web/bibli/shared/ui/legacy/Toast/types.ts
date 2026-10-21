export type ToastSeverity = 'success' | 'info' | 'warn' | 'error'

/** severity для add() — допускаем 'warning' как синоним 'warn' */
export type ToastMessageOptionsSeverity = ToastSeverity | 'warning'

export interface ToastMessageOptions {
  severity?: ToastMessageOptionsSeverity
  summary?: string
  detail?: string
  life?: number
  group?: string
}

export interface ToastMessage extends ToastMessageOptions {
  id: string
  severity: ToastSeverity
  summary: string
  detail: string
  life: number
  group?: string
}

export interface ToastServiceMethods {
  add(options: ToastMessageOptions): void
  removeGroup(group: string): void
  removeAllGroups(): void
}
