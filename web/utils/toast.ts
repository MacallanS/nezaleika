import { useToast } from 'bibli/shared/ui/legacy/Toast'
import type { ToastSeverity } from 'bibli/shared/ui/legacy/Toast/types'

export function notify(summary: string, severity: ToastSeverity = 'success', detail?: string) {
  useToast().add({
    severity,
    summary,
    detail,
    life: severity === 'error' ? 5000 : 3200,
  })
}
