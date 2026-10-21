import type { ThemeConfig, ThemeColors } from './types'

/**
 * Тёмная палитра fintech (синий акцент на тёмных поверхностях)
 */
const fintechColorsDark: ThemeColors = {
  primary: '#6b8cff',
  primaryDark: '#4d6fd4',
  primaryLight: '#8aa3ff',
  primaryHover: '#7d99ff',
  primaryActive: '#5a7ae6',

  secondary: '#818cf8',
  secondaryDark: '#6366f1',
  secondaryLight: '#a5b4fc',

  accent: '#60a5fa',
  accentDark: '#3b82f6',
  accentLight: '#93c5fd',

  textPrimary: '#f1f5f9',
  textSecondary: '#e2e8f0',
  textTertiary: '#94a3b8',
  textInverse: '#0f172a',

  background: '#0c1117',
  backgroundSecondary: '#141c2b',
  backgroundTertiary: '#1c2838',

  border: '#334155',
  borderLight: '#3d4f63',
  borderDark: '#475569',

  success: '#4ade80',
  successLight: '#14532d',
  successDark: '#22c55e',

  error: '#f87171',
  errorLight: '#7f1d1d',
  errorDark: '#ef4444',

  warning: '#fbbf24',
  warningLight: '#713f12',
  warningDark: '#f59e0b',

  info: '#60a5fa',
  infoLight: '#1e3a5f',
  infoDark: '#3b82f6',

  neutral: '#94a3b8',
  neutralLight: '#cbd5e1',
  neutralDark: '#64748b',

  label: '#a5b4fc',
  value: '#93c5fd',
  checkboxAccent: '#60a5fa',
  focusRing: 'rgba(96, 165, 250, 0.35)',

  textQuaternary: '#64748b',
  textMuted: '#94a3b8',

  backgroundQuaternary: '#243044',
  backgroundHover: '#1e293b',
  backgroundActive: '#334155',
  backgroundDisabled: '#1e293b',

  borderQuaternary: '#475569',
  inputBorder: '#475569',
  inputBorderFocus: '#60a5fa',
  inputBorderError: '#f87171',

  inputBg: '#1c2838',
  inputBgDisabled: '#141c2b',
  inputBgHover: '#243044',
  inputText: '#e2e8f0',
  inputPlaceholder: '#64748b',
  inputError: '#f87171',
  inputErrorBg: '#450a0a',

  overlay: 'rgba(0, 0, 0, 0.65)',
  overlayLight: 'rgba(0, 0, 0, 0.45)',
  shadowColor: 'rgba(0, 0, 0, 0.4)',

  yellow: '#fcd34d',
  yellowLight: '#422006',
  orange: '#fb923c',
  orangeLight: '#431407',
  purple: '#c4b5fd',
  purpleLight: '#312e81',

  primaryGradientStart: '#4d6fd4',
  primaryGradientEnd: '#1e3a8a',
}

/**
 * Тёмная палитра rusaisklad (нейтрально-серый акцент)
 */
const rusaiskladColorsDark: ThemeColors = {
  primary: '#9ca3af',
  primaryDark: '#6b7280',
  primaryLight: '#d1d5db',
  primaryHover: '#d1d5db',
  primaryActive: '#9ca3af',

  secondary: '#d1d5db',
  secondaryDark: '#9ca3af',
  secondaryLight: '#e5e7eb',

  accent: '#9ca3af',
  accentDark: '#6b7280',
  accentLight: '#d1d5db',

  textPrimary: '#f3f4f6',
  textSecondary: '#e5e7eb',
  textTertiary: '#9ca3af',
  textInverse: '#111827',

  background: '#0f1115',
  backgroundSecondary: '#181b21',
  backgroundTertiary: '#22262e',

  border: '#374151',
  borderLight: '#3f4654',
  borderDark: '#4b5563',

  success: '#9ca3af',
  successLight: '#292e36',
  successDark: '#d1d5db',

  error: '#f87171',
  errorLight: '#7f1d1d',
  errorDark: '#ef4444',

  warning: '#fbbf24',
  warningLight: '#713f12',
  warningDark: '#f59e0b',

  info: '#9ca3af',
  infoLight: '#292e36',
  infoDark: '#d1d5db',

  neutral: '#9ca3af',
  neutralLight: '#d1d5db',
  neutralDark: '#6b7280',

  label: '#d1d5db',
  value: '#e5e7eb',
  checkboxAccent: '#9ca3af',
  focusRing: 'rgba(156, 163, 175, 0.35)',

  textQuaternary: '#6b7280',
  textMuted: '#9ca3af',

  backgroundQuaternary: '#2a2f38',
  backgroundHover: '#22262e',
  backgroundActive: '#374151',
  backgroundDisabled: '#1f2329',

  borderQuaternary: '#4b5563',
  inputBorder: '#4b5563',
  inputBorderFocus: '#d1d5db',
  inputBorderError: '#f87171',

  inputBg: '#22262e',
  inputBgDisabled: '#181b21',
  inputBgHover: '#2a2f38',
  inputText: '#e5e7eb',
  inputPlaceholder: '#6b7280',
  inputError: '#f87171',
  inputErrorBg: '#450a0a',

  overlay: 'rgba(0, 0, 0, 0.65)',
  overlayLight: 'rgba(0, 0, 0, 0.45)',
  shadowColor: 'rgba(0, 0, 0, 0.4)',

  yellow: '#fcd34d',
  yellowLight: '#422006',
  orange: '#fb923c',
  orangeLight: '#431407',
  purple: '#c4b5fd',
  purpleLight: '#312e81',

  primaryGradientStart: '#6b7280',
  primaryGradientEnd: '#374151',
}

/**
 * Тема для проекта fintech (синяя цветовая схема)
 */
export const fintechTheme: ThemeConfig = {
  name: 'fintech',
  colorsDark: fintechColorsDark,
  colors: {
    // Основные цвета (синие)
    primary: '#213e89',
    primaryDark: '#162954',
    primaryLight: '#1b3170',
    primaryHover: '#1b3170',
    primaryActive: '#162954',
    
    // Вторичные цвета
    secondary: '#6366f1',
    secondaryDark: '#4f46e5',
    secondaryLight: '#818cf8',
    
    // Акцентные цвета
    accent: '#2563eb',
    accentDark: '#1d4ed8',
    accentLight: '#3b82f6',
    
    // Цвета текста
    textPrimary: '#1f2937',
    textSecondary: '#374151',
    textTertiary: '#6b7280',
    textInverse: '#ffffff',
    
    // Цвета фона
    background: '#ffffff',
    backgroundSecondary: '#f8fafc',
    backgroundTertiary: '#f1f5f9',
    
    // Цвета границ
    border: '#e5e7eb',
    borderLight: '#e2e8f0',
    borderDark: '#d1d5db',
    
    // Статусные цвета
    success: '#22c55e',
    successLight: '#d1fae5',
    successDark: '#16a34a',
    
    error: '#dc3545',
    errorLight: '#fee2e2',
    errorDark: '#c82333',
    
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    warningDark: '#d97706',
    
    info: '#3b82f6',
    infoLight: '#dbeafe',
    infoDark: '#2563eb',
    
    // Нейтральные цвета
    neutral: '#6b7280',
    neutralLight: '#9ca3af',
    neutralDark: '#374151',
    
    // Дополнительные цвета
    label: '#6366f1',
    value: '#213e89',
    checkboxAccent: '#2563eb',
    focusRing: 'rgba(33, 62, 137, 0.2)',
    
    // Дополнительные оттенки текста
    textQuaternary: '#9ca3af',
    textMuted: '#64748b',
    
    // Дополнительные оттенки фона
    backgroundQuaternary: '#f9fafb',
    backgroundHover: '#f3f4f6',
    backgroundActive: '#e5e7eb',
    backgroundDisabled: '#f3f4f6',
    
    // Дополнительные оттенки границ
    borderQuaternary: '#ced4da',
    inputBorder: '#ced4da',
    inputBorderFocus: '#3b82f6',
    inputBorderError: '#D60000',
    
    // Цвета для инпутов
    inputBg: '#ffffff',
    inputBgDisabled: '#f3f4f6',
    inputBgHover: '#ffffff',
    inputText: '#374151',
    inputPlaceholder: '#6b7280',
    inputError: '#ef4444',
    inputErrorBg: '#ffd6d6',
    
    // Цвета для теней и оверлеев
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    
    // Специальные цвета
    yellow: '#fed521',
    yellowLight: '#fff3cd',
    orange: '#f39c12',
    orangeLight: '#ffeaa7',
    purple: '#8b5cf6',
    purpleLight: '#e0e7ff',
    
    // Дополнительные оттенки primary для градиентов
    primaryGradientStart: '#213e89',
    primaryGradientEnd: '#1a3069',
  },
}

/**
 * Тема для проекта rusaisklad (склад) — серая палитра
 * Зелёные оттенки заменены на серые по значению и яркости
 */
export const rusaiskladTheme: ThemeConfig = {
  name: 'rusaisklad',
  colorsDark: rusaiskladColorsDark,
  colors: {
    // Основные цвета (серые: primary ~ gray-500, dark ~ gray-600/700, light ~ gray-400)
    primary: '#6b7280',       // gray-500
    primaryDark: '#4b5563',   // gray-600
    primaryLight: '#9ca3af',  // gray-400
    primaryHover: '#4b5563',
    primaryActive: '#374151', // gray-700
    
    // Вторичные цвета
    secondary: '#9ca3af',     // gray-400
    secondaryDark: '#6b7280', // gray-500
    secondaryLight: '#d1d5db', // gray-300
    
    // Акцентные цвета
    accent: '#6b7280',       // gray-500
    accentDark: '#4b5563',    // gray-600
    accentLight: '#9ca3af',   // gray-400
    
    // Цвета текста
    textPrimary: '#1f2937',
    textSecondary: '#374151',
    textTertiary: '#6b7280',
    textInverse: '#ffffff',
    
    // Цвета фона
    background: '#ffffff',
    backgroundSecondary: '#f8fafc',
    backgroundTertiary: '#f1f5f9',
    
    // Цвета границ
    border: '#e5e7eb',
    borderLight: '#e2e8f0',
    borderDark: '#d1d5db',
    
    // Статусные цвета (для rusaisklad success = серый, чтобы кнопки/акценты не были зелёными)
    success: '#6b7280',       // gray-500
    successLight: '#f3f4f6',  // gray-100
    successDark: '#4b5563',   // gray-600
    
    error: '#dc3545',
    errorLight: '#fee2e2',
    errorDark: '#c82333',
    
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    warningDark: '#d97706',
    
    info: '#6b7280',         // gray-500 вместо teal
    infoLight: '#f3f4f6',    // gray-100
    infoDark: '#4b5563',     // gray-600
    
    // Нейтральные цвета
    neutral: '#6b7280',
    neutralLight: '#9ca3af',
    neutralDark: '#374151',
    
    // Дополнительные цвета
    label: '#6b7280',
    value: '#4b5563',
    checkboxAccent: '#6b7280',
    focusRing: 'rgba(107, 114, 128, 0.2)',
    
    // Дополнительные оттенки текста
    textQuaternary: '#9ca3af',
    textMuted: '#64748b',
    
    // Дополнительные оттенки фона
    backgroundQuaternary: '#f9fafb',
    backgroundHover: '#f3f4f6',
    backgroundActive: '#e5e7eb',
    backgroundDisabled: '#f3f4f6',
    
    // Дополнительные оттенки границ
    borderQuaternary: '#ced4da',
    inputBorder: '#ced4da',
    inputBorderFocus: '#9ca3af',  // gray-400
    inputBorderError: '#D60000',
    
    // Цвета для инпутов
    inputBg: '#ffffff',
    inputBgDisabled: '#f3f4f6',
    inputBgHover: '#ffffff',
    inputText: '#374151',
    inputPlaceholder: '#6b7280',
    inputError: '#ef4444',
    inputErrorBg: '#ffd6d6',
    
    // Цвета для теней и оверлеев
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    
    // Специальные цвета
    yellow: '#fed521',
    yellowLight: '#fff3cd',
    orange: '#f39c12',
    orangeLight: '#ffeaa7',
    purple: '#8b5cf6',
    purpleLight: '#e0e7ff',
    
    // Дополнительные оттенки primary для градиентов
    primaryGradientStart: '#6b7280',  // gray-500
    primaryGradientEnd: '#4b5563',     // gray-600
  },
}

/**
 * Реестр всех доступных тем
 */
export const themes: Record<string, ThemeConfig> = {
  fintech: fintechTheme,
  rusaisklad: rusaiskladTheme,
}

/**
 * Получить тему по имени
 */
export function getTheme(name: string): ThemeConfig {
  return themes[name] || fintechTheme
}
