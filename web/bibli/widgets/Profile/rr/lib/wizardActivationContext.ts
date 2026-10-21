import type { Ref } from 'vue'
import type { ActivationStepId } from './activationSteps'
import { isActivationStepLocked } from './activationSteps'
import { activationStepStatuses } from './activationStatusSync'
import {
  pickStepRejection,
  type ActivationStepRejectionView,
} from './activationRejection'

function unwrapApiPayload(source: unknown): Record<string, unknown> | null {
  if (!source || typeof source !== 'object') return null
  const record = source as Record<string, unknown>
  if (record.data && typeof record.data === 'object') {
    return record.data as Record<string, unknown>
  }
  return record
}

export function mergeWizardActivation(
  userSource: unknown,
  activationStatusSource: unknown,
): {
  steps?: Partial<Record<string, string>>
  rejections?: unknown
} {
  const user = unwrapApiPayload(userSource)
  const statusPayload = unwrapApiPayload(activationStatusSource)
  const userActivation =
    user?.activation && typeof user.activation === 'object'
      ? (user.activation as Record<string, unknown>)
      : {}

  if (!statusPayload) {
    return userActivation as {
      steps?: Partial<Record<string, string>>
      rejections?: unknown
    }
  }

  return {
    ...userActivation,
    steps:
      (statusPayload.steps as Partial<Record<string, string>> | undefined) ??
      (userActivation.steps as Partial<Record<string, string>> | undefined),
    rejections: statusPayload.rejections ?? userActivation.rejections,
  }
}

function resolveStepStatus(
  stepId: ActivationStepId,
  activation: { steps?: Partial<Record<string, string>> },
): string {
  const fromApi = activation.steps?.[stepId]
  if (typeof fromApi === 'string' && fromApi) return fromApi
  const fromHub = activationStepStatuses[stepId]
  return typeof fromHub === 'string' ? fromHub : ''
}

/**
 * Сразу после монтирования: если хаб уже знает, что шаг на проверке/принят —
 * включаем просмотр до прихода API (без мелькания «Изменить» / «Отправить»).
 */
export function seedWizardActivationGate(
  stepId: ActivationStepId,
  refs: {
    stepStatus: Ref<string>
    viewOnly: Ref<boolean>
  },
): void {
  const status = activationStepStatuses[stepId]
  refs.stepStatus.value = status
  refs.viewOnly.value = isActivationStepLocked(status)
}

export function applyWizardActivationGate(
  userSource: unknown,
  activationStatusSource: unknown,
  stepId: ActivationStepId,
  refs: {
    stepStatus: Ref<string>
    viewOnly: Ref<boolean>
    stepRejection: Ref<ActivationStepRejectionView | null>
  },
): void {
  const activation = mergeWizardActivation(userSource, activationStatusSource)
  const status = resolveStepStatus(stepId, activation)
  refs.stepStatus.value = status
  refs.viewOnly.value = isActivationStepLocked(status)
  refs.stepRejection.value = pickStepRejection(
    {
      ...activation,
      steps: { ...(activation.steps || {}), [stepId]: status },
    },
    stepId,
  )
}

/**
 * Если шаг уже на проверке/принят — уводим сразу на экран просмотра,
 * а не на первый шаг заполнения (как при /profile/passport → /1).
 */
export function redirectViewOnlyToReviewStep(options: {
  viewOnly: boolean
  currentStep: number
  reviewStep: number
  navigateTo: (path: string, opts?: { replace?: boolean }) => unknown
  pathForStep: (step: number) => string
}): void {
  if (!options.viewOnly) return
  if (options.currentStep === options.reviewStep) return
  void options.navigateTo(options.pathForStep(options.reviewStep), { replace: true })
}

/** Отклонённый раздел: без пошагового «Назад», сразу на хаб заполнения. */
export function isActivationSectionRejected(
  status: string | null | undefined,
): boolean {
  return status === 'error'
}
