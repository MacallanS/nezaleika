import { computed, nextTick, onUnmounted, ref } from 'vue'
import { isStandalonePwa } from '~/utils/pwaUpdate'
import {
  dampPullDistance,
  PTR_REFRESH_HOLD_PX,
  PTR_THRESHOLD_PX,
  resolvePullPhase,
  type PullToRefreshPhase,
} from '~/utils/pullToRefreshMath'

const REFRESH_COOLDOWN_MS = 2000
const MIN_REFRESH_VISIBLE_MS = 650
const ANIMATION_MS = 240

export type PullToRefreshOptions = {
  enabled?: () => boolean
  onRefresh?: () => Promise<void> | void
}

function applyScrollOffset(
  el: HTMLElement | null,
  distance: number,
  phase: PullToRefreshPhase,
  pulling: boolean,
  animating: boolean,
) {
  if (!el) return

  const offset =
    phase === 'refreshing' || (animating && distance > 0) || distance > 0 ? distance : 0

  if (offset <= 0 && phase === 'idle' && !animating) {
    el.style.transform = ''
    el.style.transition = ''
    return
  }

  el.style.transform = `translate3d(0, ${offset}px, 0)`
  el.style.transition =
    pulling || (!animating && (phase === 'pulling' || phase === 'ready'))
      ? 'none'
      : `transform ${ANIMATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
}

export function usePullToRefresh(
  resolveScrollEl: () => HTMLElement | null,
  options?: PullToRefreshOptions,
) {
  const pullDistance = ref(0)
  const phase = ref<PullToRefreshPhase>('idle')
  const isAnimating = ref(false)

  let startY = 0
  let pulling = false
  let lastRefreshAt = 0
  let boundEl: HTMLElement | null = null
  let releaseTimer: ReturnType<typeof setTimeout> | null = null
  let animationFrame: number | null = null

  const isActive = computed(
    () => phase.value !== 'idle' || pullDistance.value > 0 || isAnimating.value,
  )

  function isEnabled(): boolean {
    if (!import.meta.client) return false
    if (!isStandalonePwa()) return false
    if (!window.matchMedia('(max-width: 1024px)').matches) return false
    if (!('ontouchstart' in window)) return false
    if (options?.enabled && !options.enabled()) return false
    return true
  }

  function syncScrollOffset() {
    applyScrollOffset(boundEl, pullDistance.value, phase.value, pulling, isAnimating.value)
  }

  function cancelAnimation() {
    if (animationFrame != null) {
      cancelAnimationFrame(animationFrame)
      animationFrame = null
    }
    isAnimating.value = false
  }

  function animatePullDistance(target: number, duration = ANIMATION_MS): Promise<void> {
    cancelAnimation()
    const from = pullDistance.value
    if (from === target) return Promise.resolve()

    isAnimating.value = true
    const start = performance.now()

    return new Promise((resolve) => {
      const frame = (now: number) => {
        const t = Math.min(1, (now - start) / duration)
        const eased = 1 - (1 - t) ** 3
        pullDistance.value = from + (target - from) * eased
        syncScrollOffset()

        if (t < 1) {
          animationFrame = requestAnimationFrame(frame)
          return
        }

        animationFrame = null
        isAnimating.value = false
        pullDistance.value = target
        syncScrollOffset()
        resolve()
      }

      animationFrame = requestAnimationFrame(frame)
    })
  }

  function setDistance(distance: number) {
    pullDistance.value = distance
    if (phase.value !== 'refreshing') {
      phase.value = resolvePullPhase(distance, PTR_THRESHOLD_PX)
    }
    syncScrollOffset()
  }

  async function resetState(animate = true) {
    if (!animate) {
      cancelAnimation()
      pullDistance.value = 0
      phase.value = 'idle'
      syncScrollOffset()
      return
    }

    phase.value = 'idle'
    await animatePullDistance(0)
    phase.value = 'idle'
    pullDistance.value = 0
    syncScrollOffset()
  }

  async function runRefresh() {
    const startedAt = Date.now()
    phase.value = 'refreshing'
    await animatePullDistance(PTR_REFRESH_HOLD_PX, 180)

    try {
      await options?.onRefresh?.()
    } catch (error) {
      console.warn('[pull-to-refresh] refresh failed:', error)
    }

    const elapsed = Date.now() - startedAt
    const waitMs = Math.max(0, MIN_REFRESH_VISIBLE_MS - elapsed)
    if (waitMs > 0) {
      await new Promise<void>((resolve) => {
        releaseTimer = setTimeout(resolve, waitMs)
      })
    }

    await resetState(true)
  }

  function onTouchStart(event: TouchEvent) {
    if (!isEnabled() || phase.value === 'refreshing' || isAnimating.value) return
    const el = boundEl
    if (!el || el.scrollTop > 1) return

    startY = event.touches[0]?.clientY ?? 0
    pulling = true
  }

  function onTouchMove(event: TouchEvent) {
    if (!pulling || phase.value === 'refreshing' || isAnimating.value) return

    const el = boundEl
    if (!el || el.scrollTop > 1) {
      pulling = false
      void resetState(true)
      return
    }

    const currentY = event.touches[0]?.clientY ?? 0
    const rawDelta = currentY - startY
    if (rawDelta <= 0) {
      pulling = false
      void resetState(false)
      return
    }

    if (event.cancelable) event.preventDefault()
    setDistance(dampPullDistance(rawDelta))
  }

  function onTouchEnd() {
    if (!pulling || phase.value === 'refreshing' || isAnimating.value) return
    pulling = false

    const el = boundEl
    if (!el || el.scrollTop > 1) {
      void resetState(true)
      return
    }

    if (pullDistance.value < PTR_THRESHOLD_PX) {
      void resetState(true)
      return
    }

    if (Date.now() - lastRefreshAt < REFRESH_COOLDOWN_MS) {
      void resetState(true)
      return
    }

    lastRefreshAt = Date.now()
    void runRefresh()
  }

  function bind(el: HTMLElement) {
    if (boundEl === el) return
    unbind(boundEl)
    boundEl = el
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    el.addEventListener('touchcancel', onTouchEnd, { passive: true })
  }

  function unbind(el: HTMLElement | null) {
    if (!el) return
    el.removeEventListener('touchstart', onTouchStart)
    el.removeEventListener('touchmove', onTouchMove)
    el.removeEventListener('touchend', onTouchEnd)
    el.removeEventListener('touchcancel', onTouchEnd)
    el.style.transform = ''
    el.style.transition = ''
    if (boundEl === el) boundEl = null
  }

  async function rebind() {
    if (!isEnabled()) {
      unbind(boundEl)
      await resetState(false)
      return
    }
    await nextTick()
    let el = resolveScrollEl()
    if (!el) {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })
      el = resolveScrollEl()
    }
    if (el) bind(el)
  }

  void rebind()

  onUnmounted(() => {
    cancelAnimation()
    if (releaseTimer) clearTimeout(releaseTimer)
    unbind(boundEl)
  })

  return {
    pullDistance,
    phase,
    isActive,
    isAnimating,
    rebind,
  }
}
