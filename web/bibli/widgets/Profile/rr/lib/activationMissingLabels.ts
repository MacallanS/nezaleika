import {
  ACTIVATION_STEPS,
  type ActivationStepId,
  type ActivationStepStatus,
  type ActivationStepsMap,
  normalizeActivationSteps,
} from './activationSteps'

const STEP_TITLE_BY_ID = Object.fromEntries(
  ACTIVATION_STEPS.map((step) => [step.id, step.title]),
) as Record<ActivationStepId, string>

type ActivationPayload = {
  steps?: Partial<Record<string, string>>
  missing?: Partial<Record<string, string[]>>
  missing_labels?: string[]
}

function isPresent(value: unknown): boolean {
  if (value == null) return false
  if (typeof value === 'string') return value.trim() !== ''
  return true
}

function isStepIncomplete(status: ActivationStepStatus): boolean {
  return status === 'empty' || status === 'partial'
}

/** Fallback для старого API без activation.missing — зеркало ProfileActivationStatusResolver. */
export function resolveActivationMissingLabelsFromUser(user: Record<string, unknown> | null | undefined): string[] {
  if (!user) return []

  const steps = normalizeActivationSteps(
    (user.activation as ActivationPayload | undefined)?.steps as Partial<ActivationStepsMap> | undefined,
  )
  const data = (user.data as Record<string, unknown> | undefined) ?? {}
  const labels: string[] = []

  const pushStep = (stepId: ActivationStepId, items: string[]) => {
    if (!isStepIncomplete(steps[stepId]) || items.length === 0) return
    labels.push(...items)
  }

  if (isStepIncomplete(steps.personal)) {
    const personal: string[] = []
    if (!isPresent(user.surname)) personal.push('Фамилия не указана')
    if (!isPresent(user.name)) personal.push('Имя не указано')
    if (!isPresent(user.phone)) personal.push('Телефон не указан')
    if (!isPresent(user.email)) personal.push('Email не указан')
    if (user.gender !== 'm' && user.gender !== 'f') {
      personal.push('Пол не указан — заполняет агент в своём профиле')
    }
    if (!isPresent(data.birthday)) personal.push('Дата рождения не указана')
    if (!isPresent(data.file_agent_with_passport)) personal.push('Фото с паспортом не загружено')
    if (data.personal_confirmed_at == null) {
      personal.push('Агент не подтвердил личные данные в профиле (кнопка «Отправить на проверку»)')
    }
    pushStep('personal', personal)
  }

  if (isStepIncomplete(steps.passport)) {
    const passportDigits = String(data.passport ?? '').replace(/\D/g, '')
    const codeDigits = String(data.passport_code ?? '').replace(/\D/g, '')
    const passport: string[] = []
    if (passportDigits.length !== 10) passport.push('Серия и номер паспорта не указаны или указаны неверно')
    if (!isPresent(data.passport_issued)) passport.push('Не указано, кем выдан паспорт')
    if (!isPresent(data.passport_date)) passport.push('Не указана дата выдачи паспорта')
    if (codeDigits.length !== 6) passport.push('Код подразделения не указан или указан неверно')
    if (!isPresent(data.birthday_place)) passport.push('Место рождения не указано')
    if (!isPresent(data.registration_address)) passport.push('Адрес регистрации не указан')
    if (!isPresent(data.file_passport)) passport.push('Скан паспорта не загружен')
    if (!isPresent(data.file_passport_registration)) passport.push('Скан регистрации в паспорте не загружен')
    if (data.passport_confirmed_at == null) {
      passport.push('Агент не подтвердил паспорт в профиле (кнопка «Отправить на проверку»)')
    }
    pushStep('passport', passport)
  }

  if (isStepIncomplete(steps.inn)) {
    const innDigits = String(data.inn ?? '').replace(/\D/g, '')
    const inn: string[] = []
    if (innDigits.length !== 10 && innDigits.length !== 12) inn.push('ИНН не указан или указан неверно')
    if (!isPresent(data.file_inn)) inn.push('Скан ИНН не загружен')
    if (data.inn_confirmed_at == null) {
      inn.push('Агент не подтвердил ИНН в профиле (кнопка «Отправить на проверку»)')
    }
    pushStep('inn', inn)
  }

  if (isStepIncomplete(steps.snils)) {
    const snilsDigits = String(data.snils ?? '').replace(/\D/g, '')
    const snils: string[] = []
    if (snilsDigits.length !== 11) snils.push('СНИЛС не указан или указан неверно')
    if (!isPresent(data.file_snils)) snils.push('Скан СНИЛС не загружен')
    if (data.snils_confirmed_at == null) {
      snils.push('Агент не подтвердил СНИЛС в профиле (кнопка «Отправить на проверку»)')
    }
    pushStep('snils', snils)
  }

  if (isStepIncomplete(steps.bank)) {
    const bank: string[] = []
    if (!isPresent(data.bank_account)) bank.push('Расчётный счёт не указан')
    if (!isPresent(data.bank_bik)) bank.push('БИК банка не указан')
    if (!isPresent(data.bank_name)) bank.push('Название банка не указано')
    if (!isPresent(data.file_banking_details)) bank.push('Скан банковских реквизитов не загружен')
    if (data.bank_confirmed_at == null) {
      bank.push('Агент не подтвердил банковские реквизиты в профиле (кнопка «Отправить на проверку»)')
    }
    pushStep('bank', bank)
  }

  if (isStepIncomplete(steps['agent-type'])) {
    pushStep('agent-type', [`${STEP_TITLE_BY_ID['agent-type']} не заполнен`])
  }

  return labels
}

/** Список конкретных незаполненных пунктов для саппорта. */
export function formatActivationMissingLabels(
  activation: ActivationPayload | null | undefined,
  user?: Record<string, unknown> | null,
): string[] {
  const fromApi = activation?.missing_labels
  if (Array.isArray(fromApi) && fromApi.length > 0) {
    return fromApi.filter((item) => typeof item === 'string' && item.trim() !== '')
  }

  const fromGrouped = activation?.missing
  if (fromGrouped && typeof fromGrouped === 'object') {
    const labels: string[] = []
    for (const step of ACTIVATION_STEPS) {
      const items = fromGrouped[step.id]
      if (Array.isArray(items)) {
        items.forEach((item) => {
          if (typeof item === 'string' && item.trim() !== '') labels.push(item)
        })
      }
    }
    if (labels.length > 0) return labels
  }

  if (user) {
    const fallback = resolveActivationMissingLabelsFromUser(user)
    if (fallback.length > 0) return fallback
  }

  const steps = normalizeActivationSteps(activation?.steps as Partial<ActivationStepsMap> | undefined)
  return ACTIVATION_STEPS.filter(
    (step) => steps[step.id] === 'empty' || steps[step.id] === 'partial',
  ).map(
    (step) => `${step.title} (агент) — не заполнено`,
  )
}
