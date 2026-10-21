import { describe, expect, it } from 'vitest';
import {
  getLuminance,
  resolveContrastingTextColors,
  resolveContrastingTextColorsFromCss,
} from './contrastText';

describe('contrastText', () => {
  it('uses dark text on light backgrounds', () => {
    expect(resolveContrastingTextColors(255, 255, 255)).toEqual({
      text: '#1f2937',
      textSecondary: '#4b5563',
    });
    expect(resolveContrastingTextColorsFromCss('#ffcc00')).toEqual({
      text: '#1f2937',
      textSecondary: '#4b5563',
    });
  });

  it('uses light text on dark backgrounds', () => {
    expect(resolveContrastingTextColors(20, 30, 40)).toEqual({
      text: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.85)',
    });
    expect(resolveContrastingTextColorsFromCss('rgb(20, 30, 40)')).toEqual({
      text: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.85)',
    });
  });

  it('matches MetricsModal luminance formula', () => {
    expect(getLuminance('#ffffff')).toBeCloseTo(255, 0);
    expect(getLuminance('#000000')).toBe(0);
  });
});
