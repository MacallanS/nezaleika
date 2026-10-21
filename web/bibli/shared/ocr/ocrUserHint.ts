/** Shown when the wizard stops waiting before recognize finishes. */
export const OCR_SOFT_TIMEOUT_HINT =
  'Распознавание заняло больше обычного — введите данные вручную или загрузите фото ещё раз.'

/** Safe agent-facing hint from profile recognize API (no error codes). */
export function formatOcrUserHint(hint: string | null | undefined): string {
  return String(hint || '').trim()
}
