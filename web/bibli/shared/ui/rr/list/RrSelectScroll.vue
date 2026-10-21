<template>
  <div
    class="rr-select-scroll"
    :class="{ 'rr-select-scroll--overflow': canScroll }"
  >
    <div
      ref="viewportRef"
      class="rr-select-scroll__viewport"
      @scroll.passive="syncThumb"
    >
      <slot />
    </div>
    <div
      v-show="canScroll"
      ref="railRef"
      class="rr-select-scroll__rail"
      aria-hidden="true"
      @pointerdown="onRailPointerDown"
      @wheel="onRailWheel"
    >
      <div
        class="rr-select-scroll__thumb"
        :class="{ 'rr-select-scroll__thumb--dragging': dragging }"
        :style="thumbStyle"
        @pointerdown.stop="onThumbPointerDown"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import './rr-select-scroll.css'

const THUMB_MIN = 24

const viewportRef = ref<HTMLElement | null>(null)
const railRef = ref<HTMLElement | null>(null)
const canScroll = ref(false)
const dragging = ref(false)
const thumbHeight = ref(THUMB_MIN)
const thumbOffset = ref(0)

const dragStartY = ref(0)
const dragStartScroll = ref(0)

let resizeObserver: ResizeObserver | null = null
let mutationObserver: MutationObserver | null = null
let dragPointerId: number | null = null

const thumbStyle = computed(() => ({
  height: `${thumbHeight.value}px`,
  transform: `translateY(${thumbOffset.value}px)`,
}))

function trackHeight(clientHeight: number): number {
  const rail = railRef.value
  const source = rail && rail.clientHeight > 0 ? rail.clientHeight : clientHeight
  return Math.max(0, source - 8)
}

function metrics() {
  const viewport = viewportRef.value
  if (!viewport) return null
  const { scrollTop, scrollHeight, clientHeight } = viewport
  const overflow = scrollHeight - clientHeight
  return { viewport, scrollTop, scrollHeight, clientHeight, overflow }
}

function syncThumb() {
  const m = metrics()
  if (!m) return
  canScroll.value = m.overflow > 1
  if (!canScroll.value) {
    thumbHeight.value = THUMB_MIN
    thumbOffset.value = 0
    return
  }
  const track = trackHeight(m.clientHeight)
  const nextHeight = Math.max(THUMB_MIN, Math.round((m.clientHeight / m.scrollHeight) * track))
  const maxOffset = Math.max(0, track - nextHeight)
  thumbHeight.value = nextHeight
  thumbOffset.value = m.overflow > 0
    ? Math.round((m.scrollTop / m.overflow) * maxOffset)
    : 0
}

function scrollToThumbOffset(offset: number) {
  const m = metrics()
  if (!m || m.overflow <= 0) return
  const track = trackHeight(m.clientHeight)
  const maxOffset = Math.max(1, track - thumbHeight.value)
  const clamped = Math.min(maxOffset, Math.max(0, offset))
  m.viewport.scrollTop = (clamped / maxOffset) * m.overflow
}

function onThumbPointerDown(event: PointerEvent) {
  if (event.button !== 0) return
  event.preventDefault()
  dragging.value = true
  dragStartY.value = event.clientY
  dragStartScroll.value = viewportRef.value?.scrollTop ?? 0
  dragPointerId = event.pointerId
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  window.addEventListener('pointermove', onDragMove)
  window.addEventListener('pointerup', onDragEnd)
  window.addEventListener('pointercancel', onDragEnd)
}

function onRailPointerDown(event: PointerEvent) {
  if (event.button !== 0) return
  event.preventDefault()
  const rail = event.currentTarget as HTMLElement
  const y = event.clientY - rail.getBoundingClientRect().top
  scrollToThumbOffset(y - thumbHeight.value / 2)
  dragging.value = true
  dragStartY.value = event.clientY
  dragStartScroll.value = viewportRef.value?.scrollTop ?? 0
  dragPointerId = event.pointerId
  rail.setPointerCapture(event.pointerId)
  window.addEventListener('pointermove', onDragMove)
  window.addEventListener('pointerup', onDragEnd)
  window.addEventListener('pointercancel', onDragEnd)
}

function onDragMove(event: PointerEvent) {
  if (!dragging.value || (dragPointerId !== null && event.pointerId !== dragPointerId)) return
  const m = metrics()
  if (!m || m.overflow <= 0) return
  const track = trackHeight(m.clientHeight)
  const maxOffset = Math.max(1, track - thumbHeight.value)
  const delta = event.clientY - dragStartY.value
  m.viewport.scrollTop = dragStartScroll.value + (delta / maxOffset) * m.overflow
}

function onDragEnd() {
  dragging.value = false
  dragPointerId = null
  window.removeEventListener('pointermove', onDragMove)
  window.removeEventListener('pointerup', onDragEnd)
  window.removeEventListener('pointercancel', onDragEnd)
}

function bindObservers() {
  const viewport = viewportRef.value
  if (!viewport) return
  resizeObserver?.disconnect()
  mutationObserver?.disconnect()
  resizeObserver = new ResizeObserver(syncThumb)
  resizeObserver.observe(viewport)
  const child = viewport.firstElementChild
  if (child) resizeObserver.observe(child)
  mutationObserver = new MutationObserver(() => {
    const next = viewport.firstElementChild
    if (next && resizeObserver) resizeObserver.observe(next)
    syncThumb()
  })
  mutationObserver.observe(viewport, { childList: true, subtree: true, characterData: true })
  syncThumb()
}

function onRailWheel(event: WheelEvent) {
  const viewport = viewportRef.value
  if (!viewport) return
  viewport.scrollTop += event.deltaY
  event.preventDefault()
}

onMounted(() => {
  bindObservers()
  void nextTick(syncThumb)
})

watch(canScroll, () => {
  void nextTick(syncThumb)
})

onBeforeUnmount(() => {
  onDragEnd()
  resizeObserver?.disconnect()
  mutationObserver?.disconnect()
  resizeObserver = null
  mutationObserver = null
})

defineExpose({
  get viewport() {
    return viewportRef.value
  },
})
</script>
