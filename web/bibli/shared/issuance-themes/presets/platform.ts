import type { IssuanceShellVariant, IssuanceThemeTokens } from '../types';

const platformQr: Omit<IssuanceThemeTokens, 'preset' | 'variant'> = {
  colors: {
    accent: 'var(--russ-primary)',
    background: 'var(--russ-bg-blue-light)',
    surface: 'var(--russ-bg)',
    text: 'var(--russ-text-primary)',
    textSecondary: 'var(--russ-text-secondary)',
    qrFrame: 'var(--russ-bg)',
    hover: 'var(--russ-bg-hover)',
    border: 'var(--russ-border)',
  },
    branding: {
      headline: null,
      subheadline: null,
      showLogo: true,
      qrEmbedLogo: false,
    },
  layout: {
    fullscreen: false,
    showCloseButton: true,
    backgroundImage: null,
  },
};

const platformConsent: Omit<IssuanceThemeTokens, 'preset' | 'variant'> = {
  ...platformQr,
  colors: {
    ...platformQr.colors,
    background: 'var(--russ-bg)',
  },
  branding: {
    ...platformQr.branding,
    showLogo: false,
    qrEmbedLogo: false,
  },
};

export function platformPreset(variant: IssuanceShellVariant = 'qr'): IssuanceThemeTokens {
  const base = variant === 'consent' ? platformConsent : platformQr;

  return {
    preset: 'platform',
    variant,
    ...base,
  };
}
