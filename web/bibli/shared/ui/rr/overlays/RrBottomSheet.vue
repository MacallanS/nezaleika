<template>
  <Teleport to="body">
    <div
      v-if="rendered"
      class="profile-bottom-sheet"
      :class="{
        'profile-bottom-sheet--open': visible,
        'profile-bottom-sheet--fit': heightMode === 'fit',
        'profile-bottom-sheet--desktop': isDesktop,
        'profile-bottom-sheet--sheet': forceSheet,
        'profile-bottom-sheet--custom-inset': Boolean(resolvedContentPadding),
      }"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="resolvedTitleId || undefined"
      :style="rootStyle"
    >
      <div
        class="profile-bottom-sheet__scrim"
        aria-hidden="true"
        :style="{ opacity: backdropOpacity }"
      />
      <button
        type="button"
        class="profile-bottom-sheet__backdrop"
        aria-label="Закрыть"
        :disabled="!closeOnBackdrop || closingLocked"
        @click="onBackdropClick"
      />

      <div
        ref="panelRef"
        class="profile-bottom-sheet__panel"
        :class="{ 'profile-bottom-sheet__panel--fit': heightMode === 'fit' }"
        :style="panelStyle"
        @touchstart.passive="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
        @touchcancel="onTouchEnd"
      >
        <div
          v-if="showHandleEffective"
          class="profile-bottom-sheet__handle"
          aria-hidden="true"
          @pointerdown="onHandlePointerDown"
        >
          <span class="profile-bottom-sheet__grabber" />
        </div>

        <button
          v-if="showCloseButton"
          type="button"
          class="profile-bottom-sheet__close"
          :class="{ 'profile-bottom-sheet__close--plain': closePlain }"
          aria-label="Закрыть"
          :disabled="closingLocked"
          @click="requestClose"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M3 3l8 8M11 3L3 11"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </button>

        <div class="profile-bottom-sheet__body">
          <header v-if="title || subtitle || $slots.header" class="profile-bottom-sheet__header">
            <slot name="header">
              <h2
                v-if="title"
                :id="resolvedTitleId"
                class="profile-bottom-sheet__title"
              >
                {{ title }}
              </h2>
              <p v-if="subtitle" class="profile-bottom-sheet__subtitle">{{ subtitle }}</p>
            </slot>
          </header>

          <slot />
        </div>

        <div
          v-if="$slots.footer"
          class="profile-bottom-sheet__footer"
          :class="`profile-bottom-sheet__footer--${footerLayout}`"
        >
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import 'bibli/shared/tokens/index.css'
import './app-pwa-fullbleed.css'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { acquireAppOverlay, releaseAppOverlay } from 'bibli/shared/utils/appOverlay'
import { BOTTOM_SHEET_Z_INDEX } from 'bibli/shared/utils/layerZIndex'

const DESKTOP_MQ = '(min-width: 640px)'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /**
   * percent — фиксированная высота heightPercent экрана
   * fit — по контенту, не выше heightPercent (при переполнении скролл в body)
   */
  heightMode: {
    type: String,
    default: 'fit',
    validator: (v) => v === 'percent' || v === 'fit',
  },
  /** Доля экрана (20–100). Для fit — max-height. */
  heightPercent: {
    type: Number,
    default: 90,
    validator: (v) => Number.isFinite(v) && v >= 20 && v <= 100,
  },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  titleId: { type: String, default: '' },
  showHandle: { type: Boolean, default: true },
  closeOnBackdrop: { type: Boolean, default: true },
  /** Блокирует закрытие (свайп / backdrop), пока true — напр. во время запроса. */
  closingLocked: { type: Boolean, default: false },
  swipeToDismiss: { type: Boolean, default: true },
  /** stack | row — раскладка слота footer */
  footerLayout: {
    type: String,
    default: 'stack',
    validator: (v) => v === 'stack' || v === 'row',
  },
  dismissRatio: { type: Number, default: 0.22 },
  dismissPx: { type: Number, default: 96 },
  zIndex: { type: [Number, String], default: BOTTOM_SHEET_Z_INDEX },
  /**
   * auto — на ≥640px центрированная карточка
   * sheet — всегда нижний шит (мобилка и планшет)
   */
  placement: {
    type: String,
    default: 'auto',
    validator: (v) => v === 'auto' || v === 'sheet',
  },
  /** Desktop max-width панели (px или CSS-строка). На мобилке сбрасывается. */
  maxWidth: {
    type: [Number, String],
    default: 560,
  },
  /** Крестик без фона (desktop). */
  closePlain: { type: Boolean, default: false },
  /**
   * Кастомный inset контента (px или CSS-строка).
   * body: top/left/right; footer: left/right/bottom.
   */
  contentPadding: {
    type: [Number, String],
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'close'])

const autoTitleId = useId()
const resolvedTitleId = computed(() => props.titleId || (props.title ? autoTitleId : ''))

const rendered = ref(false)
const visible = ref(false)
const panelRef = ref(null)
const dragY = ref(0)
const dragging = ref(false)
const isDesktop = ref(false)
/** Visible viewport (shrinks / shifts under iOS keyboard). */
const viewportHeight = ref(0)
const viewportOffsetTop = ref(0)

/** overlay refcount + swipe state */
let overlayHeld = false
let startY = 0
let startDragY = 0
let closeTimer = null
let desktopMq = null

const pct = computed(() => clamp(props.heightPercent, 20, 100))
const forceSheet = computed(() => props.placement === 'sheet')
const showHandleEffective = computed(() => props.showHandle && !isDesktop.value)
const swipeEnabled = computed(() => props.swipeToDismiss && !isDesktop.value)
const showCloseButton = computed(() => isDesktop.value)

function maxPanelCss() {
  const vv = viewportHeight.value
  if (vv > 0 && !isDesktop.value) {
    return `min(${pct.value}dvh, ${pct.value}vh, ${vv}px)`
  }
  return `min(${pct.value}dvh, ${pct.value}vh)`
}

const resolvedMaxWidth = computed(() => {
  const v = props.maxWidth
  if (v == null || v === '') return undefined
  return typeof v === 'number' ? `${v}px` : String(v)
})

const resolvedContentPadding = computed(() => {
  const v = props.contentPadding
  if (v == null || v === '') return undefined
  return typeof v === 'number' ? `${v}px` : String(v)
})

const rootStyle = computed(() => {
  const style = { zIndex: props.zIndex }
  if (resolvedContentPadding.value) {
    style['--profile-sheet-inset'] = resolvedContentPadding.value
  }
  // Keep sheet in the visible area above the soft keyboard (iOS Safari).
  if (!isDesktop.value && viewportHeight.value > 0) {
    style.top = `${viewportOffsetTop.value}px`
    style.height = `${viewportHeight.value}px`
    style.bottom = 'auto'
  }
  return style
})

const panelStyle = computed(() => {
  const y = dragY.value
  const transitioning = !dragging.value
  const base = {
    transform: `translate3d(0, ${y}px, 0)`,
    transition: transitioning
      ? 'transform 280ms cubic-bezier(0.32, 0.72, 0, 1)'
      : 'none',
  }
  if (isDesktop.value && resolvedMaxWidth.value) {
    base.maxWidth = resolvedMaxWidth.value
  }
  if (props.heightMode === 'fit') {
    return {
      ...base,
      height: 'auto',
      maxHeight: maxPanelCss(),
    }
  }
  return {
    ...base,
    height: maxPanelCss(),
    maxHeight: maxPanelCss(),
  }
})

const backdropOpacity = computed(() => {
  if (!visible.value && dragY.value === 0) return 0
  const fallbackH = window.innerHeight * (pct.value / 100)
  const panelH = panelRef.value?.offsetHeight || fallbackH
  const progress = 1 - Math.min(1, Math.max(0, dragY.value / Math.max(panelH, 1)))
  return progress * (visible.value ? 1 : 0.5)
})

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

function syncDesktopMq() {
  isDesktop.value = forceSheet.value ? false : Boolean(desktopMq?.matches)
}

function syncViewportHeight() {
  if (typeof window === 'undefined') return
  const vv = window.visualViewport
  viewportHeight.value = Math.round(vv?.height || window.innerHeight || 0)
  viewportOffsetTop.value = Math.round(vv?.offsetTop || 0)
}

function onKeydown(event) {
  if (event.key !== 'Escape') return
  if (!rendered.value || props.closingLocked) return
  requestClose()
}

function lockBodyScroll() {
  if (typeof document === 'undefined') return
  document.documentElement.style.overflow = 'hidden'
  document.body.style.overflow = 'hidden'
}

function unlockBodyScroll() {
  if (typeof document === 'undefined') return
  document.documentElement.style.overflow = ''
  document.body.style.overflow = ''
}

function clearCloseTimer() {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

function panelOffsetHeight() {
  return panelRef.value?.offsetHeight || window.innerHeight * (pct.value / 100)
}

async function openSheet() {
  clearCloseTimer()
  rendered.value = true
  dragY.value = 0
  dragging.value = false
  lockBodyScroll()
  if (!overlayHeld) {
    acquireAppOverlay()
    overlayHeld = true
  }
  await nextTick()
  // На десктопе — без выезжающего свайп-жеста снизу
  if (!isDesktop.value) {
    dragY.value = panelOffsetHeight()
    await nextTick()
  }
  requestAnimationFrame(() => {
    visible.value = true
    dragY.value = 0
  })
}

function finishClose({ force = false } = {}) {
  if (props.closingLocked && !force) return
  clearCloseTimer()
  visible.value = false
  if (!isDesktop.value) {
    dragY.value = panelOffsetHeight()
  }
  closeTimer = setTimeout(() => {
    rendered.value = false
    dragY.value = 0
    dragging.value = false
    unlockBodyScroll()
    if (overlayHeld) {
      releaseAppOverlay()
      overlayHeld = false
    }
    emit('update:modelValue', false)
    emit('close')
  }, 280)
}

function requestClose() {
  if (!rendered.value || props.closingLocked) return
  finishClose()
}

function onBackdropClick() {
  if (!props.closeOnBackdrop || props.closingLocked) return
  requestClose()
}

function shouldDismiss(deltaY) {
  const panelH = panelOffsetHeight() || 1
  return deltaY >= props.dismissPx || deltaY / panelH >= props.dismissRatio
}

function onTouchStart(event) {
  if (!swipeEnabled.value || props.closingLocked || !event.touches?.[0]) return
  const body = panelRef.value?.querySelector('.profile-bottom-sheet__body')
  if (body && body.scrollTop > 0 && !event.target.closest('.profile-bottom-sheet__handle')) {
    dragging.value = false
    return
  }
  startY = event.touches[0].clientY
  startDragY = dragY.value
  dragging.value = true
}

function onTouchMove(event) {
  if (!dragging.value || !event.touches?.[0]) return
  const dy = event.touches[0].clientY - startY
  if (dy < 0) {
    dragY.value = 0
    return
  }
  dragY.value = startDragY + dy
  if (dy > 8) event.preventDefault()
}

function onTouchEnd() {
  if (!dragging.value) return
  dragging.value = false
  if (shouldDismiss(dragY.value)) {
    requestClose()
    return
  }
  dragY.value = 0
}

function onHandlePointerDown(event) {
  if (!swipeEnabled.value || props.closingLocked) return
  if (event.button != null && event.button !== 0) return
  startY = event.clientY
  startDragY = dragY.value
  dragging.value = true
  event.currentTarget.setPointerCapture?.(event.pointerId)

  const onMove = (e) => {
    if (!dragging.value) return
    const dy = e.clientY - startY
    dragY.value = dy < 0 ? 0 : startDragY + dy
  }
  const onUp = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
    dragging.value = false
    if (shouldDismiss(dragY.value)) {
      requestClose()
      return
    }
    dragY.value = 0
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) void openSheet()
    else if (rendered.value) finishClose({ force: true })
  },
  { immediate: true },
)

watch(forceSheet, () => {
  syncDesktopMq()
})

onMounted(() => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
  desktopMq = window.matchMedia(DESKTOP_MQ)
  syncDesktopMq()
  syncViewportHeight()
  desktopMq.addEventListener?.('change', syncDesktopMq)
  window.addEventListener('keydown', onKeydown)
  window.visualViewport?.addEventListener('resize', syncViewportHeight)
  window.visualViewport?.addEventListener('scroll', syncViewportHeight)
  window.addEventListener('resize', syncViewportHeight, { passive: true })
})

onBeforeUnmount(() => {
  clearCloseTimer()
  if (overlayHeld) {
    releaseAppOverlay()
    overlayHeld = false
  }
  unlockBodyScroll()
  desktopMq?.removeEventListener?.('change', syncDesktopMq)
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', onKeydown)
    window.visualViewport?.removeEventListener('resize', syncViewportHeight)
    window.visualViewport?.removeEventListener('scroll', syncViewportHeight)
    window.removeEventListener('resize', syncViewportHeight)
  }
})

defineExpose({ close: requestClose })
</script>

<style scoped>
.profile-bottom-sheet,
.profile-bottom-sheet *,
.profile-bottom-sheet *::before,
.profile-bottom-sheet *::after {
  box-sizing: border-box;
}

.profile-bottom-sheet {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  height: 100dvh;
  height: 100lvh;
  min-height: -webkit-fill-available;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  pointer-events: auto;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  /* доп. зазор под URL-бар только в обычном браузере; в PWA — 0, шит к низу экрана */
  --profile-sheet-browser-bar: 0px;
}

@media (display-mode: browser) {
  .profile-bottom-sheet {
    --profile-sheet-browser-bar: var(--rr-spacing-padding-l, 12px);
  }
}

.profile-bottom-sheet__scrim {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100%;
  height: 100dvh;
  height: 100lvh;
  min-height: -webkit-fill-available;
  margin-top: calc(-1 * env(safe-area-inset-top, 0px));
  margin-bottom: calc(-1 * env(safe-area-inset-bottom, 0px));
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  box-sizing: content-box;
  z-index: 0;
  pointer-events: none;
  background: var(--app-overlay-scrim, var(--russ-overlay, rgba(0, 0, 0, 0.56)));
  transition: opacity 280ms cubic-bezier(0.32, 0.72, 0, 1);
}

.profile-bottom-sheet__backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  border: none;
  border-radius: var(--rr-radius-none, 0);
  padding: 0;
  margin: 0;
  background: transparent;
  cursor: pointer;
}

.profile-bottom-sheet__backdrop:disabled {
  cursor: default;
}

.profile-bottom-sheet__panel {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 560px;
  margin: 0;
  margin-bottom: 0;
  bottom: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  /* только верх скруглён — низ вплотную к экрану, фон = цвет панели */
  border-radius: var(--rr-radius-3-xl) var(--rr-radius-3-xl) 0 0;
  background: var(--rr-backgrounds-primary, #fff);
  box-shadow: 0 calc(var(--rr-spacing-padding-m) * -1) 32px var(--rr-fx-shadow-major);
  will-change: transform;
  touch-action: pan-y;
  padding-bottom: 0;
  color: var(--rr-labels-neutral-primary, #101012);
}

.profile-bottom-sheet__panel--fit {
  flex: 0 1 auto;
  /* max-height задаётся inline — без overflow hidden body не скроллится */
  overflow: hidden;
}

.profile-bottom-sheet__handle {
  flex: 0 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 14px var(--rr-spacing-padding-xl) var(--rr-spacing-padding-3-xl);
  cursor: grab;
  touch-action: none;
}

.profile-bottom-sheet__handle:active {
  cursor: grabbing;
}

.profile-bottom-sheet__grabber {
  width: 36px;
  height: 4px;
  border-radius: var(--rr-radius-full);
  background: var(--rr-labels-neutral-tertiary, #3C3C4385);
}

.profile-bottom-sheet__close {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 10px;
  background: var(--rr-backgrounds-quaternary, #f2f3f7);
  color: var(--rr-labels-neutral-primary, #101012);
  cursor: pointer;
}

.profile-bottom-sheet__close--plain {
  background: transparent;
}

.profile-bottom-sheet__close:disabled {
  opacity: 0.5;
  cursor: default;
}

.profile-bottom-sheet__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding: 0 var(--rr-spacing-padding-xl) 0;
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-l);
  touch-action: pan-y;
}

.profile-bottom-sheet__panel--fit .profile-bottom-sheet__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
}

.profile-bottom-sheet__panel:not(:has(.profile-bottom-sheet__footer)) .profile-bottom-sheet__body {
  /* один safe-area в конце контента — панель белая до низа экрана */
  padding-bottom: calc(
    var(--rr-spacing-padding-3-xl)
    + env(safe-area-inset-bottom, 0px)
    + var(--profile-sheet-browser-bar, 0px)
  );
}

.profile-bottom-sheet__header {
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-s);
}

.profile-bottom-sheet__title {
  margin: 0;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 600;
  font-style: normal;
  font-size: var(--rr-font-size-font-size-xl);
  line-height: var(--rr-line-height-line-height-xl);
  letter-spacing: var(--rr-tracking-tracking-xl);
  text-align: left;
  vertical-align: middle;
  color: var(--rr-labels-neutral-primary, #101012);
}

.profile-bottom-sheet__subtitle {
  margin: 0;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 400;
  font-style: normal;
  font-size: var(--rr-font-size-font-size-m);
  line-height: var(--rr-line-height-line-height-m);
  letter-spacing: var(--rr-tracking-tracking-m);
  vertical-align: middle;
  text-align: left;
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
}

.profile-bottom-sheet__body :deep(p) {
  margin: 0;
  color: var(--rr-labels-neutral-primary, #101012);
}

.profile-bottom-sheet__footer {
  flex: 0 0 auto;
  position: relative;
  z-index: 1;
  display: flex;
  gap: var(--rr-spacing-padding-m);
  padding: var(--rr-spacing-padding-l) var(--rr-spacing-padding-xl);
  /* safe-area один раз здесь: фон футера = фон панели до home indicator */
  padding-bottom: calc(
    var(--rr-spacing-padding-3-xl, 24px)
    + env(safe-area-inset-bottom, 0px)
    + var(--profile-sheet-browser-bar, 0px)
  );
  background: var(--rr-backgrounds-primary, #fff);
  box-shadow: 0 calc(var(--rr-spacing-padding-m) * -1) var(--rr-spacing-padding-xl) calc(var(--rr-spacing-padding-l) * -1) var(--rr-fx-shadow-major);
  margin-top: 24px;
  margin-bottom: 0;
}

.profile-bottom-sheet__panel--fit .profile-bottom-sheet__footer {
  box-shadow: none;
}

.profile-bottom-sheet__footer--stack {
  flex-direction: column;
}

.profile-bottom-sheet__footer--row {
  flex-direction: row;
  align-items: stretch;
}

.profile-bottom-sheet__footer--row > :deep(*) {
  flex: 1 1 0;
  min-width: 0;
}

/* Мобилка / PWA: шит на всю ширину, низ вплотную к экрану */
@media (max-width: 639px) {
  .profile-bottom-sheet:not(.profile-bottom-sheet--desktop) .profile-bottom-sheet__panel {
    width: 100%;
    max-width: none;
    margin: 0;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
}

@media (min-width: 640px) {
  .profile-bottom-sheet--desktop {
    align-items: center;
    padding: var(--rr-spacing-padding-3-xl);
  }

  .profile-bottom-sheet--desktop .profile-bottom-sheet__panel {
    border-radius: var(--rr-radius-3-xl);
    max-height: min(90dvh, 90vh) !important;
    touch-action: auto;
    margin-inline: auto;
  }

  .profile-bottom-sheet--desktop .profile-bottom-sheet__body {
    padding-top: var(--rr-spacing-padding-3-xl);
    /* место под крестик справа от заголовка */
    padding-right: calc(var(--rr-spacing-padding-xl) + 44px);
  }

  .profile-bottom-sheet--desktop .profile-bottom-sheet__footer {
    padding-bottom: var(--rr-spacing-padding-3-xl);
  }
}

.profile-bottom-sheet--custom-inset .profile-bottom-sheet__body {
  padding-top: var(--profile-sheet-inset);
  padding-left: var(--profile-sheet-inset);
  padding-right: var(--profile-sheet-inset);
}

.profile-bottom-sheet--custom-inset .profile-bottom-sheet__footer {
  padding-left: var(--profile-sheet-inset);
  padding-right: var(--profile-sheet-inset);
  padding-bottom: var(--profile-sheet-inset);
}

@media (min-width: 640px) {
  .profile-bottom-sheet--custom-inset.profile-bottom-sheet--desktop .profile-bottom-sheet__body {
    padding-top: var(--profile-sheet-inset);
    padding-right: var(--profile-sheet-inset);
  }

  .profile-bottom-sheet--custom-inset.profile-bottom-sheet--desktop .profile-bottom-sheet__footer {
    padding-bottom: var(--profile-sheet-inset);
  }
}
</style>
