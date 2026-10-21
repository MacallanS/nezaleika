import type { ActivationStepStatus } from './activationSteps'
import {
  ACTIVATION_PROGRESS_TOTAL,
  ACTIVATION_STEPS,
  type ActivationStepsMap,
} from './activationSteps'

export type ActivationBlockStatusTone =
  | 'empty'
  | 'partial'
  | 'review'
  | 'error'
  | 'done'
  | 'unavailable'

export type ActivationBlockAudience = 'agent' | 'support'

export interface ActivationBlockStatusView {
  label: string
  tone: ActivationBlockStatusTone
}

export interface ActivationBlockStatusOptions {
  unavailable?: boolean
  /** Агент видит «На проверке», саппорт — «Ждет проверки». По умолчанию агент. */
  audience?: ActivationBlockAudience
  prefix?: string
}

/** Подписи и tone для карточек шагов. Агент и саппорт — разные тексты review/done. */
export function resolveActivationBlockStatus(
  status: ActivationStepStatus | string | null | undefined,
  options: ActivationBlockStatusOptions = {},
): ActivationBlockStatusView {
  if (options.unavailable) {
    return { label: 'Нет информации', tone: 'unavailable' }
  }

  const isSupport = options.audience === 'support'

  switch (status) {
    case 'partial':
      return { label: 'Частично заполнено', tone: 'partial' }
    case 'review':
      return {
        label: isSupport ? 'Ждет проверки' : 'На проверке',
        tone: 'review',
      }
    case 'error':
      return {
        label: isSupport ? 'Отклонено' : 'Отклонен',
        tone: 'error',
      }
    case 'done':
      return {
        label: 'Принято',
        tone: 'done',
      }
    case 'empty':
      return { label: 'Не заполнено', tone: 'empty' }
    default:
      return { label: 'Не заполнено', tone: 'empty' }
  }
}

export function activationBlockStatusLabel(
  status: ActivationStepStatus | string | null | undefined,
  options: ActivationBlockStatusOptions = {},
): string {
  return resolveActivationBlockStatus(status, options).label
}

export function activationBlockStatusClass(
  status: ActivationStepStatus | string | null | undefined,
  options: ActivationBlockStatusOptions = {},
): string {
  const prefix = options.prefix ?? 'activation-block-status'
  const tone = resolveActivationBlockStatus(status, options).tone
  return `${prefix}--${tone}`
}

export type ActivationHomeBannerStatusView =
  | { kind: 'badge'; label: string; tone: 'error' | 'review' | 'done' }
  | { kind: 'progress'; label: string; completed: number; total: number }
  | { kind: 'link'; label: string }

export interface ActivationHomeBannerStatusOptions {
  /** Дней тестового доступа; `0` — закончился; влияет на CTA «Активируйте профиль». */
  trialDaysLeft?: number | null
}

/** Приоритет баннера на главной: замечания → принято → на проверке → прогресс. */
export function resolveActivationHomeBannerStatus(
  steps: ActivationStepsMap,
  options: ActivationHomeBannerStatusOptions = {},
): ActivationHomeBannerStatusView {
  if (ACTIVATION_STEPS.some((step) => steps[step.id] === 'error')) {
    return { kind: 'badge', label: 'Внести правки', tone: 'error' }
  }

  if (ACTIVATION_STEPS.every((step) => steps[step.id] === 'done')) {
    return { kind: 'badge', label: 'Принято', tone: 'done' }
  }

  const progressSteps = ACTIVATION_STEPS.filter((step) => step.countsTowardProgress)
  const allSubmitted = progressSteps.every(
    (step) => steps[step.id] === 'review' || steps[step.id] === 'done',
  )
  const anyReview = progressSteps.some((step) => steps[step.id] === 'review')
  if (allSubmitted && anyReview) {
    return { kind: 'badge', label: 'На проверке', tone: 'review' }
  }

  const completedSteps = progressSteps.filter(
    (step) => steps[step.id] === 'done' || steps[step.id] === 'review',
  ).length

  const anyPartial = ACTIVATION_STEPS.some((step) => steps[step.id] === 'partial')

  // Уже есть прогресс или черновик шага — всегда «N из 5», не текстовая ссылка.
  if (completedSteps > 0 || anyPartial) {
    return {
      kind: 'progress',
      label: `${completedSteps} из ${ACTIVATION_PROGRESS_TOTAL}`,
      completed: completedSteps,
      total: ACTIVATION_PROGRESS_TOTAL,
    }
  }

  const days = options.trialDaysLeft == null ? null : Number(options.trialDaysLeft)
  if (days != null && Number.isFinite(days) && days <= 0) {
    return { kind: 'link', label: 'Активируйте профиль' }
  }

  return { kind: 'link', label: 'Начать оформление' }
}
