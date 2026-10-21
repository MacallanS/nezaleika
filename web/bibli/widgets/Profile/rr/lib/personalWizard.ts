import {
  isValidCyrillicName,
  validateCyrillicName,
} from 'bibli/shared/ui/rr/form/composables/useCyrillicNameValidation.js'
import {
  migrateFromSessionStorage,
  readDurable,
  readDurableString,
  removeDurable,
  writeDurable,
} from 'bibli/shared/storage/clientDurableState'

export { sanitizePersonNameInput } from 'bibli/shared/ui/rr/form/composables/useCyrillicNameValidation.js'

export const PERSONAL_WIZARD_TOTAL = 5
export const PERSONAL_WIZARD_BASE_PATH = '/profile/personal'

const OTP_EMAIL_LOGICAL_KEY = 'profile.personal.otpEmail'
const OTP_RESEND_AT_LOGICAL_KEY = 'profile.personal.otpResendAt'
const OTP_EMAIL_SESSION_LEGACY = 'profile.personal.otpEmail'
const OTP_RESEND_SESSION_LEGACY = 'profile.personal.otpResendAt'
const FORM_DRAFT_LOGICAL_KEY = 'profile.personal.formDraft'
export const PERSONAL_FORM_DRAFT_TTL_MS = 24 * 60 * 60 * 1000

export type PersonalGender = 'm' | 'f' | null

export type PersonalFormDraft = {
  name: string
  surname: string
  patronymic: string
  noPatronymic: boolean
  gender: PersonalGender
  birthday: string
  phone: string
  email: string
  telegram: string
}

export function personalWizardPath(step: number): string {
  return `${PERSONAL_WIZARD_BASE_PATH}/${step}`
}

export function parsePersonalWizardStep(raw: unknown): number {
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 1 || n > PERSONAL_WIZARD_TOTAL) return 1
  return n
}

function ensureOtpEmailMigrated(): void {
  migrateFromSessionStorage(OTP_EMAIL_SESSION_LEGACY, OTP_EMAIL_LOGICAL_KEY)
}

function ensureOtpResendMigrated(): void {
  migrateFromSessionStorage(OTP_RESEND_SESSION_LEGACY, OTP_RESEND_AT_LOGICAL_KEY)
}

/** Почта, на которую ушёл OTP — переживает remount и убийство WebView. */
export function readPendingOtpEmail(userId?: string | number | null): string {
  ensureOtpEmailMigrated()
  return readDurableString(OTP_EMAIL_LOGICAL_KEY, { userId })
}

export function writePendingOtpEmail(
  email: string,
  userId?: string | number | null,
): void {
  const value = String(email || '').trim()
  if (value) {
    writeDurable(OTP_EMAIL_LOGICAL_KEY, value, { userId, ttlMs: PERSONAL_FORM_DRAFT_TTL_MS })
  } else {
    removeDurable(OTP_EMAIL_LOGICAL_KEY, { userId })
  }
}

export function clearPendingOtpEmail(userId?: string | number | null): void {
  writePendingOtpEmail('', userId)
  clearOtpResendAt(userId)
}

/** Unix ms, когда снова можно запросить код. */
export function readOtpResendAt(userId?: string | number | null): number {
  ensureOtpResendMigrated()
  const raw = Number(readDurableString(OTP_RESEND_AT_LOGICAL_KEY, { userId }) || 0)
  return Number.isFinite(raw) ? raw : 0
}

export function writeOtpResendAt(
  timestampMs: number,
  userId?: string | number | null,
): void {
  if (timestampMs > Date.now()) {
    writeDurable(OTP_RESEND_AT_LOGICAL_KEY, String(timestampMs), {
      userId,
      ttlMs: PERSONAL_FORM_DRAFT_TTL_MS,
    })
  } else {
    removeDurable(OTP_RESEND_AT_LOGICAL_KEY, { userId })
  }
}

export function clearOtpResendAt(userId?: string | number | null): void {
  removeDurable(OTP_RESEND_AT_LOGICAL_KEY, { userId })
}

export function readPersonalFormDraft(
  userId?: string | number | null,
): PersonalFormDraft | null {
  return readDurable<PersonalFormDraft>(FORM_DRAFT_LOGICAL_KEY, { userId })
}

export function writePersonalFormDraft(
  draft: PersonalFormDraft,
  userId?: string | number | null,
): void {
  writeDurable(FORM_DRAFT_LOGICAL_KEY, draft, {
    userId,
    ttlMs: PERSONAL_FORM_DRAFT_TTL_MS,
  })
}

export function clearPersonalFormDraft(userId?: string | number | null): void {
  removeDurable(FORM_DRAFT_LOGICAL_KEY, { userId })
}

/** API: pending_email + неистёкший OTP на бэке. */
export function resolveServerPendingOtpEmail(
  personal: { pending_email?: string | null; email?: string | null } | null | undefined,
): string {
  if (!personal) return ''
  if (String(personal.email || '').trim()) return ''
  return String(personal.pending_email || '').trim()
}

export function remainingOtpResendSeconds(
  now = Date.now(),
  userId?: string | number | null,
): number {
  const at = readOtpResendAt(userId)
  if (!at) return 0
  return Math.max(0, Math.ceil((at - now) / 1000))
}

export interface PersonalWizardForm {
  name: string
  surname: string
  patronymic: string
  noPatronymic: boolean
  gender: PersonalGender
  birthday: string
  phone: string
  email: string
  telegram: string
  emailVerified: boolean
  photoFile: File | null
  photoPreviewUrl: string | null
  photoServerPath: string | null
  dataConfirmed: boolean
}

export function createEmptyPersonalForm(): PersonalWizardForm {
  return {
    name: '',
    surname: '',
    patronymic: '',
    noPatronymic: false,
    gender: null,
    birthday: '',
    phone: '',
    email: '',
    telegram: '',
    emailVerified: false,
    photoFile: null,
    photoPreviewUrl: null,
    photoServerPath: null,
    dataConfirmed: false,
  }
}

/** ДД.ММ.ГГГГ или YYYY-MM-DD → YYYY-MM-DD */
export function birthdayToApi(value: string): string | null {
  const raw = String(value || '').trim()
  if (!raw) return null

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) {
    const y = Number(iso[1])
    const mo = Number(iso[2])
    const d = Number(iso[3])
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
    const dt = new Date(y, mo - 1, d)
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null
    return `${iso[1]}-${iso[2]}-${iso[3]}`
  }

  const m = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (!m) return null
  const [, dd, mm, yyyy] = m
  const d = Number(dd)
  const mo = Number(mm)
  const y = Number(yyyy)
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  const dt = new Date(y, mo - 1, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null
  return `${yyyy}-${mm}-${dd}`
}

export const BIRTHDAY_MIN_AGE = 14
export const BIRTHDAY_MAX_AGE = 90

/** YYYY-MM-DD для «сегодня» в локальной зоне. */
export function todayApiDate(now = new Date()): string {
  const y = now.getFullYear()
  const mo = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${mo}-${d}`
}

export function isApiDateNotFuture(apiDate: string, now = new Date()): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(apiDate) && apiDate <= todayApiDate(now)
}

/** Полных лет на дату `onDate` (YYYY-MM-DD) по дате рождения YYYY-MM-DD. */
export function ageOnApiDate(
  birthApiDate: string,
  onApiDate: string,
): number | null {
  const birth = String(birthApiDate).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const on = String(onApiDate).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!birth || !on) return null
  const by = Number(birth[1])
  const bm = Number(birth[2])
  const bd = Number(birth[3])
  const oy = Number(on[1])
  const om = Number(on[2])
  const od = Number(on[3])
  const birthDt = new Date(by, bm - 1, bd)
  const onDt = new Date(oy, om - 1, od)
  if (
    birthDt.getFullYear() !== by ||
    birthDt.getMonth() !== bm - 1 ||
    birthDt.getDate() !== bd ||
    onDt.getFullYear() !== oy ||
    onDt.getMonth() !== om - 1 ||
    onDt.getDate() !== od
  ) {
    return null
  }
  let age = oy - by
  if (om < bm || (om === bm && od < bd)) age -= 1
  return age
}

/** Полных лет на сегодня по дате YYYY-MM-DD. */
export function ageFromApiBirthday(apiDate: string, now = new Date()): number | null {
  return ageOnApiDate(apiDate, todayApiDate(now))
}

/** Дата в формате ДД.ММ.ГГГГ, не в будущем, возраст в [14, 90]. */
export function isBirthdayAgeAllowed(value: string, now = new Date()): boolean {
  const api = birthdayToApi(value)
  if (!api) return false
  if (!isApiDateNotFuture(api, now)) return false
  const age = ageFromApiBirthday(api, now)
  if (age === null) return false
  return age >= BIRTHDAY_MIN_AGE && age <= BIRTHDAY_MAX_AGE
}

/** YYYY-MM-DD или ISO → ДД.ММ.ГГГГ */
export function birthdayFromApi(value: string | null | undefined): string {
  if (!value) return ''
  const m = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[3]}.${m[2]}.${m[1]}`
  const dmy = String(value).trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (dmy) return value.trim()
  return ''
}

export function maskBirthdayInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  const parts = []
  if (digits.length > 0) parts.push(digits.slice(0, 2))
  if (digits.length > 2) parts.push(digits.slice(2, 4))
  if (digits.length > 4) parts.push(digits.slice(4, 8))
  return parts.join('.')
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  const visible = local.slice(0, 1)
  return `${visible}*****@${domain}`
}

export function isIdentityStepValid(form: PersonalWizardForm): boolean {
  if (!isValidCyrillicName(form.name) || !isValidCyrillicName(form.surname)) return false
  if (!form.noPatronymic && !isValidCyrillicName(form.patronymic)) return false
  if (!form.gender) return false
  return isBirthdayAgeAllowed(form.birthday)
}

export function normalizePhoneForRrInput(value: string | null | undefined): string {
  let digits = String(value || '').replace(/\D/g, '')
  while (digits.length > 10 && (digits[0] === '7' || digits[0] === '8')) {
    digits = digits.slice(1)
  }
  return digits.slice(0, 10)
}

export function isContactsStepValid(form: PersonalWizardForm): boolean {
  if (normalizePhoneForRrInput(form.phone).length !== 10) return false
  const email = form.email.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false
  const tg = form.telegram.replace(/^@+/, '').trim()
  return tg.length >= 5
}

export function isPhotoStepValid(form: PersonalWizardForm): boolean {
  // Локальный файл достаточен до финального «Отправить на проверку»
  // (аплоад на сервер откладываем, иначе шаг сразу уходит в review).
  return Boolean(form.photoServerPath || form.photoFile || form.photoPreviewUrl)
}

export function getPersonalNameFieldError(value: string, touched = false): string {
  if (!touched) return ''
  return validateCyrillicName(value, { emptyMessage: 'Укажите имя' })
}

export function getPersonalSurnameFieldError(value: string, touched = false): string {
  if (!touched) return ''
  return validateCyrillicName(value, { emptyMessage: 'Укажите фамилию' })
}

export function getPersonalPatronymicFieldError(
  value: string,
  noPatronymic: boolean,
  touched = false,
): string {
  if (!touched || noPatronymic) return ''
  return validateCyrillicName(value, {
    emptyMessage: 'Укажите отчество или отметьте «Нет отчества»',
  })
}

export function getPersonalBirthdayFieldError(value: string, touched = false): string {
  if (!touched) return ''
  const raw = value.trim()
  if (!raw) return 'Укажите дату рождения'
  const api = birthdayToApi(raw)
  if (!api) return 'Укажите дату в формате ДД.ММ.ГГГГ'
  if (!isApiDateNotFuture(api)) return 'Дата рождения не может быть в будущем'
  const age = ageFromApiBirthday(api)
  if (age === null) return 'Укажите дату в формате ДД.ММ.ГГГГ'
  if (age < BIRTHDAY_MIN_AGE) return `Минимальный возраст — ${BIRTHDAY_MIN_AGE} лет`
  if (age > BIRTHDAY_MAX_AGE) return `Максимальный возраст — ${BIRTHDAY_MAX_AGE} лет`
  return ''
}

export function getPersonalEmailFieldError(value: string, touched = false): string {
  if (!touched) return ''
  const email = value.trim()
  if (!email) return 'Укажите почту'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Укажите корректный email'
  return ''
}

export function getPersonalTelegramFieldError(value: string, touched = false): string {
  if (!touched) return ''
  const tg = value.replace(/^@+/, '').trim()
  if (!tg) return 'Укажите ник в Telegram'
  if (tg.length < 5) return 'Ник должен содержать минимум 5 символов'
  return ''
}

/** Черновик фото до «Отправить на проверку» — переживает refresh на шаге 5. */
const DRAFT_PHOTO_DB = 'profile.personal'
const DRAFT_PHOTO_STORE = 'draft'
const DRAFT_PHOTO_KEY = 'profilePhoto'

type DraftPhotoRecord = {
  blob: Blob
  name: string
  type: string
  lastModified: number
}

function openDraftPhotoDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexedDB unavailable'))
      return
    }
    const req = indexedDB.open(DRAFT_PHOTO_DB, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(DRAFT_PHOTO_STORE)) {
        db.createObjectStore(DRAFT_PHOTO_STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error || new Error('indexedDB open failed'))
  })
}

export async function writeDraftProfilePhoto(file: File | Blob): Promise<void> {
  try {
    const db = await openDraftPhotoDb()
    const record: DraftPhotoRecord = {
      blob: file,
      name: file instanceof File ? file.name : `profile-${Date.now()}.jpg`,
      type: file.type || 'image/jpeg',
      lastModified: file instanceof File ? file.lastModified : Date.now(),
    }
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(DRAFT_PHOTO_STORE, 'readwrite')
      tx.objectStore(DRAFT_PHOTO_STORE).put(record, DRAFT_PHOTO_KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error || new Error('draft photo write failed'))
    })
    db.close()
  } catch {
    // private mode / quota — черновик просто не сохранится
  }
}

export async function readDraftProfilePhoto(): Promise<File | null> {
  try {
    const db = await openDraftPhotoDb()
    const record = await new Promise<DraftPhotoRecord | null>((resolve, reject) => {
      const tx = db.transaction(DRAFT_PHOTO_STORE, 'readonly')
      const req = tx.objectStore(DRAFT_PHOTO_STORE).get(DRAFT_PHOTO_KEY)
      req.onsuccess = () => resolve((req.result as DraftPhotoRecord) || null)
      req.onerror = () => reject(req.error || new Error('draft photo read failed'))
    })
    db.close()
    if (!record?.blob) return null
    return new File([record.blob], record.name || 'profile.jpg', {
      type: record.type || 'image/jpeg',
      lastModified: record.lastModified || Date.now(),
    })
  } catch {
    return null
  }
}

export async function clearDraftProfilePhoto(): Promise<void> {
  try {
    const db = await openDraftPhotoDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(DRAFT_PHOTO_STORE, 'readwrite')
      tx.objectStore(DRAFT_PHOTO_STORE).delete(DRAFT_PHOTO_KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error || new Error('draft photo clear failed'))
    })
    db.close()
  } catch {
    // ignore
  }
}
