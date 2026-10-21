import { describe, expect, it } from 'vitest'
import { resolveActivationHomeHeadline } from './activationHomeHeadline'
import { EMPTY_ACTIVATION_STATUSES } from './activationSteps'

describe('resolveActivationHomeHeadline', () => {
  it('asks to activate profile when trial days are unknown', () => {
    expect(resolveActivationHomeHeadline(EMPTY_ACTIVATION_STATUSES)).toEqual({
      kind: 'fill',
      title: 'Активируйте профиль',
      subtitle: 'Завершите оформление, чтобы продолжить работу',
    })
  })

  it('shows remaining trial days when nothing is filled yet', () => {
    expect(
      resolveActivationHomeHeadline(EMPTY_ACTIVATION_STATUSES, { trialDaysLeft: 3 }),
    ).toEqual({
      kind: 'fill',
      title: 'Активируйте профиль',
      subtitle: 'Осталось 3 дня тестового доступа. Заполнение займёт ~15 минут',
    })
  })

  it('shows trial ended copy when days left is zero', () => {
    expect(
      resolveActivationHomeHeadline(EMPTY_ACTIVATION_STATUSES, { trialDaysLeft: 0 }),
    ).toEqual({
      kind: 'fill',
      title: 'Тестовый доступ закончился',
      subtitle: 'Завершите оформление, чтобы продолжить работу',
    })
  })

  it('asks to finish onboarding when some steps are done', () => {
    expect(
      resolveActivationHomeHeadline(
        {
          ...EMPTY_ACTIVATION_STATUSES,
          personal: 'done',
          passport: 'done',
        },
        { trialDaysLeft: 3 },
      ),
    ).toEqual({
      kind: 'fill',
      title: 'Завершите оформление',
      subtitle: 'Осталось 3 дня тестового доступа. Заполнение займёт около 15 минут',
    })
  })

  it('asks to finish onboarding when a step is only partially filled', () => {
    expect(
      resolveActivationHomeHeadline({
        ...EMPTY_ACTIVATION_STATUSES,
        personal: 'partial',
      }),
    ).toEqual({
      kind: 'fill',
      title: 'Завершите оформление',
      subtitle: 'Заполнение займёт около 15 минут',
    })
  })

  it('shows review state when all progress steps are submitted', () => {
    expect(
      resolveActivationHomeHeadline({
        personal: 'review',
        passport: 'review',
        inn: 'done',
        snils: 'review',
        bank: 'review',
        'agent-type': 'empty',
      }),
    ).toEqual({
      kind: 'review',
      title: 'Документы на проверке',
      subtitle: 'Все данные отправлены. Сообщим, когда проверка завершится',
    })
  })

  it('prioritizes remarks and pluralizes sections', () => {
    expect(
      resolveActivationHomeHeadline({
        ...EMPTY_ACTIVATION_STATUSES,
        personal: 'error',
        passport: 'error',
        inn: 'error',
      }),
    ).toEqual({
      kind: 'error',
      title: 'Документы отклонены',
      subtitle: 'Мы нашли замечания в 3 разделах. Исправьте и отправьте повторно',
    })

    expect(
      resolveActivationHomeHeadline({
        ...EMPTY_ACTIVATION_STATUSES,
        personal: 'error',
      }).subtitle,
    ).toBe('Мы нашли замечания в 1 разделе. Исправьте и отправьте повторно')
  })
})
