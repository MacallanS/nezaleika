import type { IssuanceShellVariant, IssuanceThemeTokens } from '../types';

export function magnitPreset(variant: IssuanceShellVariant = 'qr'): IssuanceThemeTokens {
  const isDual = variant === 'dual_qr';

  return {
    preset: 'magnit',
    variant: isDual ? 'dual_qr' : variant,
    colors: {
      accent: 'var(--russ-error)',
      background: 'var(--russ-overlay)',
      surface: 'var(--russ-bg)',
      text: 'var(--russ-text-primary)',
      textSecondary: 'var(--russ-text-secondary)',
      qrFrame: 'var(--russ-bg)',
      hover: 'var(--russ-bg-hover)',
      border: 'var(--russ-border)',
    },
    branding: {
      headline: 'Сканируйте QR код для получения продукта',
      subheadline: null,
      showLogo: false,
      qrEmbedLogo: false,
    },
    layout: {
      fullscreen: false,
      showCloseButton: true,
      backgroundImage: '/Magnit.webp',
    },
  };
}
