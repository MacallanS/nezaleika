import { describe, expect, it } from 'vitest'
import {
  EXCEL_EXPORT_NETWORK_HINT,
  getExcelExportErrorToast,
  isExcelExportNetworkError,
} from './excelExportError'

describe('excelExportError', () => {
  it('detects timeout and network failures', () => {
    expect(isExcelExportNetworkError({ code: 'ECONNABORTED' })).toBe(true)
    expect(isExcelExportNetworkError({ message: 'timeout of 12000ms exceeded' })).toBe(true)
    expect(isExcelExportNetworkError({ message: 'Failed to fetch' })).toBe(true)
    expect(isExcelExportNetworkError({ message: 'Сеть нестабильна или сервер долго не отвечает' })).toBe(true)
    expect(isExcelExportNetworkError({ message: 'Получен пустой файл' })).toBe(false)
  })

  it('returns warn toast with VPN hint for network errors', () => {
    const toast = getExcelExportErrorToast({ code: 'ERR_NETWORK', message: 'Network Error' })
    expect(toast.severity).toBe('warn')
    expect(toast.summary).toBe('Сеть нестабильна')
    expect(toast.detail).toBe(EXCEL_EXPORT_NETWORK_HINT)
    expect(toast.life).toBeGreaterThan(5000)
  })

  it('returns error toast for ordinary failures', () => {
    const toast = getExcelExportErrorToast(new Error('Получен пустой файл'))
    expect(toast.severity).toBe('error')
    expect(toast.detail).toBe('Получен пустой файл')
  })
})
