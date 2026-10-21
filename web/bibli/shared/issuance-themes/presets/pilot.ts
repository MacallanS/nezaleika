import type { IssuanceShellVariant, IssuanceThemeTokens } from '../types';

/**
 * Пилот / тестовый продукт: для qr_scan визуально как Яндекс
 * (жёлтый fullscreen, подпись, логотип над QR).
 */
export function pilotPreset(variant: IssuanceShellVariant = 'qr'): IssuanceThemeTokens {
  const isConsent = variant === 'consent';

  return {
    preset: 'pilot',
    variant,
    colors: {
      accent: 'var(--russ-yellow)',
      background: isConsent ? 'var(--russ-bg)' : 'var(--russ-yellow)',
      surface: 'var(--russ-bg)',
      text: 'var(--russ-text-primary)',
      textSecondary: 'var(--russ-text-secondary)',
      qrFrame: 'var(--russ-bg)',
      hover: 'var(--russ-bg-hover)',
      border: 'var(--russ-border)',
    },
    branding: {
      headline: isConsent ? null : 'Тестовая выдача',
      subheadline: null,
      showLogo: !isConsent,
      qrEmbedLogo: false,
    },
    layout: {
      fullscreen: !isConsent,
      showCloseButton: true,
      backgroundImage: null,
    },
  };
}
