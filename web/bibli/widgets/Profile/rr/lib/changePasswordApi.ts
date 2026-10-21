import { profileAuthFetch } from './profileAuthFetch'

export type ChangePasswordResult =
  | { ok: true; message: string }
  | { ok: false; message: string }

export type PasswordChangeOptions = {
  has_password: boolean
  phone_masked: string | null
  has_phone: boolean
}

export type PasswordChangeFactor = 'password' | 'biometric' | 'sms'

function messageFromBody(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback
  const data = (body as { data?: unknown; message?: unknown; errors?: unknown }).data
  if (typeof data === 'string' && data.trim()) return data
  const message = (body as { message?: unknown }).message
  if (typeof message === 'string' && message.trim()) return message
  const errors = (body as { errors?: Record<string, string[] | string> }).errors
  if (errors && typeof errors === 'object') {
    const first = Object.values(errors).flat()[0]
    if (typeof first === 'string' && first.trim()) return first
  }
  return fallback
}

export async function fetchPasswordChangeOptions(): Promise<PasswordChangeOptions | null> {
  try {
    const response = await profileAuthFetch('/api/user/password/options')
    const body = (await response.json()) as { status?: boolean; data?: PasswordChangeOptions }
    if (response.ok && body?.status && body.data) return body.data
  } catch {
    // ignore
  }
  return null
}

export async function sendPasswordChangeOtp(): Promise<ChangePasswordResult & { phoneMasked?: string | null }> {
  try {
    const response = await profileAuthFetch('/api/user/password/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const body = await response.json()
    if (response.ok && (body as { status?: boolean }).status !== false) {
      const data = (body as { data?: { phone_masked?: string | null } }).data
      return {
        ok: true,
        message: messageFromBody(body, 'Код отправлен'),
        phoneMasked: data?.phone_masked ?? null,
      }
    }
    return { ok: false, message: messageFromBody(body, 'Не удалось отправить код') }
  } catch {
    return { ok: false, message: 'Не удалось отправить код' }
  }
}

/** PUT /api/user/password — смена пароля с step-up factor. */
export async function changeUserPassword(payload: {
  factor: PasswordChangeFactor
  oldPassword?: string
  credential?: Record<string, unknown>
  code?: string
  newPassword: string
  newPasswordConfirmation: string
  rpId?: string
}): Promise<ChangePasswordResult> {
  try {
    const response = await profileAuthFetch('/api/user/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        factor: payload.factor,
        old_password: payload.oldPassword,
        credential: payload.credential,
        code: payload.code,
        new_password: payload.newPassword,
        new_password_confirmation: payload.newPasswordConfirmation,
        rp_id: payload.rpId,
      }),
    })

    let body: unknown = null
    try {
      body = await response.json()
    } catch {
      body = null
    }

    const statusOk =
      response.ok &&
      (body == null ||
        typeof body !== 'object' ||
        (body as { status?: boolean }).status !== false)

    if (statusOk) {
      return {
        ok: true,
        message: messageFromBody(body, 'Пароль успешно изменён'),
      }
    }

    return {
      ok: false,
      message: messageFromBody(body, 'Не удалось изменить пароль'),
    }
  } catch {
    return { ok: false, message: 'Не удалось изменить пароль' }
  }
}
