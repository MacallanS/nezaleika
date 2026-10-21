<template>
  <div class="staff-doc-sidebar-wrap">
    <aside
      ref="scrollerRef"
      class="staff-doc-sidebar"
      :class="{ 'staff-doc-sidebar--dragging': isDragging }"
      @scroll="updateScrollState"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <button
        v-for="step in steps"
        :key="step.id"
        type="button"
        class="staff-doc-sidebar__item"
        :class="{ 'staff-doc-sidebar__item--active': activeDoc === step.id }"
        @click="onItemClick(step.id, $event)"
      >
        <span class="staff-doc-sidebar__icon" aria-hidden="true">
          <img :src="step.icon" alt="" width="32" height="32" />
        </span>
        <span class="staff-doc-sidebar__content">
          <span class="staff-doc-sidebar__title">{{ step.title }}</span>
          <span
            class="staff-doc-sidebar__status"
            :class="statusClass(step.id)"
          >
            {{ statusLabel(step.id) }}
          </span>
        </span>
        <span class="staff-doc-sidebar__chevron" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M6 4l4 4-4 4"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
      </button>
    </aside>

    <button
      v-show="canScrollLeft"
      type="button"
      class="staff-doc-sidebar__scroll staff-doc-sidebar__scroll--left"
      aria-label="Прокрутить влево"
      @click="scrollByDir(-1)"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M10 4L6 8l4 4"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <button
      v-show="canScrollRight"
      type="button"
      class="staff-doc-sidebar__scroll staff-doc-sidebar__scroll--right"
      aria-label="Прокрутить вправо"
      @click="scrollByDir(1)"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M6 4l4 4-4 4"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  ACTIVATION_STEPS,
  type ActivationStepId,
  type ActivationStepsMap,
} from 'bibli/widgets/Profile/rr/lib/activationSteps'
import {
  activationBlockStatusClass,
  activationBlockStatusLabel,
} from 'bibli/widgets/Profile/rr/lib/activationBlockStatus'
import { STAFF_PROFILE_DOC_VALUES } from '../../lib/staffProfileTabs'
import 'bibli/widgets/Profile/rr/lib/activation-block-status.css'

const DRAG_THRESHOLD_PX = 5

const props = withDefaults(
  defineProps<{
    activeDoc: ActivationStepId
    stepsMap: ActivationStepsMap
    /** Шаги со статусом empty, но уже с частью данных (саппорт). */
    partialStepIds?: ActivationStepId[]
  }>(),
  {
    partialStepIds: () => [],
  },
)

const emit = defineEmits<{
  select: [doc: ActivationStepId]
}>()

const steps = STAFF_PROFILE_DOC_VALUES
  .map((id) => ACTIVATION_STEPS.find((step) => step.id === id))
  .filter((step): step is (typeof ACTIVATION_STEPS)[number] => Boolean(step))

const partialSet = computed(() => new Set(props.partialStepIds))

const scrollerRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

let pointerId: number | null = null
let dragStartX = 0
let dragStartScrollLeft = 0
let didDrag = false
let resizeObserver: ResizeObserver | null = null

function hasHorizontalOverflow(el: HTMLElement): boolean {
  return el.scrollWidth - el.clientWidth > 1
}

function updateScrollState() {
  const el = scrollerRef.value
  if (!el || !hasHorizontalOverflow(el)) {
    canScrollLeft.value = false
    canScrollRight.value = false
    return
  }
  canScrollLeft.value = el.scrollLeft > 1
  canScrollRight.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 1
}

function scrollByDir(dir: 1 | -1) {
  const el = scrollerRef.value
  if (!el) return
  el.scrollBy({ left: dir * Math.max(160, Math.floor(el.clientWidth * 0.6)), behavior: 'smooth' })
}

function onWheel(event: WheelEvent) {
  const el = scrollerRef.value
  if (!el || !hasHorizontalOverflow(el)) return

  const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
    ? event.deltaX
    : event.deltaY
  if (delta === 0) return

  const maxScroll = el.scrollWidth - el.clientWidth
  const next = Math.min(maxScroll, Math.max(0, el.scrollLeft + delta))
  if (next === el.scrollLeft) return

  event.preventDefault()
  el.scrollLeft = next
  updateScrollState()
}

function onPointerDown(event: PointerEvent) {
  if (event.pointerType === 'mouse' && event.button !== 0) return
  const el = scrollerRef.value
  if (!el || !hasHorizontalOverflow(el)) return

  pointerId = event.pointerId
  dragStartX = event.clientX
  dragStartScrollLeft = el.scrollLeft
  didDrag = false
  isDragging.value = false
  // Capture only after drag threshold — early capture steals click from items.
}

function onPointerMove(event: PointerEvent) {
  if (pointerId !== event.pointerId) return
  const el = scrollerRef.value
  if (!el) return

  const dx = event.clientX - dragStartX
  if (!didDrag && Math.abs(dx) > DRAG_THRESHOLD_PX) {
    didDrag = true
    isDragging.value = true
    el.setPointerCapture?.(event.pointerId)
  }
  if (!didDrag) return

  event.preventDefault()
  el.scrollLeft = dragStartScrollLeft - dx
  updateScrollState()
}

function onPointerUp(event: PointerEvent) {
  if (pointerId !== event.pointerId) return
  const el = scrollerRef.value
  if (isDragging.value) {
    el?.releasePointerCapture?.(event.pointerId)
  }
  pointerId = null
  isDragging.value = false
  // Keep didDrag until click so a post-drag synthetic click is ignored.
}

function onItemClick(stepId: ActivationStepId, event: MouseEvent) {
  if (didDrag) {
    event.preventDefault()
    event.stopPropagation()
    didDrag = false
    return
  }
  emit('select', stepId)
}

function isPartialEmpty(stepId: ActivationStepId): boolean {
  const status = props.stepsMap[stepId]
  if (status === 'partial') return true
  return status === 'empty' && partialSet.value.has(stepId)
}

function statusLabel(stepId: ActivationStepId) {
  if (isPartialEmpty(stepId)) return 'Частично заполнено'
  return activationBlockStatusLabel(props.stepsMap[stepId], { audience: 'support' })
}

function statusClass(stepId: ActivationStepId) {
  if (isPartialEmpty(stepId)) {
    return 'staff-doc-sidebar__status--partial'
  }
  return activationBlockStatusClass(props.stepsMap[stepId], {
    prefix: 'staff-doc-sidebar__status',
  })
}

onMounted(() => {
  const el = scrollerRef.value
  el?.addEventListener('wheel', onWheel, { passive: false })
  updateScrollState()
  if (el && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => updateScrollState())
    resizeObserver.observe(el)
  }
})

onBeforeUnmount(() => {
  scrollerRef.value?.removeEventListener('wheel', onWheel)
  resizeObserver?.disconnect()
  resizeObserver = null
  pointerId = null
  isDragging.value = false
  didDrag = false
})
</script>

<style scoped>
.staff-doc-sidebar-wrap {
  position: relative;
  display: flex;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  align-self: start;
}

.staff-doc-sidebar {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  height: auto;
  gap: 8px;
  /* 1:1 with staff-profile-page__card--tabs */
  padding: var(--staff-profile-strip-pad, 8px);
  border: none;
  border-radius: var(--rr-radius-2-xl, 20px);
  background: var(--rr-backgrounds-primary, #ffffff);
}

.staff-doc-sidebar__item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 100%;
  padding: 8px 10px 8px 8px;
  border: none;
  border-radius: 10px;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.staff-doc-sidebar__item--active {
  background: var(--rr-backgrounds-tetriary, #e7e8ee);
}

.staff-doc-sidebar__icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: transparent;
  display: grid;
  place-items: center;
}

.staff-doc-sidebar__icon img {
  display: block;
  width: 32px;
  height: 32px;
  object-fit: contain;
  pointer-events: none;
}

.staff-doc-sidebar__content {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
}

.staff-doc-sidebar__title {
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  letter-spacing: var(--rr-tracking-tracking-m, 0px);
  color: var(--rr-labels-neutral-primary, #101012);
}

.staff-doc-sidebar__status {
  font-size: 11px;
  font-weight: 400;
  line-height: 14px;
  letter-spacing: var(--rr-tracking-tracking-s, 0px);
}

.staff-doc-sidebar__chevron {
  display: inline-flex;
  color: rgba(60, 60, 67, 0.36);
}

.staff-doc-sidebar__scroll {
  display: none;
}

@media (max-width: 720px) {
  .staff-doc-sidebar-wrap {
    flex: 0 0 auto;
    align-self: start;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow: hidden;
    border-radius: var(--rr-radius-2-xl, 20px);
  }

  .staff-doc-sidebar {
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: center;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    min-height: 60px;
    gap: 8px;
    padding: var(--staff-profile-strip-pad, 8px);
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    cursor: grab;
    touch-action: pan-x;
  }

  .staff-doc-sidebar--dragging {
    cursor: grabbing;
    user-select: none;
  }

  .staff-doc-sidebar::-webkit-scrollbar {
    display: none;
  }

  .staff-doc-sidebar__item {
    box-sizing: border-box;
    flex: 0 0 auto;
    grid-template-columns: auto auto;
    align-items: center;
    gap: 6px;
    width: max-content;
    max-width: none;
    height: auto;
    min-height: 40px;
    padding: 8px 10px 8px 8px;
    border: none;
    border-radius: 10px;
    background: transparent;
    cursor: pointer;
  }

  .staff-doc-sidebar__item--active {
    background: var(--rr-backgrounds-tetriary, #e7e8ee);
    border: none;
    box-shadow: none;
  }

  .staff-doc-sidebar__icon {
    width: 28px;
    height: 28px;
  }

  .staff-doc-sidebar__icon img {
    width: 28px;
    height: 28px;
  }

  .staff-doc-sidebar__content {
    gap: 0;
    justify-content: center;
    min-width: 0;
  }

  .staff-doc-sidebar__title {
    font-size: 13px;
    line-height: 16px;
    font-weight: 600;
    white-space: nowrap;
  }

  .staff-doc-sidebar__status {
    font-size: 11px;
    line-height: 14px;
    white-space: nowrap;
  }

  .staff-doc-sidebar__chevron {
    display: none;
  }

  .staff-doc-sidebar__scroll {
    --staff-doc-scroll-fade: 48px;

    position: absolute;
    top: 0;
    bottom: 0;
    z-index: 2;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    width: var(--staff-doc-scroll-fade);
    height: 100%;
    margin: 0;
    padding: 0;
    border: none;
    border-radius: 0;
    color: var(--rr-labels-neutral-primary, #101012);
    cursor: pointer;
    background: transparent;
  }

  .staff-doc-sidebar__scroll::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .staff-doc-sidebar__scroll svg {
    position: relative;
    z-index: 1;
    flex-shrink: 0;
    width: 16px;
    height: 16px;
  }

  .staff-doc-sidebar__scroll--left {
    left: 0;
    justify-content: flex-start;
    padding-left: 10px;
    background: linear-gradient(
      to right,
      var(--rr-backgrounds-primary, #ffffff) 0%,
      var(--rr-backgrounds-primary, #ffffff) 36%,
      rgba(255, 255, 255, 0) 100%
    );
  }

  .staff-doc-sidebar__scroll--left::before {
    -webkit-mask-image: linear-gradient(to right, #000 0%, #000 40%, transparent 100%);
    mask-image: linear-gradient(to right, #000 0%, #000 40%, transparent 100%);
  }

  .staff-doc-sidebar__scroll--right {
    right: 0;
    justify-content: flex-end;
    padding-right: 10px;
    background: linear-gradient(
      to left,
      var(--rr-backgrounds-primary, #ffffff) 0%,
      var(--rr-backgrounds-primary, #ffffff) 36%,
      rgba(255, 255, 255, 0) 100%
    );
  }

  .staff-doc-sidebar__scroll--right::before {
    -webkit-mask-image: linear-gradient(to left, #000 0%, #000 40%, transparent 100%);
    mask-image: linear-gradient(to left, #000 0%, #000 40%, transparent 100%);
  }
}
</style>
