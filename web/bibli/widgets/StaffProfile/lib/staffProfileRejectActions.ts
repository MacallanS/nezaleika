import type { ActivationStepStatus } from 'bibli/widgets/Profile/rr/lib/activationSteps'

/**
 * Саппорт может отклонить раздел, если он на проверке / принят,
 * либо уже частично заполнен (даже при статусе empty).
 * Уже отклонённый (error) повторно не предлагаем.
 */
export function canSupportRejectActivationStep(
  status: ActivationStepStatus | string | null | undefined,
  hasContent: boolean,
): boolean {
  if (status === 'error') return false
  if (status === 'review' || status === 'done' || status === 'partial') return true
  return hasContent
}
