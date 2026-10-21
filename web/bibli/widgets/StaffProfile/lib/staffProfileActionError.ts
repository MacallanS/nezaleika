import {
  formatValidationToast,
  parseApiValidationError,
  sectionTitleForFieldErrors,
} from '../../../shared/api/parseApiValidationError'

export {
  formatValidationToast,
  parseApiValidationError,
  sectionTitleForFieldErrors,
} from '../../../shared/api/parseApiValidationError'
export type { ParsedApiValidationError } from '../../../shared/api/parseApiValidationError'

/**
 * Человекочитаемое сообщение об ошибке staff-действия.
 * При 422 сначала берёт Laravel `errors`, а не generic `data`.
 */
export function getStaffProfileActionErrorMessage(error: unknown, fallback = ''): string {
  const parsed = parseApiValidationError(error, fallback)
  if (Object.keys(parsed.fieldErrors).length > 0) {
    return formatValidationToast({
      sectionTitle: sectionTitleForFieldErrors(parsed.fieldErrors),
      fieldErrors: parsed.fieldErrors,
      fallback: parsed.summary || fallback,
    })
  }
  return parsed.summary || fallback
}
