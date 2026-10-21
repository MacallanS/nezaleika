import type { IssuanceThemeTokens } from './types';
import { isHexColor, resolveContrastingTextColorsFromCss } from './contrastText';

const TOKEN_CSS_MAP: Record<keyof IssuanceThemeTokens['colors'], string> = {
  accent: '--issuance-accent',
  background: '--issuance-bg',
  surface: '--issuance-surface',
  text: '--issuance-text',
  textSecondary: '--issuance-text-secondary',
  qrFrame: '--issuance-qr-frame',
  hover: '--issuance-hover',
  border: '--issuance-border',
};

function resolveTextBackgroundColor(tokens: IssuanceThemeTokens): string {
  if (tokens.layout.fullscreen) {
    return tokens.colors.background;
  }

  return tokens.colors.surface;
}

function applyContrastTextColors(element: HTMLElement, tokens: IssuanceThemeTokens): void {
  if (tokens.layout.backgroundImage) {
    return;
  }

  const probe = document.createElement('div');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.style.background = resolveTextBackgroundColor(tokens);
  element.appendChild(probe);

  const resolved = getComputedStyle(probe).backgroundColor;
  probe.remove();

  const contrasting = resolveContrastingTextColorsFromCss(resolved);
  if (!contrasting) return;

  element.style.setProperty('--issuance-text', contrasting.text);
  element.style.setProperty('--issuance-text-secondary', contrasting.textSecondary);
}

export function applyTheme(element: HTMLElement, tokens: IssuanceThemeTokens): void {
  for (const [key, cssVar] of Object.entries(TOKEN_CSS_MAP)) {
    const value = tokens.colors[key as keyof IssuanceThemeTokens['colors']];
    element.style.setProperty(cssVar, value);
  }

  element.classList.add('issuance-shell');
  element.classList.add(`issuance-shell--${tokens.preset}`);
  element.classList.add(`issuance-shell--${tokens.variant}`);

  if (tokens.layout.fullscreen) {
    element.classList.add('issuance-shell--fullscreen');
  } else {
    element.classList.remove('issuance-shell--fullscreen');
  }

  if (tokens.layout.backgroundImage) {
    element.style.setProperty('--issuance-bg-image', `url(${tokens.layout.backgroundImage})`);
  } else {
    element.style.removeProperty('--issuance-bg-image');
  }

  applyContrastTextColors(element, tokens);
}

export function clearTheme(element: HTMLElement): void {
  for (const cssVar of Object.values(TOKEN_CSS_MAP)) {
    element.style.removeProperty(cssVar);
  }

  element.style.removeProperty('--issuance-bg-image');
  element.classList.remove(
    'issuance-shell',
    'issuance-shell--fullscreen',
    ...(Array.from(element.classList).filter((cls) => cls.startsWith('issuance-shell--'))),
  );
}
