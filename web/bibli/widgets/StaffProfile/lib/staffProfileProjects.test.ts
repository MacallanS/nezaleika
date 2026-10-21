import { describe, expect, it } from 'vitest'
import {
  EMPTY_ACTIVATION_STATUSES,
} from 'bibli/widgets/Profile/rr/lib/activationSteps'
import type { StaffProfileModel } from '../composables/useStaffProfile'
import {
  buildStaffProjectsView,
  formatStaffJoinedLabel,
  formatStaffTraineeEndedLabel,
  formatStaffTraineeUntilLabel,
  resolveOnecResyncLabel,
} from './staffProfileProjects'

function makeProfile(): StaffProfileModel {
  return {
    id: 1,
    fullName: 'Тест',
    initials: 'Т',
    phone: null,
    email: null,
    telegram_username: null,
    locationLabel: '',
    systemStatus: { id: 'filling', name: 'Заполнение' },
    onecSyncStatus: null,
    activationSteps: { ...EMPTY_ACTIVATION_STATUSES },
    activationComplete: false,
    onSigning: false,
    activationRejections: {},
    passport: null,
    attached: null,
    registration: null,
    rawRegistration: null,
    rawStaffDetails: null,
  }
}

describe('formatStaffJoinedLabel', () => {
  it('formats russian date with time', () => {
    const label = formatStaffJoinedLabel('2026-07-20T10:02:00+03:00')
    expect(label).toMatch(/20 июля 2026, 10:02/)
  })

  it('returns dash for empty', () => {
    expect(formatStaffJoinedLabel(null)).toBe('—')
    expect(formatStaffJoinedLabel('')).toBe('—')
  })
})

describe('trainee date labels', () => {
  it('formats until label', () => {
    expect(formatStaffTraineeUntilLabel('2026-08-21T23:59:00+03:00')).toMatch(/до 21\.08 23:59/)
  })

  it('formats ended label', () => {
    expect(formatStaffTraineeEndedLabel('2026-08-15T23:59:00+03:00')).toMatch(
      /Доступ закончился 15 августа, 23:59/,
    )
  })
})

describe('project extra count', () => {
  it('shows +N when attached to 2+ projects', () => {
    const profile = makeProfile()
    profile.attached = {
      project: { id: 1, name: 'Магнит' } as never,
      projects: [
        { id: 1, name: 'Магнит' } as never,
        { id: 2, name: 'Яндекс' } as never,
        { id: 3, name: 'Самокат' } as never,
      ],
      point: { id: 10, name: 'Пермь', project_id: 1 } as never,
      points: [
        { id: 10, name: 'Пермь', project_id: 1 } as never,
        { id: 11, name: 'Москва', project_id: 2 } as never,
        { id: 12, name: 'Казань', project_id: 3 } as never,
      ],
    }
    const view = buildStaffProjectsView(profile)
    expect(view.projectExtraCount).toBe(2)
    expect(view.pointName).toBe('Пермь')
  })

  it('prefers project matching attached points over first membership', () => {
    const profile = makeProfile()
    profile.attached = {
      projects: [
        { id: 1, name: 'Старый проект' } as never,
        { id: 2, name: 'Новый проект' } as never,
      ],
      points: [{ id: 20, name: 'Новая точка', project_id: 2 } as never],
    }
    const view = buildStaffProjectsView(profile)
    expect(view.projectName).toBe('Новый проект')
    expect(view.projectId).toBe(2)
    expect(view.pointName).toBe('Новая точка')
  })

  it('keeps referral separate from attached project card', () => {
    const profile = makeProfile()
    profile.attached = {
      project: { id: 1, name: 'Магнит' } as never,
      projects: [{ id: 1, name: 'Магнит' } as never],
      point: { id: 10, name: 'Пермь', address: 'ул. Ленина', project_id: 1 } as never,
      points: [{ id: 10, name: 'Пермь', address: 'ул. Ленина', project_id: 1 } as never],
    }
    profile.rawRegistration = {
      referal: {
        id: 99,
        name: 'Домодедово',
        project: { id: 2, name: 'Яндекс ПЭЙ' },
        project_id: 2,
      },
      invited_by: {
        invited_by_id: 7,
        invited_by_name: 'Иванов Иван',
      },
    }
    const view = buildStaffProjectsView(profile)
    expect(view.projectName).toBe('Магнит')
    expect(view.projectId).toBe(1)
    expect(view.pointName).toBe('Пермь')
    expect(view.pointId).toBe(10)
    expect(view.points).toHaveLength(1)
    expect(view.referalProjectName).toBe('Яндекс ПЭЙ')
    expect(view.referalPointName).toBe('Домодедово')
    expect(view.referalProjectId).toBe(2)
    expect(view.referalPointId).toBe(99)
    expect(view.linkCreatedBy).toBe('Иванов Иван')
  })
})

describe('resolveOnecResyncLabel', () => {
  it('maps sync statuses to action labels', () => {
    expect(resolveOnecResyncLabel('needs_resync')).toBe('Выгрузить в 1С')
    expect(resolveOnecResyncLabel(null)).toBe('Синхронизировать с 1С')
    expect(resolveOnecResyncLabel('failed_onec')).toBe('Синхронизировать с 1С')
    expect(resolveOnecResyncLabel('success')).toBe('Повторить синхронизацию с 1С')
    expect(resolveOnecResyncLabel('pending')).toBe('Повторить синхронизацию с 1С')
  })
})

describe('onec resync label on projects view', () => {
  it('exposes dynamic label and canResync gate', () => {
    const profile = makeProfile()
    profile.onSigning = true
    profile.activationComplete = true
    profile.rawRegistration = {
      onec_sync_status: { status: 'needs_resync', error_message: 'Данные изменены' },
    }
    const view = buildStaffProjectsView(profile)
    expect(view.canResyncOnec).toBe(true)
    expect(view.onecResyncLabel).toBe('Выгрузить в 1С')
    expect(view.onecReason).toBe('Данные изменены')
  })

  it('allows resync for hired agent not on signing', () => {
    const profile = makeProfile()
    profile.onSigning = false
    profile.activationComplete = true
    profile.rawStaffDetails = {
      data: { role_id: 3 },
    } as StaffProfileModel['rawStaffDetails']
    expect(buildStaffProjectsView(profile).canResyncOnec).toBe(true)
  })

  it('allows hire permanent on signing only after 1C success', () => {
    const profile = makeProfile()
    profile.onSigning = true
    expect(buildStaffProjectsView(profile).canHirePermanent).toBe(false)

    profile.rawRegistration = {
      onec_sync_status: { status: 'success' },
    }
    expect(buildStaffProjectsView(profile).canHirePermanent).toBe(true)

    profile.onSigning = false
    expect(buildStaffProjectsView(profile).canHirePermanent).toBe(false)
  })
})
