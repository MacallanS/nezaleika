import type { IssuanceShellVariant, IssuanceThemeTokens } from '../types';

export function fiveCardsPreset(variant: IssuanceShellVariant = 'qr'): IssuanceThemeTokens {
  return {
    preset: 'five_cards',
    variant,
    colors: {
      accent: 'var(--russ-primary)',
      background: 'var(--russ-overlay)',
      surface: 'var(--russ-bg)',
      text: 'var(--russ-text-primary)',
      textSecondary: 'var(--russ-text-secondary)',
      qrFrame: 'transparent',
      hover: 'var(--russ-bg-hover)',
      border: 'var(--russ-border)',
    },
    branding: {
      headline: null,
      subheadline: null,
      showLogo: false,
      qrEmbedLogo: false,
    },
    layout: {
      fullscreen: false,
      showCloseButton: true,
      backgroundImage: '/5kart.webp',
    },
  };
}
