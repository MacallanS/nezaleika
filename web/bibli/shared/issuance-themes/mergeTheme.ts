import { getPresetTokens } from './presets';
import { isHexColor } from './contrastText';
import type {
  IssuanceShellVariant,
  IssuanceThemeTokens,
  MergeThemeOptions,
  ThemeOverrides,
  ThemePreset,
} from './types';

function cloneTokens(tokens: IssuanceThemeTokens): IssuanceThemeTokens {
  return {
    ...tokens,
    colors: { ...tokens.colors },
    branding: { ...tokens.branding },
    layout: { ...tokens.layout },
  };
}

/** v1 whitelist: headline + background overrides for QR shells (platform / pilot / yandex). */
const QR_OVERRIDE_PRESETS = new Set<ThemePreset>(['yandex', 'platform', 'pilot']);

function applyWhitelistedOverrides(
  preset: ThemePreset,
  variant: IssuanceShellVariant,
  tokens: IssuanceThemeTokens,
  overrides: ThemeOverrides | null | undefined,
): IssuanceThemeTokens {
  if (!overrides || variant === 'consent') {
    return tokens;
  }

  if (variant !== 'qr' || !QR_OVERRIDE_PRESETS.has(preset)) {
    return tokens;
  }

  const merged = cloneTokens(tokens);

  if (overrides.colors?.background) {
    merged.colors.background = overrides.colors.background;
    if (isHexColor(overrides.colors.background)) {
      merged.colors.surface = overrides.colors.background;
    }
  }

  if (overrides.branding?.headline !== undefined) {
    merged.branding.headline = overrides.branding.headline;
  }

  if (overrides.branding?.subheadline !== undefined) {
    merged.branding.subheadline = overrides.branding.subheadline;
  }

  return merged;
}

export function mergeTheme(
  preset: ThemePreset,
  overrides?: ThemeOverrides | null,
  options: MergeThemeOptions = {},
): IssuanceThemeTokens {
  const variant = options.variant ?? 'qr';
  const base = getPresetTokens(preset, variant);

  if (options.ignoreOverrides || variant === 'consent') {
    return base;
  }

  return applyWhitelistedOverrides(preset, variant, base, overrides);
}

export function isIssuanceThemeTokens(value: unknown): value is IssuanceThemeTokens {
  return (
    !!value &&
    typeof value === 'object' &&
    'layout' in value &&
    'colors' in value &&
    'branding' in value
  );
}

/** Shell `theme` prop must be full tokens; preset-resolution objects are ignored. */
export function resolveShellTheme(
  theme: IssuanceThemeTokens | undefined,
  preset: ThemePreset,
  overrides: ThemeOverrides | null | undefined,
  options: MergeThemeOptions = {},
): IssuanceThemeTokens {
  if (isIssuanceThemeTokens(theme)) {
    return theme;
  }

  return mergeTheme(preset, overrides, options);
}
