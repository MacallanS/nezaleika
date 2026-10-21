import { onBeforeUnmount, onMounted } from 'vue'
import {
  applyRussRedesign,
  type RussRedesignColorMode,
  type RussRedesignDensity,
} from './useRussRedesign'

type DatasetSnapshot = {
  hadDataRr: boolean
  colorMode?: string
  rrDensity?: string
  rrViewport?: string
}

export interface RussRedesignShellOptions {
  colorMode?: RussRedesignColorMode
  density?: RussRedesignDensity
  /** Viewport switches to mobile below this width. Default 1024. */
  mobileBreakpoint?: number
}

/**
 * Включает RR-токены (data-rr, --rr-*) на время жизни компонента и
 * восстанавливает предыдущее состояние documentElement при unmount.
 * Используйте один раз на корне поверхности (layout / parent route),
 * а не на каждой дочерней странице — иначе RR мигает при навигации.
 */
export function useRussRedesignShell(options: RussRedesignShellOptions = {}): void {
  const colorMode = options.colorMode ?? 'light'
  const density = options.density ?? '100'
  const mobileBreakpoint = options.mobileBreakpoint ?? 1024

  let snapshot: DatasetSnapshot | null = null

  function syncViewport(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return
    applyRussRedesign({
      enabled: true,
      colorMode,
      density,
      viewport: window.innerWidth < mobileBreakpoint ? 'mobile' : 'desktop',
    })
  }

  function takeSnapshot(): DatasetSnapshot {
    const root = document.documentElement
    return {
      hadDataRr: root.hasAttribute('data-rr'),
      colorMode: root.dataset.colorMode,
      rrDensity: root.dataset.rrDensity,
      rrViewport: root.dataset.rrViewport,
    }
  }

  function restoreSnapshot(prev: DatasetSnapshot): void {
    const root = document.documentElement
    if (prev.hadDataRr) {
      root.setAttribute('data-rr', '')
    } else {
      root.removeAttribute('data-rr')
    }

    if (prev.colorMode === undefined) delete root.dataset.colorMode
    else root.dataset.colorMode = prev.colorMode

    if (prev.rrDensity === undefined) delete root.dataset.rrDensity
    else root.dataset.rrDensity = prev.rrDensity

    if (prev.rrViewport === undefined) delete root.dataset.rrViewport
    else root.dataset.rrViewport = prev.rrViewport
  }

  onMounted(() => {
    snapshot = takeSnapshot()
    syncViewport()
    window.addEventListener('resize', syncViewport)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', syncViewport)
    if (snapshot) restoreSnapshot(snapshot)
  })
}
