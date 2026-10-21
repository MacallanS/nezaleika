export interface ThemeColors {
  // Основные цвета
  primary: string
  primaryDark: string
  primaryLight: string
  primaryHover: string
  primaryActive: string
  
  // Вторичные цвета
  secondary: string
  secondaryDark: string
  secondaryLight: string
  
  // Акцентные цвета
  accent: string
  accentDark: string
  accentLight: string
  
  // Цвета текста
  textPrimary: string
  textSecondary: string
  textTertiary: string
  textInverse: string
  
  // Цвета фона
  background: string
  backgroundSecondary: string
  backgroundTertiary: string
  
  // Цвета границ
  border: string
  borderLight: string
  borderDark: string
  
  // Статусные цвета
  success: string
  successLight: string
  successDark: string
  
  error: string
  errorLight: string
  errorDark: string
  
  warning: string
  warningLight: string
  warningDark: string
  
  info: string
  infoLight: string
  infoDark: string
  
  // Нейтральные цвета
  neutral: string
  neutralLight: string
  neutralDark: string
  
  // Дополнительные цвета для специфичных случаев
  label: string
  value: string
  checkboxAccent: string
  focusRing: string
  
  // Дополнительные оттенки текста
  textQuaternary: string
  textMuted: string
  
  // Дополнительные оттенки фона
  backgroundQuaternary: string
  backgroundHover: string
  backgroundActive: string
  backgroundDisabled: string
  
  // Дополнительные оттенки границ
  borderQuaternary: string
  inputBorder: string
  inputBorderFocus: string
  inputBorderError: string
  
  // Цвета для инпутов
  inputBg: string
  inputBgDisabled: string
  inputBgHover: string
  inputText: string
  inputPlaceholder: string
  inputError: string
  inputErrorBg: string
  
  // Цвета для теней и оверлеев
  overlay: string
  overlayLight: string
  shadowColor: string
  
  // Специальные цвета
  yellow: string
  yellowLight: string
  orange: string
  orangeLight: string
  purple: string
  purpleLight: string
  
  // Дополнительные оттенки primary для градиентов
  primaryGradientStart: string
  primaryGradientEnd: string
}

/**
 * Светлая / тёмная схема оформления (общие CSS-переменные)
 */
export type ColorScheme = 'light' | 'dark'

/**
 * Конфигурация темы
 */
export interface ThemeConfig {
  name: string
  colors: ThemeColors
  /** Палитра для тёмной темы (fintech / rusaisklad) */
  colorsDark: ThemeColors
}

/**
 * Имя темы
 */
export type ThemeName = 'fintech' | 'rusaisklad' | string
