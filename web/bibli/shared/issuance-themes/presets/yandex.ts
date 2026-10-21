import type { IssuanceShellVariant, IssuanceThemeTokens } from '../types';

export function yandexPreset(variant: IssuanceShellVariant = 'qr'): IssuanceThemeTokens {
  return {
    preset: 'yandex',
    variant,
    colors: {
      accent: 'var(--russ-yellow)',
      background: 'var(--russ-yellow)',
      surface: 'var(--russ-bg)',
      text: 'var(--russ-text-primary)',
      textSecondary: 'var(--russ-text-secondary)',
      qrFrame: 'var(--russ-bg)',
      hover: 'var(--russ-bg-hover)',
      border: 'var(--russ-border)',
    },
    branding: {
      headline: 'Получите подарки от Яндекса',
      subheadline: null,
      showLogo: true,
      qrEmbedLogo: false,
    },
    layout: {
      fullscreen: true,
      showCloseButton: true,
      backgroundImage: null,
    },
  };
}
