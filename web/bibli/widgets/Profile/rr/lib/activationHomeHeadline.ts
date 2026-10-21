import {
  ACTIVATION_STEPS,
  type ActivationStepsMap,
} from './activationSteps'

export type ActivationHomeHeadlineKind = 'fill' | 'review' | 'error' | 'done'

export interface ActivationHomeHeadline {
  kind: ActivationHomeHeadlineKind
  title: string
  subtitle: string | null
}

export interface ActivationHomeHeadlineOptions {
  /** Дней тестового доступа; `0` — закончился; `null`/`undefined` — неизвестно. */
  trialDaysLeft?: number | null
}

function sectionsWord(count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'разделе'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'разделах'
  return 'разделах'
}

export function trialDaysWord(days: number): string {
  const mod10 = days % 10
  const mod100 = days % 100
  if (mod10 === 1 && mod100 !== 11) return 'день'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня'
  return 'дней'
}

function progressCompletedCount(steps: ActivationStepsMap): number {
  return ACTIVATION_STEPS.filter(
    (step) =>
      step.countsTowardProgress
      && (steps[step.id] === 'done' || steps[step.id] === 'review'),
  ).length
}

/**
 * Заголовок статуса документов на главной:
 * заполнение → на проверке → замечания.
 * И для NEW_USER (candy-хаб), и для агента на сменах (баннер).
 */
export function resolveActivationHomeHeadline(
  steps: ActivationStepsMap,
  options: ActivationHomeHeadlineOptions = {},
): ActivationHomeHeadline {
  const errorCount = ACTIVATION_STEPS.filter((step) => steps[step.id] === 'error').length
  if (errorCount > 0) {
    return {
      kind: 'error',
      title: 'Документы отклонены',
      subtitle: `Мы нашли замечания в ${errorCount} ${sectionsWord(errorCount)}. Исправьте и отправьте повторно`,
    }
  }

  const progressSteps = ACTIVATION_STEPS.filter((step) => step.countsTowardProgress)
  const allDone = progressSteps.every((step) => steps[step.id] === 'done')
  if (allDone) {
    return {
      kind: 'done',
      title: 'Документы приняты',
      subtitle: 'Полный доступ скоро станет доступен',
    }
  }

  const allSubmitted = progressSteps.every(
    (step) => steps[step.id] === 'review' || steps[step.id] === 'done',
  )
  const anyReview = progressSteps.some((step) => steps[step.id] === 'review')
  if (allSubmitted && anyReview) {
    return {
      kind: 'review',
      title: 'Документы на проверке',
      subtitle: 'Все данные отправлены. Сообщим, когда проверка завершится',
    }
  }

  const completed = progressCompletedCount(steps)
  const anyPartial = ACTIVATION_STEPS.some((step) => steps[step.id] === 'partial')
  const rawDays = options.trialDaysLeft
  const days = rawDays == null ? null : Number(rawDays)
  const hasDays = days != null && Number.isFinite(days) && days >= 0
  const trialEnded = hasDays && days === 0

  if (trialEnded) {
    return {
      kind: 'fill',
      title: 'Тестовый доступ закончился',
      subtitle: 'Завершите оформление, чтобы продолжить работу',
    }
  }

  if (completed > 0 || anyPartial) {
    return {
      kind: 'fill',
      title: 'Завершите оформление',
      subtitle: hasDays
        ? `Осталось ${days} ${trialDaysWord(days)} тестового доступа. Заполнение займёт около 15 минут`
        : 'Заполнение займёт около 15 минут',
    }
  }

  if (hasDays) {
    return {
      kind: 'fill',
      title: 'Активируйте профиль',
      subtitle: `Осталось ${days} ${trialDaysWord(days)} тестового доступа. Заполнение займёт ~15 минут`,
    }
  }

  return {
    kind: 'fill',
    title: 'Активируйте профиль',
    subtitle: 'Завершите оформление, чтобы продолжить работу',
  }
}
