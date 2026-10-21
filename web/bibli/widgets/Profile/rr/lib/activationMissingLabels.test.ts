import { describe, expect, it } from 'vitest'
import { formatActivationMissingLabels, resolveActivationMissingLabelsFromUser } from './activationMissingLabels'

describe('activationMissingLabels', () => {
  it('uses missing_labels from API when present', () => {
    const labels = formatActivationMissingLabels({
      steps: { personal: 'empty' },
      missing_labels: ['Пол не указан — заполняет агент в своём профиле'],
    })

    expect(labels).toEqual(['Пол не указан — заполняет агент в своём профиле'])
  })

  it('flattens missing grouped by step', () => {
    const labels = formatActivationMissingLabels({
      steps: { personal: 'empty', passport: 'review' },
      missing: {
        personal: ['Email не указан', 'Агент не подтвердил личные данные в профиле (кнопка «Отправить на проверку»)'],
      },
    })

    expect(labels).toEqual([
      'Email не указан',
      'Агент не подтвердил личные данные в профиле (кнопка «Отправить на проверку»)',
    ])
  })

  it('resolves personal details from user when API has no missing payload', () => {
    const labels = resolveActivationMissingLabelsFromUser({
      gender: null,
      name: 'Иван',
      surname: 'Иванов',
      phone: '79001234567',
      email: 'a@b.ru',
      activation: { steps: { personal: 'empty' } },
      data: {
        birthday: '1990-01-01',
        file_agent_with_passport: 'file-id',
        personal_confirmed_at: null,
      },
    })

    expect(labels).toContain('Пол не указан — заполняет агент в своём профиле')
    expect(labels).toContain(
      'Агент не подтвердил личные данные в профиле (кнопка «Отправить на проверку»)',
    )
  })
})
