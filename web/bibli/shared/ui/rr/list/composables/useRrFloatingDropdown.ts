import { nextTick, onBeforeUnmount, ref, type Ref } from 'vue'
import {
  buildFixedFloatingStyles,
  computeFloatingPlacement,
  FLOATING_PANEL_ANCHOR_GAP,
  getFloatingPanelMinWidth,
  getFloatingPanelWidthScale,
  getFloatingScrollContainer,
  getMobileFiltersBounds,
  resolveFloatingWidthAnchor,
  type FloatingPlacement,
} from 'bibli/shared/utils/floatingPlacement'
import { FLOATING_LAYER_Z_INDEX } from 'bibli/shared/utils/layerZIndex'

export interface UseRrFloatingDropdownOptions {
  estimatedHeight?: number
  maxHeight?: number
  minWidth?: number
  widthScale?: number
  padding?: number
  anchorGap?: number
  zIndex?: number
  disableAutoPosition?: boolean
}

const DEFAULT_ESTIMATED_HEIGHT = 280
const DEFAULT_MAX_HEIGHT = 320
const DEFAULT_MIN_WIDTH = 0
const DEFAULT_VIEWPORT_PADDING = 8

export function useRrFloatingDropdown(
  anchorRef: Ref<HTMLElement | null>,
  panelRef: Ref<HTMLElement | null>,
  isOpen: Ref<boolean>,
  options: UseRrFloatingDropdownOptions = {},
) {
  const placement = ref<FloatingPlacement>('below')
  const panelStyles = ref<Record<string, string | number>>({})

  let rafId = 0
  let resizeObserver: ResizeObserver | null = null
  let scrollContainerEl: Element | null = null

  const padding = options.padding ?? DEFAULT_VIEWPORT_PADDING
  const anchorGap = options.anchorGap ?? FLOATING_PANEL_ANCHOR_GAP
  const maxHeight = options.maxHeight ?? DEFAULT_MAX_HEIGHT
  const zIndex = options.zIndex ?? FLOATING_LAYER_Z_INDEX

  function resolveWidthOptions(anchor: HTMLElement) {
    const widthScale = options.widthScale ?? getFloatingPanelWidthScale(anchor)
    const minWidth = options.minWidth ?? getFloatingPanelMinWidth(anchor, DEFAULT_MIN_WIDTH)
    return { widthScale, minWidth }
  }

  function measurePanelHeight(fallback = options.estimatedHeight ?? DEFAULT_ESTIMATED_HEIGHT): number {
    const panel = panelRef.value
    if (!panel) return fallback
    const measured = panel.getBoundingClientRect().height
    return measured > 0 ? measured : fallback
  }

  function updatePosition() {
    const anchor = anchorRef.value
    if (!anchor || !isOpen.value) return

    const positionAnchor = resolveFloatingWidthAnchor(anchor)
    const rect = positionAnchor.getBoundingClientRect()
    const widthAnchor = positionAnchor
    const widthRect = widthAnchor.getBoundingClientRect()
    const measuredHeight = measurePanelHeight()
    const filtersBounds = getMobileFiltersBounds(anchor)
    const { widthScale, minWidth } = resolveWidthOptions(widthAnchor)

    const result = computeFloatingPlacement(rect, {
      estimatedHeight: measuredHeight,
      maxHeight,
      padding,
      anchorGap,
      minWidth,
      widthScale,
      widthRect,
      containerRect: filtersBounds,
    })

    placement.value = options.disableAutoPosition ? 'below' : result.placement

    panelStyles.value = buildFixedFloatingStyles(rect, result, {
      padding,
      anchorGap,
      containerRect: filtersBounds,
      zIndex,
    })
  }

  function scheduleUpdate() {
    if (rafId) cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(() => {
      rafId = 0
      updatePosition()
    })
  }

  function bindListeners() {
    window.addEventListener('resize', scheduleUpdate)
    window.addEventListener('scroll', scheduleUpdate, true)
    window.visualViewport?.addEventListener('resize', scheduleUpdate)
    window.visualViewport?.addEventListener('scroll', scheduleUpdate)

    const anchor = anchorRef.value
    scrollContainerEl = anchor ? getFloatingScrollContainer(anchor) : null
    scrollContainerEl?.addEventListener('scroll', scheduleUpdate, { passive: true })

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => scheduleUpdate())
      if (panelRef.value) resizeObserver.observe(panelRef.value)
      if (anchorRef.value) resizeObserver.observe(anchorRef.value)
    }
  }

  function unbindListeners() {
    window.removeEventListener('resize', scheduleUpdate)
    window.removeEventListener('scroll', scheduleUpdate, true)
    window.visualViewport?.removeEventListener('resize', scheduleUpdate)
    window.visualViewport?.removeEventListener('scroll', scheduleUpdate)

    scrollContainerEl?.removeEventListener('scroll', scheduleUpdate)
    scrollContainerEl = null

    resizeObserver?.disconnect()
    resizeObserver = null
  }

  async function repositionWhenOpen() {
    await nextTick()
    scheduleUpdate()
    await nextTick()
    scheduleUpdate()
  }

  function startTracking() {
    stopTracking()
    bindListeners()
    void repositionWhenOpen()
  }

  function stopTracking() {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
    unbindListeners()
  }

  onBeforeUnmount(() => {
    stopTracking()
  })

  return {
    placement,
    panelStyles,
    updatePosition,
    scheduleUpdate,
    startTracking,
    stopTracking,
    repositionWhenOpen,
  }
}
