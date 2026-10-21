import {
  getPasswordRulesState,
  isPasswordRulesValid,
} from 'bibli/shared/ui/rr/composables/usePasswordRules.js'

/** Спецсимволы как в UserService::validatePassword / RussAuthPassword. */
export const STAFF_PASSWORD_SYMBOLS = '!@#$%&'

export { getPasswordRulesState, isPasswordRulesValid }

/**
 * Валидация пароля синхронно с бэкендом (`UserService::validatePassword` / RR rules).
 * @returns сообщение об ошибке или null
 */
export function validateStaffPassword(password: string): string | null {
  if (!password) {
    return 'Введите новый пароль'
  }
  const state = getPasswordRulesState(password)
  if (!state.minLength) {
    return 'Пароль должен содержать минимум 8 символов'
  }
  if (!state.upperLower) {
    return 'Пароль должен содержать латинские заглавные и строчные буквы'
  }
  if (!state.hasDigit) {
    return 'Пароль должен содержать хотя бы одну цифру'
  }
  if (!state.hasSpecial) {
    return `Пароль должен содержать спецсимвол из ${STAFF_PASSWORD_SYMBOLS}`
  }
  return null
}

/** Полная проверка пары паролей перед отправкой. */
export function validateStaffPasswordForm(
  password: string,
  confirmation: string,
): { passwordError: string; confirmError: string } {
  const passwordError = validateStaffPassword(password) || ''
  let confirmError = ''
  if (!confirmation) {
    confirmError = 'Повторите новый пароль'
  } else if (password !== confirmation) {
    confirmError = 'Пароли не совпадают'
  }
  return { passwordError, confirmError }
}

export function canSubmitStaffPasswordForm(
  password: string,
  confirmation: string,
): boolean {
  return isPasswordRulesValid(password) && Boolean(confirmation) && password === confirmation
}

export function setUserPasswordErrorMessage(error: unknown): string {
  const err = error as {
    response?: { status?: number; data?: { data?: string } }
    message?: string
  }

  if (err.response?.status === 400) {
    return err.response?.data?.data || 'Пароли не совпадают'
  }
  if (err.response?.status === 401) {
    return 'Ошибка. Неверный API ключ'
  }
  if (err.response?.status === 403) {
    return err.response?.data?.data || 'У Вас нет прав использовать этот запрос'
  }
  if (err.response?.status === 422) {
    return err.response?.data?.data || 'Пароль отклонён сервисом аутентификации'
  }
  if (typeof err.response?.data?.data === 'string' && err.response.data.data) {
    return err.response.data.data
  }
  if (err.message) {
    return err.message
  }
  return 'Ошибка при смене пароля'
}

export type StaffSetPasswordFn = (payload: {
  userId: string | number
  newPassword: string
  newPasswordConfirmation: string
}) => Promise<void>
