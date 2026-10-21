import type { ActivationStepId } from './activationSteps'

export interface ActivationStepRejection {
  reason: string
  comment: string | null
  count: number
}

export interface ActivationStepRejectionView {
  reasonLabel: string
  comment: string | null
  hint: string
}

export const ACTIVATION_REJECT_REASON_LABELS: Record<string, string> = {
  illegible_scan: 'Нечитаемый скан',
  data_mismatch: 'Данные не совпадают',
  expired_document: 'Документ просрочен',
  cropped_document: 'Обрезанный документ',
  other: 'Другое',
}

export const ACTIVATION_REJECT_REASON_HINTS: Record<string, string> = {
  illegible_scan: 'Прикрепите правильный документ. Не соответствует требованиям',
  data_mismatch: 'Проверьте данные и прикрепите документ, где они совпадают с анкетой.',
  expired_document: 'Прикрепите действующий документ.',
  cropped_document: 'Прикрепите документ целиком, без обрезанных краёв.',
}

export function formatActivationRejectReason(reason: string | null | undefined): string {
  if (!reason?.trim()) return ''
  return ACTIVATION_REJECT_REASON_LABELS[reason] || reason.trim()
}

export function formatActivationRejectDefaultHint(
  reason: string | null | undefined,
): string {
  if (!reason?.trim()) return ''
  return ACTIVATION_REJECT_REASON_HINTS[reason] || ''
}

export function parseActivationRejections(
  source: unknown,
): Partial<Record<ActivationStepId, ActivationStepRejection>> {
  if (!source || typeof source !== 'object') return {}

  const result: Partial<Record<ActivationStepId, ActivationStepRejection>> = {}
  for (const [step, value] of Object.entries(source as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue
    const record = value as Record<string, unknown>
    if (typeof record.reason !== 'string' || !record.reason) continue
    result[step as ActivationStepId] = {
      reason: record.reason,
      comment: typeof record.comment === 'string' ? record.comment : null,
      count: Number(record.count) || 0,
    }
  }

  return result
}

export function pickStepRejection(
  activation:
    | {
        steps?: Partial<Record<string, string>>
        rejections?: unknown
      }
    | null
    | undefined,
  stepId: ActivationStepId,
): ActivationStepRejectionView | null {
  if (activation?.steps?.[stepId] !== 'error') return null

  const entry = parseActivationRejections(activation.rejections)[stepId]
  if (!entry?.reason) return null

  return {
    reasonLabel: formatActivationRejectReason(entry.reason),
    comment: entry.comment?.trim() || null,
    hint: formatActivationRejectDefaultHint(entry.reason),
  }
}
