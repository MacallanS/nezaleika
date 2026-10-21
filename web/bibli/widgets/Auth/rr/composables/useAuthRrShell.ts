import { onBeforeUnmount, onMounted } from 'vue';
import { applyRussRedesign } from 'bibli/shared/theme/rr/useRussRedesign';
import { mountAuthRrLayoutListeners } from './syncAuthRrLayout';

type DatasetSnapshot = Record<string, string | undefined>;

const SNAPSHOT_DATASET_KEYS = [
  'colorMode',
  'rrDensity',
  'rrViewport',
  'rrLayout',
] as const;

function snapshotRrDocumentState(): {
  hadDataRr: boolean;
  dataset: DatasetSnapshot;
} {
  const root = document.documentElement;
  const dataset: DatasetSnapshot = {};

  for (const key of SNAPSHOT_DATASET_KEYS) {
    dataset[key] = root.dataset[key];
  }

  return {
    hadDataRr: root.hasAttribute('data-rr'),
    dataset,
  };
}

function restoreRrDocumentState(snapshot: ReturnType<typeof snapshotRrDocumentState>): void {
  const root = document.documentElement;

  if (snapshot.hadDataRr) {
    root.setAttribute('data-rr', '');
  } else {
    root.removeAttribute('data-rr');
  }

  for (const [key, value] of Object.entries(snapshot.dataset)) {
    if (value === undefined) {
      delete root.dataset[key as keyof typeof root.dataset];
    } else {
      root.dataset[key as keyof typeof root.dataset] = value;
    }
  }
}

/**
 * Russ Redesign + layout breakpoints для fintech/rusaisklad /auth*.
 * Viewport/keyboard optimizers removed — browser handles resize/scroll.
 */
export function useAuthRrShell(): void {
  let snapshot: ReturnType<typeof snapshotRrDocumentState> | null = null;
  let unmountLayoutListeners: (() => void) | null = null;

  onMounted(() => {
    snapshot = snapshotRrDocumentState();
    applyRussRedesign({ enabled: true, colorMode: 'light', density: '100' });
    unmountLayoutListeners = mountAuthRrLayoutListeners();
  });

  onBeforeUnmount(() => {
    unmountLayoutListeners?.();
    unmountLayoutListeners = null;

    if (snapshot) {
      restoreRrDocumentState(snapshot);
    }
  });
}
