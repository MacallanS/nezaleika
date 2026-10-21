import { FLOATING_LAYER_Z_INDEX } from './layerZIndex';

/** Отступ между триггером (селект) и teleported-панелью со списком. */
export const FLOATING_PANEL_ANCHOR_GAP = 4;

export type FloatingPlacement = 'above' | 'below';

export interface FloatingViewport {
  top: number;
  left: number;
  width: number;
  height: number;
  padding: number;
}

export interface ComputeFloatingPlacementOptions {
  estimatedHeight: number;
  maxHeight: number;
  minHeight?: number;
  padding?: number;
  /** Зазор между якорем и панелью, закладывается в top / bottom (без margin). */
  anchorGap?: number;
  containerRect?: DOMRect | null;
  minWidth?: number;
  /** Multiplier for panel width relative to anchor width (e.g. 1.2 = 120%). */
  widthScale?: number;
  /** When set, width and horizontal position use this rect instead of the trigger rect. */
  widthRect?: DOMRect | null;
}

/** Wider layout anchor for filter chips — panel aligns to the chip, not the squeezed trigger. */
export function resolveFloatingWidthAnchor(anchor: Element): Element {
  return anchor.closest('.rr-filter-chip') ?? anchor;
}

const DEFAULT_PANEL_WIDTH_SCALE = 1;

function parseCssNumber(raw: string): number | null {
  const value = parseFloat(raw);
  return Number.isFinite(value) ? value : null;
}

/**
 * Reads `--rr-floating-panel-width-scale` (or legacy aliases) from the anchor.
 * Supports unitless multipliers (`1.2`) and percentages (`120%`).
 */
export function getFloatingPanelWidthScale(element: Element): number {
  if (typeof window === 'undefined') return DEFAULT_PANEL_WIDTH_SCALE;

  const styles = getComputedStyle(element);
  const raw =
    styles.getPropertyValue('--rr-floating-panel-width-scale').trim()
    || styles.getPropertyValue('--rr-multi-select-panel-width-scale').trim()
    || styles.getPropertyValue('--status-select-panel-width-scale').trim();

  if (!raw) return DEFAULT_PANEL_WIDTH_SCALE;

  if (raw.endsWith('%')) {
    const pct = parseCssNumber(raw.slice(0, -1));
    return pct != null && pct > 0 ? pct / 100 : DEFAULT_PANEL_WIDTH_SCALE;
  }

  const num = parseCssNumber(raw);
  return num != null && num > 0 ? num : DEFAULT_PANEL_WIDTH_SCALE;
}

/** Reads optional `--rr-floating-panel-min-width` override (px). */
export function getFloatingPanelMinWidth(element: Element, fallback = 0): number {
  if (typeof window === 'undefined') return fallback;

  const raw = getComputedStyle(element).getPropertyValue('--rr-floating-panel-min-width').trim();
  if (!raw) return fallback;

  const num = parseCssNumber(raw);
  return num != null && num >= 0 ? num : fallback;
}

export interface ComputeFloatingPlacementResult {
  placement: FloatingPlacement;
  viewport: FloatingViewport;
  maxHeight: number;
  left: number;
  width: number;
  top?: number;
  bottom?: number;
}

function getVisualViewportSnapshot(padding: number): FloatingViewport {
  if (typeof window === 'undefined') {
    return { top: 0, left: 0, width: 0, height: 0, padding };
  }

  const vv = window.visualViewport;
  if (!vv) {
    return {
      top: 0,
      left: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      padding,
    };
  }

  return {
    top: vv.offsetTop || 0,
    left: vv.offsetLeft || 0,
    width: vv.width || window.innerWidth,
    height: vv.height || window.innerHeight,
    padding,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const FLOATING_SCROLL_CONTAINERS: ReadonlyArray<{
  root: string;
  scroll: string;
}> = [
  { root: '.profile-bottom-sheet', scroll: '.profile-bottom-sheet__body' },
  { root: '.mobile-filters-modal', scroll: '.mobile-filters-content' },
  { root: '.ruchnik-drawer', scroll: '.ruchnik-drawer-body' },
];

function findFloatingScrollElement(anchor: Element): Element | null {
  for (const { root, scroll } of FLOATING_SCROLL_CONTAINERS) {
    const container = anchor.closest(root);
    if (!container) continue;
    const scrollEl = container.querySelector(scroll);
    return scrollEl ?? container;
  }
  return null;
}

/**
 * Visible scroll bounds of a constrained overlay (mobile filters sheet, drawer body, etc.).
 */
export function getMobileFiltersBounds(anchor: Element): DOMRect | null {
  const scrollEl = findFloatingScrollElement(anchor);
  return scrollEl?.getBoundingClientRect() ?? null;
}

/** Scroll container to listen for reposition while a floating panel is open. */
export function getFloatingScrollContainer(anchor: Element): Element | null {
  return findFloatingScrollElement(anchor);
}

/**
 * Computes best placement (above/below) and constrained maxHeight for a fixed-position floating panel.
 * Uses VisualViewport when available to keep the panel inside the actually visible area (browser bars, keyboard).
 */
export function computeFloatingPlacement(
  anchorRect: DOMRect,
  options: ComputeFloatingPlacementOptions,
): ComputeFloatingPlacementResult {
  const padding = options.padding ?? 8;
  const anchorGap = options.anchorGap ?? FLOATING_PANEL_ANCHOR_GAP;
  const viewport = getVisualViewportSnapshot(padding);

  const viewportTop = viewport.top + padding;
  const viewportBottom = viewport.top + viewport.height - padding;

  const verticalTop = options.containerRect ? options.containerRect.top : viewportTop;
  const verticalBottom = options.containerRect ? options.containerRect.bottom : viewportBottom;

  const spaceAbove = Math.max(0, anchorRect.top - verticalTop);
  const spaceBelow = Math.max(0, verticalBottom - anchorRect.bottom);

  const desiredHeight = Math.min(options.estimatedHeight, options.maxHeight);
  const minOpen = Math.min(desiredHeight, 80) + anchorGap;
  const fitsBelow = spaceBelow >= minOpen;
  const fitsAbove = spaceAbove >= minOpen;

  let placement: FloatingPlacement;
  if (fitsBelow && fitsAbove) {
    placement = spaceBelow >= spaceAbove ? 'below' : 'above';
  } else if (fitsBelow) {
    placement = 'below';
  } else if (fitsAbove) {
    placement = 'above';
  } else {
    placement = spaceBelow >= spaceAbove ? 'below' : 'above';
  }

  if (placement === 'above' && spaceAbove < anchorGap && spaceBelow > spaceAbove) {
    placement = 'below';
  } else if (placement === 'below' && spaceBelow < anchorGap && spaceAbove > spaceBelow) {
    placement = 'above';
  }

  const available = placement === 'above' ? spaceAbove : spaceBelow;
  const maxHeight = Math.min(
    options.maxHeight,
    Math.max(0, available - anchorGap),
  );

  const viewportLeft = viewport.left + padding;
  const viewportRight = viewport.left + viewport.width - padding;

  const widthSource = options.widthRect ?? anchorRect;

  const widthScale = options.widthScale ?? DEFAULT_PANEL_WIDTH_SCALE;
  const minWidth = options.minWidth ?? 0;
  let width = widthSource.width * widthScale;
  if (minWidth > 0) {
    width = Math.max(width, minWidth);
  }
  width = Math.min(width, Math.max(0, viewportRight - viewportLeft));

  let left = widthSource.left;
  left = clamp(left, viewportLeft, Math.max(viewportLeft, viewportRight - width));

  if (placement === 'above') {
    return {
      placement,
      viewport,
      maxHeight,
      left,
      width,
      bottom: (typeof window !== 'undefined' ? window.innerHeight : viewport.top + viewport.height) - anchorRect.top,
    };
  }

  return {
    placement,
    viewport,
    maxHeight,
    left,
    width,
    top: anchorRect.bottom,
  };
}

export interface BuildFixedFloatingStylesOptions {
  padding?: number;
  anchorGap?: number;
  containerRect?: DOMRect | null;
  zIndex?: number;
}

/**
 * Builds fixed-position inline styles for a teleported dropdown/calendar.
 * Gap is baked into top/bottom so the panel sits 4px from the trigger without margin.
 */
export function buildFixedFloatingStyles(
  anchorRect: DOMRect,
  result: ComputeFloatingPlacementResult,
  options: BuildFixedFloatingStylesOptions = {},
): Record<string, string | number> {
  const anchorGap = options.anchorGap ?? FLOATING_PANEL_ANCHOR_GAP;
  const zIndex = options.zIndex ?? FLOATING_LAYER_Z_INDEX;

  const base = {
    position: 'fixed' as const,
    left: `${result.left}px`,
    width: `${result.width}px`,
    maxHeight: `${result.maxHeight}px`,
    overflowY: 'auto' as const,
    zIndex,
    marginTop: 0,
    marginBottom: 0,
  };

  if (result.placement === 'above') {
    const viewportHeight =
      typeof window !== 'undefined'
        ? window.innerHeight
        : result.viewport.top + result.viewport.height;

    return {
      ...base,
      top: 'auto',
      bottom: `${viewportHeight - anchorRect.top + anchorGap}px`,
    };
  }

  return {
    ...base,
    top: `${(result.top ?? anchorRect.bottom) + anchorGap}px`,
    bottom: 'auto',
  };
}

