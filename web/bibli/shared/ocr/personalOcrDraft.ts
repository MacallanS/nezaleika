import type { PersonalOcrPatch } from './types'
import { hasPersonalOcrPatch } from './applyMappedFields'
import {
  migrateFromSessionStorage,
  readDurable,
  removeDurable,
  writeDurable,
} from 'bibli/shared/storage/clientDurableState'

const STORAGE_LOGICAL_KEY = 'profile-ocr-personal-draft'
const STORAGE_SESSION_LEGACY = 'profile-ocr-personal-draft'
const OCR_DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000

function ensureMigrated(): void {
  migrateFromSessionStorage(STORAGE_SESSION_LEGACY, STORAGE_LOGICAL_KEY, {
    ttlMs: OCR_DRAFT_TTL_MS,
    asJson: true,
  })
}

/** Merge OCR personal fields into a session draft (passport / SNILS / INN).
 * Existing draft values win — OCR only fills gaps. */
export function mergePersonalOcrDraft(patch: PersonalOcrPatch): void {
  if (!hasPersonalOcrPatch(patch)) return
  ensureMigrated()
  try {
    const prev = readPersonalOcrDraft() || {}
    const next: PersonalOcrPatch = { ...prev }
    if (patch.surname && !String(prev.surname || '').trim()) next.surname = patch.surname
    if (patch.name && !String(prev.name || '').trim()) next.name = patch.name
    if (patch.patronymic && !String(prev.patronymic || '').trim()) {
      next.patronymic = patch.patronymic
      next.noPatronymic = false
    } else if (patch.noPatronymic != null && prev.noPatronymic == null && !String(prev.patronymic || '').trim()) {
      next.noPatronymic = patch.noPatronymic
    }
    if (patch.gender && !prev.gender) next.gender = patch.gender
    if (patch.birthday && !String(prev.birthday || '').trim()) next.birthday = patch.birthday
    writeDurable(STORAGE_LOGICAL_KEY, next, { ttlMs: OCR_DRAFT_TTL_MS })
  } catch {
    /* ignore quota / private mode */
  }
}

export function readPersonalOcrDraft(): PersonalOcrPatch | null {
  ensureMigrated()
  try {
    const parsed = readDurable<PersonalOcrPatch>(STORAGE_LOGICAL_KEY)
    if (!parsed || typeof parsed !== 'object') return null
    return hasPersonalOcrPatch(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function clearPersonalOcrDraft(): void {
  removeDurable(STORAGE_LOGICAL_KEY)
}

/** Fill empty personal-wizard fields from OCR draft (does not overwrite API/user input). */
export function applyPersonalOcrDraftToForm(
  form: Record<string, unknown>,
  draft: PersonalOcrPatch | null = readPersonalOcrDraft(),
): boolean {
  if (!draft || !hasPersonalOcrPatch(draft)) return false
  let applied = false
  if (draft.surname && !String(form.surname || '').trim()) {
    form.surname = draft.surname
    applied = true
  }
  if (draft.name && !String(form.name || '').trim()) {
    form.name = draft.name
    applied = true
  }
  if (draft.patronymic && !String(form.patronymic || '').trim()) {
    form.patronymic = draft.patronymic
    form.noPatronymic = false
    applied = true
  } else if (draft.noPatronymic && !String(form.patronymic || '').trim()) {
    form.noPatronymic = true
    applied = true
  }
  if (draft.gender && !form.gender) {
    form.gender = draft.gender
    applied = true
  }
  if (draft.birthday && !String(form.birthday || '').trim()) {
    form.birthday = draft.birthday
    applied = true
  }
  return applied
}

export function keepIfServerEmpty<T>(server: T | null | undefined, local: T): T {
  if (server === null || server === undefined || server === '') return local
  return server as T
}
