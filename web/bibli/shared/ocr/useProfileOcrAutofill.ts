import { createProfileOcrClient } from './profileOcrClient'
import {
  applyBankMapped,
  applyInnMapped,
  applyPassportMapped,
  applyRegistrationMapped,
  applySnilsMapped,
  hasPersonalOcrPatch,
  pickMappedForKind,
} from './applyMappedFields'
import { mergePersonalOcrDraft } from './personalOcrDraft'
import type { OcrRecognizeResult, PersonalOcrPatch, RecognizeKind } from './types'

export interface RecognizeAndApplyOptions {
  baseUrl?: string
  filename?: string
  onPersonal?: (patch: PersonalOcrPatch) => void
}

function emitPersonal(
  patch: PersonalOcrPatch,
  options: RecognizeAndApplyOptions,
): void {
  if (!hasPersonalOcrPatch(patch)) return
  mergePersonalOcrDraft(patch)
  options.onPersonal?.(patch)
}

export async function recognizeAndApply(
  kind: RecognizeKind,
  file: File | Blob,
  form: Record<string, unknown>,
  options: RecognizeAndApplyOptions = {},
): Promise<{ ok: boolean; result: OcrRecognizeResult; message: string }> {
  const client = createProfileOcrClient({ baseUrl: options.baseUrl })
  const result = await client.recognize(kind, file, options.filename)

  if (result.status !== 'done' && result.status !== 'ok') {
    return {
      ok: false,
      result,
      message:
        result.error ||
        (result.status === 'unavailable'
          ? 'Локальный OCR для этого типа документа недоступен'
          : 'Не удалось распознать документ'),
    }
  }

  const mapped = pickMappedForKind(kind, result.mapped || {})

  if (kind === 'passport') {
    emitPersonal(applyPassportMapped(form, mapped), options)
  } else if (kind === 'registration') {
    applyRegistrationMapped(form, mapped)
  } else if (kind === 'snils') {
    applySnilsMapped(form, mapped)
  } else if (kind === 'inn') {
    applyInnMapped(form, mapped)
  } else if (kind === 'bank') {
    applyBankMapped(form, mapped)
  }

  return {
    ok: true,
    result,
    message: 'Данные подставлены из OCR — проверьте перед отправкой',
  }
}

/** Caller owns busy state; this only runs recognize + field apply. */
export function useProfileOcrAutofill(options: RecognizeAndApplyOptions = {}) {
  return {
    recognizeAndApply: (
      kind: RecognizeKind,
      file: File | Blob,
      form: Record<string, unknown>,
      localOptions: RecognizeAndApplyOptions = {},
    ) =>
      recognizeAndApply(kind, file, form, {
        ...options,
        ...localOptions,
        onPersonal: localOptions.onPersonal || options.onPersonal,
      }),
  }
}
