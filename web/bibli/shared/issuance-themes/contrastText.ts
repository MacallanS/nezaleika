/** Same relative luminance formula as MetricsModal / ShiftController. */
export const TEXT_LUMINANCE_THRESHOLD = 128;

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.replace('#', '').trim();
  if (![3, 6].includes(normalized.length)) return null;

  const full =
    normalized.length === 3
      ? normalized.split('').map(char => char + char).join('')
      : normalized;

  const int = Number.parseInt(full, 16);
  if (Number.isNaN(int)) return null;

  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

export function getLuminanceFromRgb(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getLuminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return getLuminanceFromRgb(rgb.r, rgb.g, rgb.b);
}

export function parseCssRgbColor(cssColor: string): { r: number; g: number; b: number } | null {
  const trimmed = cssColor.trim();
  if (!trimmed || trimmed === 'transparent') return null;

  const rgbMatch = trimmed.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    return {
      r: Number(rgbMatch[1]),
      g: Number(rgbMatch[2]),
      b: Number(rgbMatch[3]),
    };
  }

  if (trimmed.startsWith('#')) {
    return hexToRgb(trimmed);
  }

  return null;
}

export function resolveContrastingTextColors(
  r: number,
  g: number,
  b: number,
): { text: string; textSecondary: string } {
  const luminance = getLuminanceFromRgb(r, g, b);

  if (luminance > TEXT_LUMINANCE_THRESHOLD) {
    return {
      text: '#1f2937',
      textSecondary: '#4b5563',
    };
  }

  return {
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.85)',
  };
}

export function resolveContrastingTextColorsFromCss(
  cssColor: string,
): { text: string; textSecondary: string } | null {
  const rgb = parseCssRgbColor(cssColor);
  if (!rgb) return null;
  return resolveContrastingTextColors(rgb.r, rgb.g, rgb.b);
}

export function isHexColor(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
}
