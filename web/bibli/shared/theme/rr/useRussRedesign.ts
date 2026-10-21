export type RussRedesignColorMode = 'light' | 'dark';
export type RussRedesignDensity = '75' | '100' | '116' | '133';
export type RussRedesignViewport = 'desktop' | 'mobile';

export interface RussRedesignOptions {
  enabled?: boolean;
  colorMode?: RussRedesignColorMode;
  density?: RussRedesignDensity;
  viewport?: RussRedesignViewport;
}

/**
 * Включает RR-токены на documentElement (атрибуты для generated CSS).
 * Для поверхностей (auth callback, profile) предпочитайте `useRussRedesignShell`,
 * чтобы корректно восстановить состояние при уходе со страницы.
 */
export function applyRussRedesign(options: RussRedesignOptions = {}): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  const {
    enabled = true,
    colorMode = 'light',
    density = '100',
    viewport = 'desktop',
  } = options;

  if (enabled) {
    root.setAttribute('data-rr', '');
  } else {
    root.removeAttribute('data-rr');
  }

  root.dataset.colorMode = colorMode;
  root.dataset.rrDensity = density;
  root.dataset.rrViewport = viewport;
}

export function useRussRedesign(options: RussRedesignOptions = {}): {
  apply: (patch?: RussRedesignOptions) => void;
} {
  applyRussRedesign(options);

  return {
    apply(patch) {
      applyRussRedesign({ ...options, ...patch });
    },
  };
}
