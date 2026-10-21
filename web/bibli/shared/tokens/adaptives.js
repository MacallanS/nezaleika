/**
 * Adaptives из tokens/source/*.tokens1.1 Dimention.json
 * @see bibli/shared/tokens/adaptives.css
 */
export const RR_ADAPTIVES_WIDTH_MOBILE = 390;
export const RR_ADAPTIVES_WIDTH_DESKTOP = 1440;
export const RR_ADAPTIVES_LAYOUT_SPLIT_MIN = 1024;

/**
 * @returns {{ mobile: number, desktop: number, splitMin: number, maxSplit: number }}
 */
export function readAdaptivesBreakpoints() {
  if (typeof document === 'undefined') {
    return {
      mobile: RR_ADAPTIVES_WIDTH_MOBILE,
      desktop: RR_ADAPTIVES_WIDTH_DESKTOP,
      splitMin: RR_ADAPTIVES_LAYOUT_SPLIT_MIN,
      maxSplit: RR_ADAPTIVES_LAYOUT_SPLIT_MIN - 1,
    };
  }

  const style = getComputedStyle(document.documentElement);
  const mobile = parseFloat(style.getPropertyValue('--rr-adaptives-width-mobile'))
    || RR_ADAPTIVES_WIDTH_MOBILE;
  const desktop = parseFloat(style.getPropertyValue('--rr-adaptives-width-desktop'))
    || RR_ADAPTIVES_WIDTH_DESKTOP;
  const splitMin = parseFloat(style.getPropertyValue('--rr-adaptives-layout-split-min'))
    || RR_ADAPTIVES_LAYOUT_SPLIT_MIN;

  return {
    mobile,
    desktop,
    splitMin,
    maxSplit: splitMin - 1,
  };
}

/** Узкий экран: stacked layout + mobile dimension/typography tokens */
export function isBelowSplitLayoutWidth(width = window.innerWidth) {
  return width < readAdaptivesBreakpoints().splitMin;
}

/** Ширина ниже desktop-artboard (1440) — только для desktop-only CSS (main-max, OTP 70px) */
export function isBelowDesktopAdaptivesWidth(width = window.innerWidth) {
  return width < readAdaptivesBreakpoints().desktop;
}
