import { describe, expect, it } from 'vitest';
import { mergeTheme } from './mergeTheme';

describe('mergeTheme', () => {
  it('returns platform preset tokens by default', () => {
    const theme = mergeTheme('platform');

    expect(theme.preset).toBe('platform');
    expect(theme.variant).toBe('qr');
    expect(theme.colors.background).toBe('var(--russ-bg-blue-light)');
    expect(theme.branding.qrEmbedLogo).toBe(false);
  });

  it('uses white background for platform consent variant', () => {
    const theme = mergeTheme('platform', null, { variant: 'consent' });

    expect(theme.variant).toBe('consent');
    expect(theme.colors.background).toBe('var(--russ-bg)');
    expect(theme.branding.showLogo).toBe(false);
  });

  it('applies yandex v1 overrides for headline and background only', () => {
    const theme = mergeTheme('yandex', {
      colors: {
        accent: '#ff0000',
        background: '#112233',
        surface: '#ffffff',
      },
      branding: {
        headline: 'Custom headline',
        subheadline: 'Ignored subheadline',
        showLogo: false,
      },
    });

    expect(theme.colors.background).toBe('#112233');
    expect(theme.colors.surface).toBe('#112233');
    expect(theme.branding.headline).toBe('Custom headline');
    expect(theme.colors.accent).toBe('var(--russ-yellow)');
    expect(theme.branding.subheadline).toBe('Ignored subheadline');
    expect(theme.branding.showLogo).toBe(true);
    expect(theme.branding.qrEmbedLogo).toBe(false);
  });

  it('ignores overrides for non-yandex presets', () => {
    const theme = mergeTheme('magnit', {
      colors: { background: '#000000' },
      branding: { headline: 'Should not apply' },
    });

    expect(theme.colors.background).not.toBe('#000000');
    expect(theme.branding.headline).not.toBe('Should not apply');
  });

  it('applies platform qr overrides for headline and background', () => {
    const theme = mergeTheme('platform', {
      colors: { background: '#aabbcc' },
      branding: { headline: 'Сканируйте QR' },
    });

    expect(theme.colors.background).toBe('#aabbcc');
    expect(theme.colors.surface).toBe('#aabbcc');
    expect(theme.branding.headline).toBe('Сканируйте QR');
  });

  it('ignores overrides for consent shell regardless of preset', () => {
    const theme = mergeTheme(
      'yandex',
      {
        colors: { background: '#112233' },
        branding: { headline: 'Consent headline' },
      },
      { variant: 'consent' },
    );

    expect(theme.variant).toBe('consent');
    expect(theme.colors.background).toBe('var(--russ-yellow)');
    expect(theme.branding.headline).toBe('Получите подарки от Яндекса');
  });

  it('returns pilot yandex-like tokens for test QR products', () => {
    const theme = mergeTheme('pilot');

    expect(theme.preset).toBe('pilot');
    expect(theme.colors.background).toBe('var(--russ-yellow)');
    expect(theme.branding.headline).toContain('Тестовая');
    expect(theme.branding.qrEmbedLogo).toBe(false);
    expect(theme.branding.showLogo).toBe(true);
  });
});
