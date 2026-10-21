import type { IssuanceShellVariant, IssuanceThemeTokens } from '../types';

export function otpPreset(variant: IssuanceShellVariant = 'qr'): IssuanceThemeTokens {
  const isConsent = variant === 'consent';

  return {
    preset: 'otp',
    variant,
    colors: {
      accent: 'var(--russ-legacy-4e2d68)',
      background: isConsent
        ? 'linear-gradient(135deg, var(--russ-legacy-c1ff05) 0%, var(--russ-legacy-d8ff57) 38%, var(--russ-text-inverse) 100%)'
        : 'linear-gradient(135deg, var(--russ-legacy-c1ff05) 0%, var(--russ-legacy-d8ff57) 38%, var(--russ-text-inverse) 100%)',
      surface: 'rgba(255, 255, 255, 0.72)',
      text: 'var(--russ-legacy-351d47)',
      textSecondary: 'var(--russ-legacy-4e2d68)',
      qrFrame: 'var(--russ-text-inverse)',
      hover: 'var(--russ-bg-hover)',
      border: 'var(--russ-legacy-9e6fc3)',
    },
    branding: {
      headline: 'Наведите камеру на QR-код',
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
