import {
  isBelowSplitLayoutWidth,
  readAdaptivesBreakpoints,
} from 'bibli/shared/tokens/adaptives.js';
import { syncAuthRrThemeColorForVisibleShell } from '../syncAuthRrThemeColor';

const STALE_DATASET_KEYS = ['rrKeyboard', 'rrCompact', 'rrScroll'] as const;
const STALE_STYLE_PROPS = ['--vvh', '--auth-vvh-visual', '--auth-rr-shift-y'] as const;

let syncRaf = 0;

export type SyncAuthRrLayoutOptions = {
  /** Страница без split-layout (например auth-preview-unavailable). */
  unavailableSelector?: string;
};

/** Сброс legacy data-rr-* / CSS vars от старых viewport-оптимизаторов. */
export function clearStaleAuthRrDocumentState(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  for (const key of STALE_DATASET_KEYS) {
    delete root.dataset[key];
  }
  for (const prop of STALE_STYLE_PROPS) {
    root.style.removeProperty(prop);
  }
}

/** split/stacked + mobile/desktop + theme-color. Без keyboard/scroll/--vvh. */
export function syncAuthRrLayout(options: SyncAuthRrLayoutOptions = {}): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  clearStaleAuthRrDocumentState();

  if (options.unavailableSelector && document.querySelector(options.unavailableSelector)) {
    delete document.documentElement.dataset.rrLayout;
    document.documentElement.dataset.rrViewport = isBelowSplitLayoutWidth()
      ? 'mobile'
      : 'desktop';
    syncAuthRrThemeColorForVisibleShell();
    return;
  }

  const { splitMin } = readAdaptivesBreakpoints();
  document.documentElement.dataset.rrLayout =
    window.innerWidth >= splitMin ? 'split' : 'stacked';
  document.documentElement.dataset.rrViewport = isBelowSplitLayoutWidth()
    ? 'mobile'
    : 'desktop';
  syncAuthRrThemeColorForVisibleShell();
}

export function scheduleAuthRrLayoutSync(options: SyncAuthRrLayoutOptions = {}): void {
  if (syncRaf) {
    return;
  }

  syncRaf = window.requestAnimationFrame(() => {
    syncRaf = 0;
    syncAuthRrLayout(options);
  });
}

/** resize/orientation → rAF sync. Возвращает cleanup. */
export function mountAuthRrLayoutListeners(
  options: SyncAuthRrLayoutOptions = {},
): () => void {
  const onChange = () => scheduleAuthRrLayoutSync(options);

  onChange();
  window.addEventListener('resize', onChange);
  window.addEventListener('orientationchange', onChange);

  return () => {
    if (syncRaf) {
      cancelAnimationFrame(syncRaf);
      syncRaf = 0;
    }
    window.removeEventListener('resize', onChange);
    window.removeEventListener('orientationchange', onChange);
    clearStaleAuthRrDocumentState();
  };
}
