import { isStandalonePwaClient } from './pwaClient'
import {
  fetchBiometricAssertionOptions,
  fetchBiometricRegistrationOptions,
  registerDeviceUnlockBiometric,
  verifyDeviceUnlockBiometric,
  clientWebAuthnRpId,
  type DeviceUnlockStatus,
} from './deviceUnlockApi'

const STORAGE_KEY = 'profile_biometric_login_enabled'
const CREDENTIAL_KEY = 'profile_biometric_credential_id'
const USER_ID_KEY = 'profile_biometric_user_id'

/** Имя passkey в системном диалоге iOS / iCloud Keychain (не profile-user). */
export const BIOMETRIC_PASSKEY_NAME = 'Вход по Face ID / Touch ID'

/** Опции регистрации живут ~5 мин на сервере — клиентский кэш чуть короче. */
const PREFETCH_TTL_MS = 4 * 60 * 1000

type PrefetchSlot = {
  replace: boolean
  options: Record<string, unknown>
  fetchedAt: number
}

let registrationPrefetch: PrefetchSlot | null = null

export function isBiometricLoginAvailable(): boolean {
  return isStandalonePwaClient()
}

export function isBiometricLoginEnabled(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function readStoredCredentialId(): string | null {
  try {
    return localStorage.getItem(CREDENTIAL_KEY)
  } catch {
    return null
  }
}

function readStoredUserId(): string | null {
  try {
    return localStorage.getItem(USER_ID_KEY)
  } catch {
    return null
  }
}

/** Локальный passkey привязан к текущему аккаунту и совпадает с сервером. */
export function isBiometricLoginBound(status: DeviceUnlockStatus | null | undefined): boolean {
  if (!status?.biometric_enabled || !status.credential_id) return false
  if (!isBiometricLoginEnabled()) return false

  const localCred = readStoredCredentialId()
  const localUser = readStoredUserId()
  if (!localCred || !localUser) return false
  if (localCred !== status.credential_id) return false
  if (String(status.user_id ?? '') !== localUser) return false

  return true
}

/** Можно ли вызвать системный Face ID / Touch ID. */
export function canAssertBiometricLogin(status?: DeviceUnlockStatus | null): boolean {
  if (status?.biometric_enabled) return true
  return isBiometricLoginEnabled() && Boolean(readStoredCredentialId())
}

export function bindBiometricLoginLocal(userId: string | number, credentialId: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, '1')
    localStorage.setItem(CREDENTIAL_KEY, credentialId)
    localStorage.setItem(USER_ID_KEY, String(userId))
  } catch {
    // ignore
  }
}

export function setBiometricLoginEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return
  try {
    if (enabled) {
      localStorage.setItem(STORAGE_KEY, '1')
    } else {
      clearBiometricLoginLocal()
    }
  } catch {
    // ignore
  }
}

/** Полная очистка локального passkey (logout / смена аккаунта / отключение). */
export function clearBiometricLoginLocal(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(CREDENTIAL_KEY)
    localStorage.removeItem(USER_ID_KEY)
  } catch {
    // ignore
  }
  registrationPrefetch = null
}

/**
 * Отключение Face ID: чистим локально и по возможности убираем ключ из связки на телефоне.
 * userIdB64Url — из последних registration options (если есть в prefetch / передан явно).
 */
export async function disableBiometricLoginLocal(options?: {
  userIdB64Url?: string
}): Promise<void> {
  const credentialId = readStoredCredentialId()
  let userIdB64Url = options?.userIdB64Url || ''
  if (!userIdB64Url) {
    const user = registrationPrefetch?.options?.user as Record<string, unknown> | undefined
    if (user?.id != null) userIdB64Url = String(user.id)
  }

  clearBiometricLoginLocal()

  if (!credentialId) return
  // Signal API не блокирует отключение в UI.
  void syncAuthenticatorCredentials({
    userIdB64Url,
    acceptedCredentialIds: [],
    retiredCredentialIds: [credentialId],
  })
}

/** WebAuthn JSON: base64url без padding. */
function bufferToB64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

/** Сервер шлёт credential_id в ordinary base64 — Signal API ждёт base64url. */
function toBase64UrlId(value: string): string {
  return String(value || '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

type SignalPublicKeyCredential = typeof PublicKeyCredential & {
  signalAllAcceptedCredentials?: (options: {
    rpId: string
    userId: string
    allAcceptedCredentialIds: string[]
  }) => Promise<void>
  signalUnknownCredential?: (options: {
    rpId: string
    credentialId: string
  }) => Promise<void>
}

/**
 * Сообщает связке паролей, какие ключи ещё валидны — старые «Вход по Face ID»
 * на телефоне прячутся / удаляются, а не копятся при каждой перезаписи.
 * Никогда не блокируем UI: Signal API на iOS иногда висит бесконечно.
 */
async function syncAuthenticatorCredentials(options: {
  userIdB64Url: string
  acceptedCredentialIds: string[]
  retiredCredentialIds?: string[]
}): Promise<void> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return

  const PK = PublicKeyCredential as SignalPublicKeyCredential
  const rpId = clientWebAuthnRpId()
  if (!rpId) return

  const accepted = options.acceptedCredentialIds
    .map(toBase64UrlId)
    .filter(Boolean)
  const retired = (options.retiredCredentialIds || [])
    .map(toBase64UrlId)
    .filter((id) => id && !accepted.includes(id))

  const userId = toBase64UrlId(options.userIdB64Url)

  const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T | void> =>
    Promise.race([
      promise,
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, ms)
      }),
    ])

  if (typeof PK.signalAllAcceptedCredentials === 'function' && userId) {
    try {
      await withTimeout(
        PK.signalAllAcceptedCredentials({
          rpId,
          userId,
          allAcceptedCredentialIds: accepted,
        }),
        2500,
      )
      return
    } catch {
      // fallback ниже
    }
  }

  if (typeof PK.signalUnknownCredential !== 'function') return
  for (const credentialId of retired) {
    try {
      await withTimeout(PK.signalUnknownCredential({ rpId, credentialId }), 1500)
    } catch {
      // ignore — не все платформы поддерживают Signal API
    }
  }
}

/** Safari / iOS PWA: challenge и user.id как ArrayBuffer, не Uint8Array-view. */
function b64ToArrayBuffer(value: string): ArrayBuffer {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

function decodeCreationOptions(
  options: Record<string, unknown>,
): PublicKeyCredentialCreationOptions {
  const user = options.user as Record<string, unknown>
  return {
    ...(options as PublicKeyCredentialCreationOptions),
    challenge: b64ToArrayBuffer(String(options.challenge)),
    user: {
      ...(user as PublicKeyCredentialUserEntity),
      id: b64ToArrayBuffer(String(user.id)),
    },
    excludeCredentials: Array.isArray(options.excludeCredentials)
      ? (options.excludeCredentials as PublicKeyCredentialDescriptor[]).map((descriptor) => ({
          ...descriptor,
          id: b64ToArrayBuffer(String(descriptor.id)),
        }))
      : [],
  }
}

function decodeRequestOptions(
  options: Record<string, unknown>,
): PublicKeyCredentialRequestOptions {
  return {
    ...(options as PublicKeyCredentialRequestOptions),
    challenge: b64ToArrayBuffer(String(options.challenge)),
    allowCredentials: Array.isArray(options.allowCredentials)
      ? (options.allowCredentials as PublicKeyCredentialDescriptor[]).map((descriptor) => ({
          ...descriptor,
          id: b64ToArrayBuffer(String(descriptor.id)),
        }))
      : [],
  }
}

function serializeCredential(credential: PublicKeyCredential): Record<string, unknown> {
  const response = credential.response as
    | AuthenticatorAttestationResponse
    | AuthenticatorAssertionResponse

  const payload: Record<string, unknown> = {
    id: credential.id,
    rawId: bufferToB64Url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: bufferToB64Url(response.clientDataJSON),
    },
  }

  if ('attestationObject' in response) {
    ;(payload.response as Record<string, unknown>).attestationObject = bufferToB64Url(
      response.attestationObject,
    )
  } else {
    const assertion = response as AuthenticatorAssertionResponse
    ;(payload.response as Record<string, unknown>).authenticatorData = bufferToB64Url(
      assertion.authenticatorData,
    )
    ;(payload.response as Record<string, unknown>).signature = bufferToB64Url(assertion.signature)
    if (assertion.userHandle) {
      ;(payload.response as Record<string, unknown>).userHandle = bufferToB64Url(assertion.userHandle)
    }
  }

  return payload
}

function isPrefetchFresh(replace: boolean): boolean {
  if (!registrationPrefetch) return false
  if (registrationPrefetch.replace !== replace) return false
  return Date.now() - registrationPrefetch.fetchedAt < PREFETCH_TTL_MS
}

/** Есть свежие options для замены — можно сразу credentials.create в том же жесте. */
export function isBiometricReplacePrefetchReady(): boolean {
  return isPrefetchFresh(true)
}

function takePrefetch(replace: boolean): Record<string, unknown> | null {
  if (!isPrefetchFresh(replace) || !registrationPrefetch) return null
  const options = registrationPrefetch.options
  registrationPrefetch = null
  return options
}

export type PrefetchBiometricResult = {
  ok: boolean
  error?: string
}

/** Подтянуть options до клика — иначе iOS Safari теряет user gesture после await fetch. */
export async function prefetchBiometricRegistration(
  options: RegisterBiometricOptions = {},
): Promise<PrefetchBiometricResult> {
  if (!isBiometricLoginAvailable()) return { ok: false, error: 'Доступно только в установленном приложении' }
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return { ok: false, error: 'Биометрия недоступна в этом браузере' }
  }

  const replace = Boolean(options.replace)
  if (isPrefetchFresh(replace)) return { ok: true }

  const result = await fetchBiometricRegistrationOptions(replace)
  if (!result.data) {
    return { ok: false, error: result.error || 'Не удалось подготовить биометрию' }
  }

  registrationPrefetch = {
    replace,
    options: result.data,
    fetchedAt: Date.now(),
  }
  return { ok: true }
}

export type RegisterBiometricOptions = {
  /** Перезапись passkey на этом устройстве. */
  replace?: boolean
  /**
   * Уже полученные options (из prefetch).
   * Если нет — будет network await до create (ломает user gesture на старых iOS).
   */
  prefetchedOptions?: Record<string, unknown> | null
}

export type RegisterBiometricResult = {
  ok: boolean
  credentialId?: string
  userId?: number
  error?: string
  /** Нужен повторный тап: options только что скачали, create без жеста на iOS. */
  needsGestureRetry?: boolean
}

function mapWebAuthnError(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Не удалось подключить биометрию'
  const name = 'name' in error ? String(error.name) : ''
  const message = 'message' in error ? String(error.message) : ''

  if (name === 'NotAllowedError') {
    if (/gesture|activation|user/i.test(message)) {
      return 'Нажмите «Подключить» ещё раз — нужен системный диалог сразу после нажатия'
    }
    return 'Биометрия отменена или недоступна. Проверьте Face ID / Touch ID на устройстве'
  }
  if (name === 'InvalidStateError') {
    return 'Этот ключ уже есть на устройстве. Нажмите «Поменять биометрию», чтобы перезаписать'
  }
  if (name === 'SecurityError' || /rpId|relying party|origin/i.test(message)) {
    return 'Ошибка домена биометрии. Обновите приложение и попробуйте снова'
  }
  if (name === 'NotSupportedError') {
    return 'Биометрия не поддерживается на этом устройстве'
  }
  return message || 'Не удалось подключить биометрию'
}

export async function registerBiometricLogin(
  options: RegisterBiometricOptions = {},
): Promise<RegisterBiometricResult> {
  if (!isBiometricLoginAvailable()) {
    return { ok: false, error: 'Доступно только в установленном приложении' }
  }
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return { ok: false, error: 'Биометрия недоступна в этом браузере' }
  }

  const replace = Boolean(options.replace)
  const previousCredentialId = readStoredCredentialId()

  try {
    let serverOptions =
      options.prefetchedOptions ?? takePrefetch(replace) ?? null
    let fetchedInline = false

    if (!serverOptions) {
      const fetched = await fetchBiometricRegistrationOptions(replace)
      if (!fetched.data) {
        return { ok: false, error: fetched.error || 'Не удалось подготовить биометрию' }
      }
      serverOptions = fetched.data
      fetchedInline = true
    }

    const userEntity = serverOptions.user as Record<string, unknown> | undefined
    const userIdB64Url = userEntity?.id != null ? String(userEntity.id) : ''

    let credential: PublicKeyCredential | null
    try {
      credential = (await navigator.credentials.create({
        publicKey: decodeCreationOptions(serverOptions),
      })) as PublicKeyCredential | null
    } catch (error) {
      if (fetchedInline) {
        registrationPrefetch = {
          replace,
          options: serverOptions,
          fetchedAt: Date.now(),
        }
        return {
          ok: false,
          needsGestureRetry: true,
          error: mapWebAuthnError(error),
        }
      }
      throw error
    }

    if (!credential) {
      return { ok: false, error: 'Биометрия не вернула ключ. Попробуйте ещё раз' }
    }

    const registered = await registerDeviceUnlockBiometric(serializeCredential(credential))
    const status = registered.data
    if (!status?.biometric_enabled || !status.credential_id || status.user_id == null) {
      return {
        ok: false,
        error: registered.error || 'Сервер не принял биометрию. Попробуйте ещё раз',
      }
    }

    bindBiometricLoginLocal(status.user_id, status.credential_id)
    registrationPrefetch = null

    // Перезапись: чистим старые ключи в фоне — Signal API не должен держать спиннер.
    void syncAuthenticatorCredentials({
      userIdB64Url,
      acceptedCredentialIds: [credential.id],
      retiredCredentialIds: previousCredentialId ? [previousCredentialId] : [],
    })

    return {
      ok: true,
      credentialId: status.credential_id,
      userId: status.user_id,
    }
  } catch (error) {
    return { ok: false, error: mapWebAuthnError(error) }
  }
}

/**
 * Один активный credentials.get на вкладку.
 * Без этого при ремаунте gate / гонке visibility iOS показывает Face ID дважды
 * (и второй assert/options перетирает challenge на сервере).
 */
let assertBiometricInFlight: Promise<boolean> | null = null

export function isBiometricAssertInFlight(): boolean {
  return assertBiometricInFlight != null
}

/** Face ID / Touch ID при входе в приложение («Вход по Face ID») с server-side verify. */
export async function assertBiometricLogin(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false
  if (!isStandalonePwaClient()) return false
  if (assertBiometricInFlight) return assertBiometricInFlight

  assertBiometricInFlight = (async () => {
    try {
      const serverOptions = await fetchBiometricAssertionOptions()
      if (!serverOptions.data) return false

      const assertion = (await navigator.credentials.get({
        publicKey: decodeRequestOptions(serverOptions.data),
      })) as PublicKeyCredential | null

      if (!assertion) return false

      const verified = await verifyDeviceUnlockBiometric(serializeCredential(assertion))
      const status = verified.data
      if (!status?.biometric_enabled) return false

      if (status.credential_id && status.user_id != null) {
        bindBiometricLoginLocal(status.user_id, status.credential_id)
      }

      return true
    } catch {
      return false
    }
  })().finally(() => {
    assertBiometricInFlight = null
  })

  return assertBiometricInFlight
}
