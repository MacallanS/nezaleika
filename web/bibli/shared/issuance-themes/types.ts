export type ThemePreset =
  | 'platform'
  | 'pilot'
  | 'magnit'
  | 'yandex'
  | 'otp'
  | 'five_cards';

export type IssuanceShellVariant = 'qr' | 'consent' | 'dual_qr';

export interface IssuanceThemeColors {
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  qrFrame: string;
  hover: string;
  border: string;
}

export interface IssuanceThemeBranding {
  headline?: string | null;
  subheadline?: string | null;
  showLogo: boolean;
  qrEmbedLogo: boolean;
}

export interface IssuanceThemeLayout {
  fullscreen: boolean;
  showCloseButton: boolean;
  backgroundImage?: string | null;
}

export interface IssuanceThemeTokens {
  preset: ThemePreset;
  variant: IssuanceShellVariant;
  colors: IssuanceThemeColors;
  branding: IssuanceThemeBranding;
  layout: IssuanceThemeLayout;
}

/** Whitelist subset applied per preset in mergeTheme (v1). */
export interface ThemeOverrides {
  colors?: Partial<Pick<IssuanceThemeColors, 'accent' | 'background' | 'surface'>>;
  branding?: Partial<
    Pick<IssuanceThemeBranding, 'headline' | 'subheadline' | 'showLogo' | 'qrEmbedLogo'>
  >;
}

export interface MergeThemeOptions {
  variant?: IssuanceShellVariant;
  /** Consent shell ignores overrides in v1 — preset only. */
  ignoreOverrides?: boolean;
}

export interface GenerateBrandedQrOptions {
  size?: number;
  logoRatio?: number;
}
