import { describe, expect, it } from 'vitest'
import { buildStaffOnecView, formatOnecUpdatedAt } from './staffProfileOnec'
import type { StaffProfileModel } from '../composables/useStaffProfile'

function baseProfile(overrides: Partial<StaffProfileModel> = {}): StaffProfileModel {
  return {
    id: 1,
    fullName: 'Test User',
    initials: 'TU',
    phone: null,
    email: null,
    telegram_username: null,
    locationLabel: '—',
    systemStatus: null,
    onecSyncStatus: null,
    activationSteps: {
      personal: 'empty',
      passport: 'empty',
      inn: 'empty',
      snils: 'empty',
      bank: 'empty',
      'agent-type': 'empty',
    },
    activationComplete: false,
    onSigning: false,
    activationRejections: {},
    passport: null,
    attached: null,
    registration: null,
    rawRegistration: null,
    rawStaffDetails: null,
    ...overrides,
  }
}

describe('formatOnecUpdatedAt', () => {
  it('formats date without time', () => {
    expect(formatOnecUpdatedAt('2026-08-19T12:00:00.000Z')).toMatch(/августа 2026/)
  })

  it('returns dash for empty', () => {
    expect(formatOnecUpdatedAt(null)).toBe('—')
    expect(formatOnecUpdatedAt('')).toBe('—')
  })
})

describe('buildStaffOnecView', () => {
  it('empty sync: not sent message and label', () => {
    const view = buildStaffOnecView(
      baseProfile({
        rawRegistration: {},
        onSigning: true,
        activationComplete: true,
      }),
    )
    expect(view.status).toBeNull()
    expect(view.statusLabel).toBe('Не отправлен')
    expect(view.message).toBe('Данные агента ещё не передавались в 1С')
    expect(view.canSend).toBe(true)
    expect(view.updatedAtLabel).toBe('—')
    expect(view.attempts).toBe('—')
  })

  it('success status', () => {
    const view = buildStaffOnecView(
      baseProfile({
        onSigning: true,
        activationComplete: true,
        rawRegistration: {
          onec_sync_status: {
            status: 'success',
            attempts: 2,
            synced_at: '2026-08-19T10:00:00+03:00',
          },
        },
      }),
    )
    expect(view.status).toBe('success')
    expect(view.statusLabel).toBe('Успешно')
    expect(view.attempts).toBe('2')
    expect(view.message).toBe('Данные агента успешно переданы в 1С')
    expect(view.updatedAtLabel).toMatch(/19 августа 2026/)
  })

  it('failed status uses error message', () => {
    const view = buildStaffOnecView(
      baseProfile({
        onSigning: true,
        activationComplete: true,
        rawRegistration: {
          onec_sync_status: {
            status: 'failed_onec',
            error_message: 'ИНН не проходит проверку контрольной суммы',
            attempts: 1,
          },
        },
      }),
    )
    expect(view.statusLabel).toBe('Ошибка 1С')
    expect(view.message).toContain('ИНН')
    expect(view.attempts).toBe('1')
  })

  it('cannot send when not on signing and not agent', () => {
    const view = buildStaffOnecView(
      baseProfile({
        onSigning: false,
        activationComplete: true,
        rawRegistration: {},
      }),
    )
    expect(view.canSend).toBe(false)
  })

  it('can send for hired agent even when not on signing', () => {
    const view = buildStaffOnecView(
      baseProfile({
        onSigning: false,
        activationComplete: true,
        rawStaffDetails: {
          data: { role_id: 3 },
        } as StaffProfileModel['rawStaffDetails'],
        rawRegistration: {},
      }),
    )
    expect(view.canSend).toBe(true)
  })
})
