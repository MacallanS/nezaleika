import type { ProfileNavigate } from '../../types'
import {
  ACTIVATION_STEPS,
  type ActivationStepId,
  type ActivationStepStatus,
  type ActivationStepsMap,
  isActivationStepLocked,
  shouldOpenActivationWizardAtEnd,
} from './activationSteps'
import { rememberActivationReturnPath } from './activationReturnPath'
import {
  AGENT_TYPE_IE,
  AGENT_TYPE_SELF_EMPLOYED,
  agentTypeChoicePath,
  IE_WIZARD_TOTAL,
  SE_WIZARD_TOTAL,
  ieWizardPath,
  seWizardPath,
} from './agentTypeWizard'
import { bankWizardPath, BANK_WIZARD_TOTAL } from './bankWizard'
import { innWizardPath, INN_WIZARD_TOTAL } from './innWizard'
import { passportWizardPath, PASSPORT_WIZARD_TOTAL } from './passportWizard'
import { personalWizardPath, PERSONAL_WIZARD_TOTAL } from './personalWizard'
import { snilsWizardPath, SNILS_WIZARD_TOTAL } from './snilsWizard'

export interface OpenActivationStepOptions {
  navigateTo: ProfileNavigate
  stepStatuses: ActivationStepsMap
  /** account_type из API — нужен для locked agent-type → СЗ/ИП review */
  accountType?: number | null
  unavailable?: boolean
  /** Откуда открыли хаб; по умолчанию — текущий pathname */
  returnPath?: string | null
}

const ACTIVATION_PATH_STEP_IDS: ActivationStepId[] = [
  'personal',
  'passport',
  'inn',
  'snils',
  'bank',
  'agent-type',
]

/** `/profile/passport`, `/profile/passport/1`, `/profile/agent-type/ie/3` → step id. */
export function resolveActivationStepIdFromPath(
  path: string | null | undefined,
): ActivationStepId | null {
  const normalized = String(path || '')
    .split('?')[0]
    .replace(/\/+$/, '') || '/'
  for (const stepId of ACTIVATION_PATH_STEP_IDS) {
    const prefix = `/profile/${stepId}`
    if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
      return stepId
    }
  }
  return null
}

/** Открывает визард шага активации (хаб на главной или /profile). */
export function openActivationStep(
  stepId: ActivationStepId,
  options: OpenActivationStepOptions,
): void {
  if (options.unavailable) return

  // Откуда открыли — строго туда же вернёмся с «Назад» (особенно при отклонении).
  rememberActivationReturnPath(options.returnPath)

  const status = options.stepStatuses[stepId] as ActivationStepStatus
  const openAtEnd = shouldOpenActivationWizardAtEnd(status)
  const navigateTo = options.navigateTo

  if (stepId === 'personal') {
    void navigateTo(personalWizardPath(openAtEnd ? PERSONAL_WIZARD_TOTAL : 1))
    return
  }
  if (stepId === 'passport') {
    void navigateTo(passportWizardPath(openAtEnd ? PASSPORT_WIZARD_TOTAL : 1))
    return
  }
  if (stepId === 'inn') {
    void navigateTo(innWizardPath(openAtEnd ? INN_WIZARD_TOTAL : 1))
    return
  }
  if (stepId === 'snils') {
    void navigateTo(snilsWizardPath(openAtEnd ? SNILS_WIZARD_TOTAL : 1))
    return
  }
  if (stepId === 'bank') {
    void navigateTo(bankWizardPath(openAtEnd ? BANK_WIZARD_TOTAL : 1))
    return
  }
  if (stepId === 'agent-type') {
    // После отклонения — снова выбор ИП/СЗ; финальный шаг только при review/done.
    if (isActivationStepLocked(status)) {
      if (options.accountType === AGENT_TYPE_SELF_EMPLOYED) {
        void navigateTo(seWizardPath(SE_WIZARD_TOTAL))
        return
      }
      if (options.accountType === AGENT_TYPE_IE) {
        void navigateTo(ieWizardPath(IE_WIZARD_TOTAL))
        return
      }
      console.warn('[profile-activation] agent-type locked without account_type')
      return
    }
    void navigateTo(agentTypeChoicePath())
    return
  }

  console.info('[profile-activation] open step', stepId)
}

/** Порядок карточек на главной (как в макете Agent). */
export const HOME_ACTIVATION_STEP_ORDER: ActivationStepId[] = [
  'personal',
  'passport',
  'snils',
  'inn',
  'bank',
  'agent-type',
]

export function homeActivationSteps() {
  const byId = Object.fromEntries(ACTIVATION_STEPS.map((step) => [step.id, step]))
  return HOME_ACTIVATION_STEP_ORDER.map((id) => byId[id]).filter(Boolean)
}
