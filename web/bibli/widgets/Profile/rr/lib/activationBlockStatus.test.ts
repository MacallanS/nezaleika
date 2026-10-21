import { describe, expect, it } from 'vitest'
import {
  activationBlockStatusLabel,
  resolveActivationBlockStatus,
  resolveActivationHomeBannerStatus,
} from './activationBlockStatus'
import { EMPTY_ACTIVATION_STATUSES } from './activationSteps'

describe('activationBlockStatus', () => {
  it('returns design labels for each step status', () => {
    expect(resolveActivationBlockStatus('empty')).toEqual({
      label: 'Не заполнено',
      tone: 'empty',
    })
    expect(resolveActivationBlockStatus('partial')).toEqual({
      label: 'Частично заполнено',
      tone: 'partial',
    })
    expect(resolveActivationBlockStatus('review')).toEqual({
      label: 'На проверке',
      tone: 'review',
    })
    expect(resolveActivationBlockStatus('error')).toEqual({
      label: 'Отклонен',
      tone: 'error',
    })
    expect(resolveActivationBlockStatus('done')).toEqual({
      label: 'Принято',
      tone: 'done',
    })
  })

  it('uses support-facing labels for review and done', () => {
    expect(resolveActivationBlockStatus('review', { audience: 'support' })).toEqual({
      label: 'Ждет проверки',
      tone: 'review',
    })
    expect(resolveActivationBlockStatus('done', { audience: 'support' })).toEqual({
      label: 'Принято',
      tone: 'done',
    })
    expect(resolveActivationBlockStatus('error', { audience: 'support' })).toEqual({
      label: 'Отклонено',
      tone: 'error',
    })
  })

  it('returns unavailable label when statuses are unknown', () => {
    expect(
      activationBlockStatusLabel('review', { unavailable: true }),
    ).toBe('Нет информации')
  })

  it('prioritizes remarks over review on home banner', () => {
    expect(
      resolveActivationHomeBannerStatus({
        ...EMPTY_ACTIVATION_STATUSES,
        personal: 'review',
        passport: 'error',
        inn: 'review',
        snils: 'review',
        bank: 'review',
        'agent-type': 'review',
      }),
    ).toEqual({
      kind: 'badge',
      label: 'Внести правки',
      tone: 'error',
    })
  })

  it('asks to start onboarding when nothing is filled yet', () => {
    expect(resolveActivationHomeBannerStatus(EMPTY_ACTIVATION_STATUSES)).toEqual({
      kind: 'link',
      label: 'Начать оформление',
    })
  })

  it('shows progress when a step is only partially filled', () => {
    expect(
      resolveActivationHomeBannerStatus({
        ...EMPTY_ACTIVATION_STATUSES,
        personal: 'partial',
      }),
    ).toEqual({
      kind: 'progress',
      label: '0 из 5',
      completed: 0,
      total: 5,
    })
  })

  it('asks to activate profile when trial access ended', () => {
    expect(
      resolveActivationHomeBannerStatus(EMPTY_ACTIVATION_STATUSES, { trialDaysLeft: 0 }),
    ).toEqual({
      kind: 'link',
      label: 'Активируйте профиль',
    })
  })

  it('shows accepted badge when all activation steps are done', () => {
    expect(
      resolveActivationHomeBannerStatus({
        personal: 'done',
        passport: 'done',
        inn: 'done',
        snils: 'done',
        bank: 'done',
        'agent-type': 'done',
      }),
    ).toEqual({
      kind: 'badge',
      label: 'Принято',
      tone: 'done',
    })
  })

  it('shows review badge only while steps are on review', () => {
    expect(
      resolveActivationHomeBannerStatus({
        personal: 'review',
        passport: 'review',
        inn: 'review',
        snils: 'review',
        bank: 'review',
        'agent-type': 'review',
      }),
    ).toEqual({
      kind: 'badge',
      label: 'На проверке',
      tone: 'review',
    })
  })

  it('shows progress when progress steps are done but agent-type is empty', () => {
    expect(
      resolveActivationHomeBannerStatus({
        personal: 'done',
        passport: 'done',
        inn: 'done',
        snils: 'done',
        bank: 'done',
        'agent-type': 'empty',
      }),
    ).toEqual({
      kind: 'progress',
      label: '5 из 5',
      completed: 5,
      total: 5,
    })
  })
})
