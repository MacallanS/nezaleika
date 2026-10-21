import { describe, expect, it } from 'vitest'
import {
  EMPTY_ACTIVATION_STATUSES,
  type ActivationStepsMap,
} from 'bibli/widgets/Profile/rr/lib/activationSteps'
import type { StaffProfileModel } from '../composables/useStaffProfile'
import {
  buildStaffOverviewAllClearMessage,
  buildStaffOverviewAttention,
  buildStaffOverviewSummary,
  canMoveStaffToSigning,
  canHireStaffPermanent,
  resolveOnecMetric,
  resolveStaffOverviewDisplayName,
  resolveTraineeMetric,
  selectOverviewHistoryPreview,
} from './staffProfileOverview'

function makeProfile(steps: ActivationStepsMap): StaffProfileModel {
  return {
    id: 1,
    fullName: 'Тест',
    initials: 'Т',
    phone: null,
    email: null,
    telegram_username: null,
    locationLabel: '',
    systemStatus: { id: 'filling', label: 'Заполнение' },
    onecSyncStatus: null,
    activationSteps: steps,
    activationComplete: false,
    onSigning: false,
    activationRejections: {},
    passport: null,
    attached: { project: { id: 1, name: 'Demo' } as never, projects: [{ id: 1, name: 'Demo' } as never] },
    registration: null,
    rawRegistration: null,
    rawStaffDetails: null,
  }
}

describe('staffProfileOverview', () => {
  it('counts empty/review/error docs and projects', () => {
    const steps: ActivationStepsMap = {
      ...EMPTY_ACTIVATION_STATUSES,
      personal: 'empty',
      passport: 'review',
      inn: 'error',
      snils: 'done',
      bank: 'done',
      'agent-type': 'empty',
    }
    const cards = buildStaffOverviewSummary(makeProfile(steps))
    expect(cards[0]).toMatchObject({
      id: 'documents',
      value: '4',
      metrics: [
        { label: 'Не загружено', value: '1', tone: 'warning' },
        { label: 'Требуют проверки', value: '1', tone: 'warning' },
        { label: 'Отклонено', value: '1', tone: 'danger' },
      ],
    })
    expect(cards[1]).toMatchObject({
      id: 'projects',
      title: 'Проект',
      value: 'Demo',
    })
    expect(cards[2]).toMatchObject({
      id: 'other',
      value: 'В разработке',
      metrics: [
        { label: 'Не загружено', value: '1', tone: 'warning' },
        { label: 'Требуют проверки', value: '0', tone: 'muted' },
        { label: 'Отклонено', value: '0', tone: 'muted' },
      ],
    })
  })

  it('counts rejected agent-type in other documents', () => {
    const steps: ActivationStepsMap = {
      ...EMPTY_ACTIVATION_STATUSES,
      personal: 'done',
      passport: 'done',
      inn: 'done',
      snils: 'done',
      bank: 'done',
      'agent-type': 'error',
    }
    const cards = buildStaffOverviewSummary(makeProfile(steps))
    expect(cards[0].value).toBe('Все приняты')
    expect(cards[2]).toMatchObject({
      id: 'other',
      value: 'В разработке',
      metrics: [
        { label: 'Не загружено', value: '0', tone: 'muted' },
        { label: 'Требуют проверки', value: '0', tone: 'muted' },
        { label: 'Отклонено', value: '1', tone: 'danger' },
      ],
    })
  })

  it('shows all-accepted documents only when every doc step is done, even on signing', () => {
    const incomplete = makeProfile({ ...EMPTY_ACTIVATION_STATUSES })
    incomplete.onSigning = true
    incomplete.attached = {
      project: { id: 2, name: 'ВБ Аэропорты' } as never,
      projects: [{ id: 2, name: 'ВБ Аэропорты' } as never],
    }
    const incompleteCards = buildStaffOverviewSummary(incomplete)
    expect(incompleteCards[0].value).toBe('0')
    expect(incompleteCards[1]).toMatchObject({ title: 'Проект', value: 'ВБ Аэропорты' })
    expect(incompleteCards[2].value).toBe('В разработке')

    const accepted = makeProfile({
      ...EMPTY_ACTIVATION_STATUSES,
      personal: 'done',
      passport: 'done',
      inn: 'done',
      snils: 'done',
      bank: 'done',
    })
    accepted.onSigning = true
    expect(buildStaffOverviewSummary(accepted)[0].value).toBe('Все приняты')
  })
  it('maps trainee and 1C statuses for projects card', () => {
    const base = makeProfile({ ...EMPTY_ACTIVATION_STATUSES })

    expect(resolveTraineeMetric(base)).toMatchObject({
      label: 'Тестовый период',
      value: 'Нет',
      tone: 'muted',
    })
    expect(resolveOnecMetric(base)).toMatchObject({
      label: 'Синхронизация 1С',
      value: 'Нет',
      tone: 'muted',
    })

    base.rawRegistration = {
      trainee: { active: true, expires_at: '2026-08-27T12:00:00Z' },
    }
    expect(resolveTraineeMetric(base)).toMatchObject({
      value: 'до 27.08',
      tone: 'success',
    })

    base.rawRegistration = {
      trainee: { active: false, was_trainee: true },
    }
    expect(resolveTraineeMetric(base)).toMatchObject({
      value: 'Завершён',
      tone: 'muted',
    })

    const cases: Array<[string, string, string]> = [
      ['pending', 'В очереди', 'warning'],
      ['success', 'Успешно', 'success'],
      ['needs_resync', 'Нужна выгрузка', 'warning'],
      ['skipped_not_smz', 'Не выгружается', 'muted'],
      ['failed_validation', 'Ошибка данных', 'danger'],
      ['failed_transport', 'Ошибка сети', 'danger'],
      ['failed_onec', 'Ошибка 1С', 'danger'],
    ]
    for (const [status, value, tone] of cases) {
      base.onecSyncStatus = status
      expect(resolveOnecMetric(base)).toMatchObject({ value, tone })
    }
  })

  it('lists unfinished steps for attention with support labels', () => {
    const steps: ActivationStepsMap = {
      ...EMPTY_ACTIVATION_STATUSES,
      passport: 'review',
      personal: 'empty',
      inn: 'error',
      snils: 'done',
      bank: 'done',
      'agent-type': 'done',
    }
    const items = buildStaffOverviewAttention(steps)
    expect(items.map((i) => i.id)).toEqual(['passport', 'inn', 'personal'])
    expect(items[0]).toMatchObject({
      statusLabel: 'Ждет проверки',
      tone: 'review',
      showNotify: false,
    })
    expect(items[1]).toMatchObject({
      statusLabel: 'Отклонено',
      tone: 'error',
      showNotify: true,
    })
    expect(items[2]).toMatchObject({
      statusLabel: 'Не заполнено',
      tone: 'empty',
      showNotify: true,
    })
  })

  it('keeps accepted steps out of attention and maps every remaining status', () => {
    const steps: ActivationStepsMap = {
      personal: 'done',
      passport: 'done',
      inn: 'review',
      snils: 'error',
      bank: 'empty',
      'agent-type': 'review',
    }
    const items = buildStaffOverviewAttention(steps)
    expect(items.map((i) => ({ id: i.id, label: i.statusLabel, tone: i.tone, notify: i.showNotify }))).toEqual([
      { id: 'inn', label: 'Ждет проверки', tone: 'review', notify: false },
      { id: 'agent-type', label: 'Ждет проверки', tone: 'review', notify: false },
      { id: 'snils', label: 'Отклонено', tone: 'error', notify: true },
      { id: 'bank', label: 'Не заполнено', tone: 'empty', notify: true },
    ])
    expect(items.some((i) => i.tone === 'done' || i.statusLabel === 'Принято')).toBe(false)
  })

  it('shows empty attention list when every step is accepted', () => {
    const steps: ActivationStepsMap = {
      ...EMPTY_ACTIVATION_STATUSES,
      personal: 'done',
      passport: 'done',
      inn: 'done',
      snils: 'done',
      bank: 'done',
      'agent-type': 'done',
    }
    expect(buildStaffOverviewAttention(steps)).toEqual([])
  })

  it('builds all-clear message with gender-aware registration verb', () => {
    const profile = makeProfile({ ...EMPTY_ACTIVATION_STATUSES })
    profile.fullName = 'Иванов Иван Иванович'
    profile.rawRegistration = { name: 'Иван', gender: 'm' }
    expect(buildStaffOverviewAllClearMessage(profile)).toBe(
      'Иван зарегистрировался и заполняет данные. Действие сейчас не требуется',
    )

    profile.rawRegistration = { name: 'Ева-София', gender: 'f' }
    expect(buildStaffOverviewAllClearMessage(profile)).toBe(
      'Ева-София зарегистрировалась и заполняет данные. Действие сейчас не требуется',
    )

    profile.rawRegistration = null
    profile.fullName = 'Ева-София М.'
    expect(resolveStaffOverviewDisplayName(profile)).toBe('Ева-София')
    expect(buildStaffOverviewAllClearMessage(profile)).toBe(
      'Ева-София заполняет данные. Действие сейчас не требуется',
    )
  })

  it('shows move-to-signing only when every activation step is accepted', () => {
    const profile = makeProfile({ ...EMPTY_ACTIVATION_STATUSES })
    expect(canMoveStaffToSigning(profile)).toBe(false)

    profile.activationComplete = true
    expect(canMoveStaffToSigning(profile)).toBe(false)

    profile.activationSteps = {
      personal: 'done',
      passport: 'done',
      inn: 'done',
      snils: 'done',
      bank: 'done',
      'agent-type': 'done',
    }
    expect(canMoveStaffToSigning(profile)).toBe(true)

    profile.onSigning = true
    expect(canMoveStaffToSigning(profile)).toBe(false)

    profile.onSigning = false
    profile.activationSteps = {
      personal: 'review',
      passport: 'done',
      inn: 'done',
      snils: 'done',
      bank: 'done',
      'agent-type': 'done',
    }
    expect(canMoveStaffToSigning(profile)).toBe(false)

    profile.activationSteps = { ...EMPTY_ACTIVATION_STATUSES }
    profile.activationComplete = false
    profile.rawRegistration = {
      trainee: { active: false, was_trainee: true },
    }
    expect(canMoveStaffToSigning(profile)).toBe(false)
  })

  it('shows hire-permanent only on signing after 1C success', () => {
    const profile = makeProfile({ ...EMPTY_ACTIVATION_STATUSES })
    expect(canHireStaffPermanent(profile)).toBe(false)

    profile.onSigning = true
    expect(canHireStaffPermanent(profile)).toBe(false)

    profile.onecSyncStatus = 'pending'
    expect(canHireStaffPermanent(profile)).toBe(false)

    profile.onecSyncStatus = 'failed_onec'
    expect(canHireStaffPermanent(profile)).toBe(false)

    profile.onecSyncStatus = 'success'
    expect(canHireStaffPermanent(profile)).toBe(true)

    profile.rawRegistration = {
      trainee: { active: true, days_left: 2 },
    }
    expect(canHireStaffPermanent(profile)).toBe(true)

    profile.onecSyncStatus = 'skipped_not_smz'
    expect(canHireStaffPermanent(profile)).toBe(true)

    profile.onSigning = false
    expect(canHireStaffPermanent(profile)).toBe(false)
  })

  it('blocks move-to-signing when any section is empty or rejected', () => {
    const profile = makeProfile({
      personal: 'done',
      passport: 'done',
      inn: 'done',
      snils: 'done',
      bank: 'done',
      'agent-type': 'empty',
    })
    expect(canMoveStaffToSigning(profile)).toBe(false)

    profile.activationSteps = {
      personal: 'done',
      passport: 'done',
      inn: 'done',
      snils: 'done',
      bank: 'error',
      'agent-type': 'done',
    }
    expect(canMoveStaffToSigning(profile)).toBe(false)

    profile.activationSteps = {
      personal: 'done',
      passport: 'done',
      inn: 'done',
      snils: 'done',
      bank: 'review',
      'agent-type': 'done',
    }
    expect(canMoveStaffToSigning(profile)).toBe(false)
  })
})

describe('selectOverviewHistoryPreview', () => {
  it('keeps events in order and does not hide 1C start pairs', () => {
    const items = [
      { id: 7, kind: 'support_onec_start' },
      { id: 6, kind: 'system_onec_result' },
      { id: 5, kind: 'support_onec_start' },
      { id: 4, kind: 'system_onec_result' },
      { id: 3, kind: 'support_onec_start' },
      { id: 2, kind: 'support_accept' },
      { id: 1, kind: 'agent_submit' },
    ]

    expect(selectOverviewHistoryPreview(items, 7).map((i) => i.id)).toEqual([
      7, 6, 5, 4, 3, 2, 1,
    ])
  })

  it('caps preview at limit', () => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      id: 20 - i,
      kind: i % 2 === 0 ? 'support_onec_start' : 'system_onec_result',
    }))

    const preview = selectOverviewHistoryPreview(items, 7)
    expect(preview).toHaveLength(7)
    expect(preview.map((item) => item.id)).toEqual([20, 19, 18, 17, 16, 15, 14])
  })
})
