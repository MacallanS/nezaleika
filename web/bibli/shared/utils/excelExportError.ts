/** Подсказка при таймауте / обрыве сети при выгрузке Excel. */
export const EXCEL_EXPORT_NETWORK_HINT =
  'Сеть нестабильна или сервер долго не отвечает. Попробуйте отключить VPN, проверить интернет и повторить выгрузку.'

export function isExcelExportNetworkError(error: unknown): boolean {
  const e = error as { name?: string; code?: string; message?: string }
  const message = String(e?.message || '')

  return (
    e?.name === 'TimeoutError' ||
    e?.name === 'AbortError' ||
    e?.code === 'ECONNABORTED' ||
    e?.code === 'ERR_NETWORK' ||
    e?.code === 'ERR_CANCELED' ||
    message === 'Network Error' ||
    /timeout of \d+ms exceeded/i.test(message) ||
    /Failed to fetch/i.test(message) ||
    /network_or_timeout/i.test(message) ||
    /Превышено время ожидания/i.test(message) ||
    message.includes('Сеть нестабильна')
  )
}

export function getExcelExportErrorToast(error: unknown): {
  severity: 'warn' | 'error'
  summary: string
  detail: string
  life: number
} {
  if (isExcelExportNetworkError(error)) {
    return {
      severity: 'warn',
      summary: 'Сеть нестабильна',
      detail: EXCEL_EXPORT_NETWORK_HINT,
      life: 9000,
    }
  }

  const e = error as { response?: { data?: { message?: string } }; message?: string }
  const detail =
    e?.response?.data?.message ||
    (typeof e?.message === 'string' && e.message.trim() ? e.message.trim() : '') ||
    'Не удалось экспортировать данные'

  return {
    severity: 'error',
    summary: 'Ошибка',
    detail,
    life: 5000,
  }
}
