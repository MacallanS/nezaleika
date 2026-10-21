import type { ColorScheme, ThemeConfig, ThemeColors } from './types'

/**
 * Активная палитра (светлая или тёмная ветка темы fintech / rusaisklad)
 */
export function resolveThemeColors(theme: ThemeConfig, colorScheme: ColorScheme): ThemeColors {
  return colorScheme === 'dark' ? theme.colorsDark : theme.colors
}

/**
 * Применить тему к документу через CSS переменные
 */
export function applyTheme(theme: ThemeConfig, colorScheme: ColorScheme = 'light'): void {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement
  root.dataset.russColorScheme = colorScheme

  const colors = resolveThemeColors(theme, colorScheme)
  const isDark = colorScheme === 'dark'
  const isFintech = theme.name === 'fintech'
  const isSklad = theme.name === 'rusaisklad'

  // Основные цвета
  root.style.setProperty('--russ-primary', colors.primary)
  root.style.setProperty('--russ-primary-dark', colors.primaryDark)
  root.style.setProperty('--russ-primary-light', colors.primaryLight)
  root.style.setProperty('--russ-primary-hover', colors.primaryHover)
  root.style.setProperty('--russ-primary-active', colors.primaryActive)
  
  // Вторичные цвета
  root.style.setProperty('--russ-secondary', colors.secondary)
  root.style.setProperty('--russ-secondary-dark', colors.secondaryDark)
  root.style.setProperty('--russ-secondary-light', colors.secondaryLight)
  
  // Акцентные цвета
  root.style.setProperty('--russ-accent', colors.accent)
  root.style.setProperty('--russ-accent-dark', colors.accentDark)
  root.style.setProperty('--russ-accent-light', colors.accentLight)
  
  // Цвета текста
  root.style.setProperty('--russ-text-primary', colors.textPrimary)
  root.style.setProperty('--russ-text-secondary', colors.textSecondary)
  root.style.setProperty('--russ-text-tertiary', colors.textTertiary)
  root.style.setProperty('--russ-text-inverse', colors.textInverse)
  
  // Цвета фона
  root.style.setProperty('--russ-bg', colors.background)
  root.style.setProperty('--russ-bg-secondary', colors.backgroundSecondary)
  root.style.setProperty('--russ-bg-tertiary', colors.backgroundTertiary)
  root.style.setProperty('--russ-bg-elevated', colors.background)
  
  // Цвета границ
  root.style.setProperty('--russ-border', colors.border)
  root.style.setProperty('--russ-border-light', colors.borderLight)
  root.style.setProperty('--russ-border-dark', colors.borderDark)
  
  // Статусные цвета
  root.style.setProperty('--russ-success', colors.success)
  root.style.setProperty('--russ-success-light', colors.successLight)
  root.style.setProperty('--russ-success-dark', colors.successDark)
  
  root.style.setProperty('--russ-error', colors.error)
  root.style.setProperty('--russ-error-light', colors.errorLight)
  root.style.setProperty('--russ-error-dark', colors.errorDark)
  
  root.style.setProperty('--russ-warning', colors.warning)
  root.style.setProperty('--russ-warning-light', colors.warningLight)
  root.style.setProperty('--russ-warning-dark', colors.warningDark)
  
  root.style.setProperty('--russ-info', colors.info)
  root.style.setProperty('--russ-info-light', colors.infoLight)
  root.style.setProperty('--russ-info-dark', colors.infoDark)
  
  // Нейтральные цвета
  root.style.setProperty('--russ-neutral', colors.neutral)
  root.style.setProperty('--russ-neutral-light', colors.neutralLight)
  root.style.setProperty('--russ-neutral-dark', colors.neutralDark)
  
  // Дополнительные цвета
  root.style.setProperty('--russ-label', colors.label)
  root.style.setProperty('--russ-value', colors.value)
  root.style.setProperty('--russ-checkbox-accent', colors.checkboxAccent)
  root.style.setProperty('--russ-focus-ring', colors.focusRing)
  
  // Дополнительные оттенки текста
  root.style.setProperty('--russ-text-quaternary', colors.textQuaternary)
  root.style.setProperty('--russ-text-muted', colors.textMuted)
  
  // Дополнительные оттенки фона
  root.style.setProperty('--russ-bg-quaternary', colors.backgroundQuaternary)
  root.style.setProperty('--russ-bg-hover', colors.backgroundHover)
  root.style.setProperty('--russ-bg-active', colors.backgroundActive)
  root.style.setProperty('--russ-bg-disabled', colors.backgroundDisabled)
  
  // Дополнительные оттенки границ
  root.style.setProperty('--russ-border-quaternary', colors.borderQuaternary)
  root.style.setProperty('--russ-input-border', colors.inputBorder)
  root.style.setProperty('--russ-input-border-focus', colors.inputBorderFocus)
  root.style.setProperty('--russ-input-border-error', colors.inputBorderError)
  
  // Цвета для инпутов
  root.style.setProperty('--russ-input-bg', colors.inputBg)
  root.style.setProperty('--russ-input-bg-disabled', colors.inputBgDisabled)
  root.style.setProperty('--russ-input-bg-hover', colors.inputBgHover)
  root.style.setProperty('--russ-input-text', colors.inputText)
  root.style.setProperty('--russ-input-placeholder', colors.inputPlaceholder)
  root.style.setProperty('--russ-input-error', colors.inputError)
  root.style.setProperty('--russ-input-error-bg', colors.inputErrorBg)
  
  // Цвета для теней и оверлеев
  root.style.setProperty('--russ-overlay', colors.overlay)
  root.style.setProperty('--russ-overlay-light', colors.overlayLight)
  root.style.setProperty(
    '--russ-overlay-strong',
    isDark ? 'rgba(0, 0, 0, 0.88)' : 'rgba(0, 0, 0, 0.62)'
  )
  root.style.setProperty('--russ-shadow-color', colors.shadowColor)
  
  // Специальные цвета
  root.style.setProperty('--russ-yellow', colors.yellow)
  root.style.setProperty('--russ-yellow-light', colors.yellowLight)
  root.style.setProperty('--russ-orange', colors.orange)
  root.style.setProperty('--russ-orange-light', colors.orangeLight)
  root.style.setProperty('--russ-purple', colors.purple)
  root.style.setProperty('--russ-purple-light', colors.purpleLight)
  
  // Дополнительные оттенки primary для градиентов
  root.style.setProperty('--russ-primary-gradient-start', colors.primaryGradientStart)
  root.style.setProperty('--russ-primary-gradient-end', colors.primaryGradientEnd)
  
  // Дополнительные фоновые цвета (fintech — синий, rusaisklad — серый, иначе зелёный)
  let bgTint: string
  let bgLight: string
  let bgLighter: string
  let bgGrayLight: string
  if (isDark) {
    if (isFintech) {
      bgTint = '#1a2744'
      bgLight = '#141c2b'
      bgLighter = '#243044'
      bgGrayLight = '#1e293b'
    } else if (isSklad) {
      bgTint = '#22262e'
      bgLight = '#181b21'
      bgLighter = '#2a2f38'
      bgGrayLight = '#1f2329'
    } else {
      bgTint = '#134e4a'
      bgLight = '#0f172a'
      bgLighter = '#115e59'
      bgGrayLight = '#1e293b'
    }
  } else {
    const isGrayThemeLight = isSklad
    const isFintechLight = isFintech
    bgTint = isFintechLight ? '#e8edff' : isGrayThemeLight ? '#f3f4f6' : '#e0f2f1'
    bgLight = isFintechLight ? '#f5f7ff' : isGrayThemeLight ? '#f9fafb' : '#f0fdf4'
    bgLighter = isFintechLight ? '#e0e7ff' : isGrayThemeLight ? '#e5e7eb' : '#d1fae5'
    bgGrayLight = '#f4f7fb'
  }
  root.style.setProperty('--russ-bg-blue-tint', bgTint)
  root.style.setProperty('--russ-bg-blue-light', bgLight)
  root.style.setProperty('--russ-bg-blue-lighter', bgLighter)
  root.style.setProperty('--russ-bg-gray-light', bgGrayLight)

  // Дополнительные цвета для статусов
  let successText: string
  let successBorder: string
  let warningText: string
  let errorText: string
  let infoText: string
  let infoBorder: string
  if (isDark) {
    if (isSklad) {
      successText = '#e5e7eb'
      successBorder = '#6b7280'
      infoText = '#e5e7eb'
      infoBorder = '#4b5563'
    } else if (isFintech) {
      successText = '#86efac'
      successBorder = '#22c55e'
      infoText = '#93c5fd'
      infoBorder = '#3b82f6'
    } else {
      successText = '#5eead4'
      successBorder = '#14b8a6'
      infoText = '#5eead4'
      infoBorder = '#0d9488'
    }
    warningText = '#fde68a'
    errorText = '#fecaca'
  } else {
    const isGrayThemeLight = isSklad
    const isFintechLight = isFintech
    successText = isGrayThemeLight ? '#374151' : '#065f46'
    successBorder = isGrayThemeLight ? '#9ca3af' : '#34d399'
    warningText = '#92400e'
    errorText = '#991b1b'
    infoText = isFintechLight ? '#1e40af' : isGrayThemeLight ? '#374151' : '#0f766e'
    infoBorder = isFintechLight ? '#bfdbfe' : isGrayThemeLight ? '#d1d5db' : '#99f6e4'
  }
  root.style.setProperty('--russ-success-text', successText)
  root.style.setProperty('--russ-success-border', successBorder)
  root.style.setProperty('--russ-warning-text', warningText)
  root.style.setProperty('--russ-error-text', errorText)
  root.style.setProperty('--russ-info-text', infoText)
  root.style.setProperty('--russ-info-border', infoBorder)

  // Цвета для акцентов в инпутах
  let accentRgb: string
  if (isDark) {
    accentRgb = isFintech ? '96, 165, 250' : isSklad ? '209, 213, 219' : '94, 234, 212'
  } else {
    accentRgb = isFintech ? '29, 76, 210' : isSklad ? '107, 114, 128' : '5, 150, 105'
  }
  root.style.setProperty('--russ-accent-tint-12', `rgba(${accentRgb}, 0.12)`)
  root.style.setProperty('--russ-accent-tint-18', `rgba(${accentRgb}, 0.18)`)
  root.style.setProperty('--russ-accent-tint-40', `rgba(${accentRgb}, 0.4)`)

  // Цвета для теней с акцентом
  let primaryRgb: string
  let accentRgbForShadow: string
  let secondaryRgb: string
  const shadowPrimaryAlpha = isDark ? 0.25 : 0.1
  const shadowPrimaryLightAlpha = isDark ? 0.15 : 0.06
  if (isDark) {
    if (isFintech) {
      primaryRgb = '107, 140, 255'
      accentRgbForShadow = '96, 165, 250'
      secondaryRgb = '129, 140, 248'
    } else if (isSklad) {
      primaryRgb = '156, 163, 175'
      accentRgbForShadow = '209, 213, 219'
      secondaryRgb = '156, 163, 175'
    } else {
      primaryRgb = '94, 234, 212'
      accentRgbForShadow = '45, 212, 191'
      secondaryRgb = '94, 234, 212'
    }
  } else {
    primaryRgb = isFintech ? '33, 62, 137' : isSklad ? '107, 114, 128' : '5, 150, 105'
    accentRgbForShadow = isFintech ? '37, 99, 235' : isSklad ? '107, 114, 128' : '14, 184, 166'
    secondaryRgb = isFintech ? '99, 102, 241' : isSklad ? '107, 114, 128' : '16, 185, 129'
  }
  root.style.setProperty('--russ-shadow-primary', `rgba(${primaryRgb}, ${shadowPrimaryAlpha})`)
  root.style.setProperty('--russ-shadow-primary-light', `rgba(${primaryRgb}, ${shadowPrimaryLightAlpha})`)
  root.style.setProperty('--russ-shadow-accent', `rgba(${accentRgbForShadow}, 0.2)`)
  root.style.setProperty('--russ-shadow-accent-light', `rgba(${accentRgbForShadow}, 0.1)`)
  root.style.setProperty('--russ-shadow-secondary', `rgba(${secondaryRgb}, 0.1)`)

  const successRgbForShadow = isSklad ? '107, 114, 128' : '34, 197, 94'
  root.style.setProperty(
    '--russ-shadow-success',
    `rgba(${successRgbForShadow}, ${isDark ? 0.28 : 0.2})`
  )
  root.style.setProperty('--russ-shadow-warning', `rgba(245, 158, 11, ${isDark ? 0.22 : 0.15})`)

  const contrastBg = isDark
    ? colors.backgroundTertiary
    : isSklad
      ? '#374151'
      : '#1e293b'
  const contrastTextMuted = isDark ? colors.textTertiary : '#cbd5e1'
  root.style.setProperty('--russ-bg-dark', contrastBg)
  root.style.setProperty('--russ-text-light', contrastTextMuted)
}

/**
 * Получить значение CSS переменной
 */
export function getCSSVariable(name: string): string {
  if (typeof window === 'undefined') {
    return ''
  }
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}
