import iconPersonal from '../assets/activation/personal.png'
import iconPassport from '../assets/activation/passport.png'
import iconInn from '../assets/activation/inn.png'
import iconSnils from '../assets/activation/snils.png'
import iconBank from '../assets/activation/bank.png'
import iconAgentType from '../assets/activation/agent-type.png'
import { activationBlockStatusLabel } from './activationBlockStatus'

export type ActivationStepId =
  | 'personal'
  | 'passport'
  | 'inn'
  | 'snils'
  | 'bank'
  | 'agent-type'

/** empty — не заполнено; partial — начали, но не отправили; review — на проверке; done — заполнено (на подписании); error — нужно исправить */
export type ActivationStepStatus = 'empty' | 'partial' | 'review' | 'done' | 'error'

export interface ActivationStep {
  id: ActivationStepId
  title: string
  icon: string
  /** Учитывается в счётчике «N из 5» */
  countsTowardProgress: boolean
}

export type ActivationStepsMap = Record<ActivationStepId, ActivationStepStatus>

export const EMPTY_ACTIVATION_STATUSES: ActivationStepsMap = {
  personal: 'empty',
  passport: 'empty',
  inn: 'empty',
  snils: 'empty',
  bank: 'empty',
  'agent-type': 'empty',
}

/** Хаб активации — как в макете Title+StepCard */
export const ACTIVATION_STEPS: ActivationStep[] = [
  {
    id: 'personal',
    title: 'Личные данные',
    icon: iconPersonal,
    countsTowardProgress: true,
  },
  {
    id: 'passport',
    title: 'Паспорт',
    icon: iconPassport,
    countsTowardProgress: true,
  },
  {
    id: 'inn',
    title: 'ИНН',
    icon: iconInn,
    countsTowardProgress: true,
  },
  {
    id: 'snils',
    title: 'СНИЛС',
    icon: iconSnils,
    countsTowardProgress: true,
  },
  {
    id: 'bank',
    title: 'Банковские реквизиты',
    icon: iconBank,
    countsTowardProgress: true,
  },
  {
    id: 'agent-type',
    title: 'Тип оформления',
    icon: iconAgentType,
    countsTowardProgress: false,
  },
]

export const ACTIVATION_PROGRESS_TOTAL = ACTIVATION_STEPS.filter(
  (step) => step.countsTowardProgress,
).length

export function activationStatusLabel(status: ActivationStepStatus): string {
  return activationBlockStatusLabel(status)
}

/** Шаг уже отправлен: только просмотр, без правок. */
export function isActivationStepLocked(
  status: ActivationStepStatus | string | null | undefined,
): boolean {
  return status === 'review' || status === 'done'
}

/** После отклонения открываем сразу экран проверки с галочкой «Данные верны». */
export function shouldOpenActivationWizardAtEnd(
  status: ActivationStepStatus | string | null | undefined,
): boolean {
  return isActivationStepLocked(status) || status === 'error'
}

/** Заголовок итоговой плашки: проверка, на ревью, отклонение или уже подтверждено. */
export function reviewShellTitle(
  status: ActivationStepStatus | string | null | undefined,
): string {
  if (status === 'done') return 'Подтверждённые данные'
  if (status === 'review') return 'Данные на проверке'
  if (status === 'error') return ''
  return 'Проверьте данные'
}

/** Нормализует `user.activation.steps` из GET /api/user. */
export function normalizeActivationSteps(
  steps: Partial<Record<string, string>> | null | undefined,
): ActivationStepsMap {
  const next: ActivationStepsMap = { ...EMPTY_ACTIVATION_STATUSES }
  if (!steps || typeof steps !== 'object') return next

  for (const step of ACTIVATION_STEPS) {
    const raw = steps[step.id]
    if (raw === 'empty' || raw === 'partial' || raw === 'review' || raw === 'done' || raw === 'error') {
      next[step.id] = raw
    }
  }

  return next
}
