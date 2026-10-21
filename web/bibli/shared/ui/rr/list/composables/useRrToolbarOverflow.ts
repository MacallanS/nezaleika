import { computed, nextTick, onBeforeUnmount, onMounted, ref, unref, watch, type MaybeRef } from 'vue'

export interface UseRrToolbarOverflowOptions {
  /** Минимальная ширина поиска при сжатии, px */
  minFlexibleWidth?: number
  /** Отступ между элементами, px — если не задан, читается из gap контейнера */
  gap?: number
  /** На компактной ширине (media) overflow-режим отключён */
  compact?: MaybeRef<boolean>
}

function readGap(element: HTMLElement, fallback = 8): number {
  const raw = getComputedStyle(element).columnGap || getComputedStyle(element).gap
  const parsed = parseFloat(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

/**
 * Помещаются ли фильтры в одну строку вместе с минимальным поиском.
 * При нехватке места — `isTight` (прячем опциональные чипы).
 * Если и после этого не влезает — `needsSheet` (уходим в bottom sheet).
 */
export function useRrToolbarOverflow(options: UseRrToolbarOverflowOptions = {}) {
  const rootRef = ref<HTMLElement | null>(null)
  const measureRef = ref<HTMLElement | null>(null)
  const actionsRef = ref<HTMLElement | null>(null)

  const isOverflowing = ref(false)
  /** Даже с спрятанными optional-чипами ряд не влезает рядом с actions. */
  const needsSheet = ref(false)
  const isReady = ref(false)

  /** Тесно на десктопе — можно прятать второстепенные фильтры (точка / проект). */
  const isTight = computed(() => isOverflowing.value && !unref(options.compact))

  let resizeObserver: ResizeObserver | null = null

  function measureOptionalWidth(measure: HTMLElement, gap: number): number {
    let optionalWidth = 0
    const optionals = measure.querySelectorAll<HTMLElement>(
      '[data-rr-toolbar-optional]:not([data-rr-toolbar-optional-active])',
    )
    optionals.forEach((el) => {
      const w = el.offsetWidth
      if (w > 0) optionalWidth += w + gap
    })
    return optionalWidth
  }

  function measure() {
    const root = rootRef.value
    const measureEl = measureRef.value
    const actions = actionsRef.value

    if (!root || !measureEl || !actions) {
      isOverflowing.value = false
      needsSheet.value = false
      return
    }

    // В media-compact measure скрыт (display:none) — ширины 0, sheet решает media.
    if (measureEl.offsetParent === null && measureEl.offsetWidth === 0) {
      isOverflowing.value = false
      needsSheet.value = false
      return
    }

    const gap = options.gap ?? readGap(root)
    const minFlexible = options.minFlexibleWidth ?? 220
    const chipsWidth = measureEl.offsetWidth
    const actionsWidth = actions.offsetWidth
    const rootWidth = root.clientWidth
    const optionalWidth = measureOptionalWidth(measureEl, gap)

    const fullNeeded = minFlexible + chipsWidth + actionsWidth + gap * 2
    const afterTightNeeded =
      minFlexible + Math.max(0, chipsWidth - optionalWidth) + actionsWidth + gap * 2

    isOverflowing.value = chipsWidth > 0 && fullNeeded > rootWidth + 0.5
    needsSheet.value = chipsWidth > 0 && afterTightNeeded > rootWidth + 0.5
  }

  async function scheduleMeasure() {
    await nextTick()
    measure()
    isReady.value = true
  }

  onMounted(() => {
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        measure()
      })

      if (rootRef.value) resizeObserver.observe(rootRef.value)
      if (measureRef.value) resizeObserver.observe(measureRef.value)
      if (actionsRef.value) resizeObserver.observe(actionsRef.value)
    }

    window.addEventListener('resize', measure)
    void scheduleMeasure()
  })

  onBeforeUnmount(() => {
    resizeObserver?.disconnect()
    window.removeEventListener('resize', measure)
  })

  watch(
    () => unref(options.compact),
    () => {
      void scheduleMeasure()
    },
  )

  return {
    rootRef,
    measureRef,
    actionsRef,
    isOverflowing,
    needsSheet,
    isTight,
    isReady,
    measure,
    scheduleMeasure,
  }
}
