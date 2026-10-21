<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="staff-doc-preview"
      :class="{
        'staff-doc-preview--pdf': kind === 'pdf',
        'staff-doc-preview--zoomed': isZoomed,
        'staff-doc-preview--panning': isPanning,
      }"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
    >
      <div
        ref="stageEl"
        class="staff-doc-preview__stage"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @dblclick="onDoubleClick"
      >
        <p v-if="loading" class="staff-doc-preview__status">Загрузка…</p>
        <p v-else-if="error" class="staff-doc-preview__status staff-doc-preview__status--error">
          {{ error }}
        </p>
        <template v-else-if="kind === 'pdf' && objectUrl">
          <embed
            v-if="useEmbedPdf"
            class="staff-doc-preview__pdf"
            :src="pdfSrc"
            type="application/pdf"
          />
          <iframe
            v-else
            class="staff-doc-preview__pdf"
            :src="pdfSrc"
            title="Просмотр PDF"
          />
          <a
            class="staff-doc-preview__open-tab"
            :href="pdfSrc"
            target="_blank"
            rel="noopener"
          >
            Открыть в новой вкладке
          </a>
        </template>
        <img
          v-else-if="kind === 'image' && objectUrl"
          class="staff-doc-preview__img"
          :src="objectUrl"
          :alt="title"
          :style="imageTransformStyle"
          draggable="false"
        />
      </div>

      <button
        type="button"
        class="staff-doc-preview__close"
        aria-label="Закрыть"
        @click="emit('close')"
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

      <button
        v-if="canNavigate"
        type="button"
        class="staff-doc-preview__nav staff-doc-preview__nav--prev"
        aria-label="Предыдущий документ"
        :disabled="loading"
        @click="emit('prev')"
      >
        ‹
      </button>
      <button
        v-if="canNavigate"
        type="button"
        class="staff-doc-preview__nav staff-doc-preview__nav--next"
        aria-label="Следующий документ"
        :disabled="loading"
        @click="emit('next')"
      >
        ›
      </button>

      <div
        v-if="kind === 'image' && objectUrl && !loading && !error"
        class="staff-doc-preview__zoom"
      >
        <button
          type="button"
          class="staff-doc-preview__zoom-btn"
          aria-label="Уменьшить"
          :disabled="scale <= MIN_SCALE"
          @click="zoomBy(-ZOOM_STEP)"
        >
          −
        </button>
        <button
          type="button"
          class="staff-doc-preview__zoom-value"
          aria-label="Сбросить масштаб"
          title="Сбросить (Ctrl+0)"
          @click="resetZoom"
        >
          {{ zoomLabel }}
        </button>
        <button
          type="button"
          class="staff-doc-preview__zoom-btn"
          aria-label="Увеличить"
          :disabled="scale >= MAX_SCALE"
          @click="zoomBy(ZOOM_STEP)"
        >
          +
        </button>
      </div>

      <footer class="staff-doc-preview__footer">
        <p v-if="title" class="staff-doc-preview__caption">{{ title }}</p>
        <p v-if="counter" class="staff-doc-preview__counter">{{ counter }}</p>
      </footer>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useAppOverlayBinding } from 'bibli/shared/composables/useAppOverlayBinding'
import { NAV_DRAWER_Z_INDEX } from 'bibli/shared/utils/layerZIndex'
import {
  isAppleWebKitPdfViewer,
  loadStaffDocumentPreview,
  pdfFrameSrc,
  type StaffDocumentKind,
} from '../../lib/staffProfileDocumentMedia'

const MIN_SCALE = 1
const MAX_SCALE = 6
const ZOOM_STEP = 0.25
const WHEEL_ZOOM_SENSITIVITY = 0.004

const props = defineProps<{
  open: boolean
  url: string
  title?: string
  index?: number
  total?: number
}>()

const emit = defineEmits<{
  close: []
  prev: []
  next: []
}>()

const previewOverlayZIndex = NAV_DRAWER_Z_INDEX
useAppOverlayBinding(() => props.open)

const stageEl = ref<HTMLElement | null>(null)
const loading = ref(false)
const error = ref('')
const kind = ref<StaffDocumentKind>('unknown')
const objectUrl = ref('')
let loadSeq = 0

const scale = ref(MIN_SCALE)
const translateX = ref(0)
const translateY = ref(0)
const isPanning = ref(false)
let panPointerId: number | null = null
let panOriginX = 0
let panOriginY = 0
let panStartTx = 0
let panStartTy = 0

const canNavigate = computed(() => (props.total ?? 0) > 1)
const counter = computed(() => {
  if (!canNavigate.value) return ''
  return `${(props.index ?? 0) + 1} / ${props.total}`
})
const pdfSrc = computed(() => pdfFrameSrc(objectUrl.value))
const useEmbedPdf = computed(() => isAppleWebKitPdfViewer())
const title = computed(() => props.title?.trim() || 'Просмотр документа')
const isZoomed = computed(() => scale.value > MIN_SCALE + 0.001)
const zoomLabel = computed(() => `${Math.round(scale.value * 100)}%`)
const imageTransformStyle = computed(() => ({
  transform: `translate3d(${translateX.value}px, ${translateY.value}px, 0) scale(${scale.value})`,
}))

function clampScale(value: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value))
}

function resetZoom() {
  scale.value = MIN_SCALE
  translateX.value = 0
  translateY.value = 0
  isPanning.value = false
  panPointerId = null
}

function canZoomImage() {
  return props.open && kind.value === 'image' && Boolean(objectUrl.value) && !loading.value && !error.value
}

function setScaleAtPoint(nextScale: number, clientX?: number, clientY?: number) {
  const clamped = clampScale(nextScale)
  const prev = scale.value
  if (Math.abs(clamped - prev) < 0.0001) {
    if (clamped <= MIN_SCALE) resetZoom()
    return
  }

  const stage = stageEl.value
  if (stage && clientX != null && clientY != null) {
    const rect = stage.getBoundingClientRect()
    const cx = clientX - rect.left - rect.width / 2
    const cy = clientY - rect.top - rect.height / 2
    const ratio = clamped / prev
    translateX.value = cx - (cx - translateX.value) * ratio
    translateY.value = cy - (cy - translateY.value) * ratio
  } else if (clamped <= MIN_SCALE) {
    translateX.value = 0
    translateY.value = 0
  }

  scale.value = clamped
  if (clamped <= MIN_SCALE) {
    translateX.value = 0
    translateY.value = 0
  }
}

function zoomBy(delta: number, clientX?: number, clientY?: number) {
  if (!canZoomImage()) return
  setScaleAtPoint(scale.value + delta, clientX, clientY)
}

function onWheel(event: WheelEvent) {
  if (!canZoomImage()) return

  // Ctrl/Cmd + wheel и pinch на тачпаде (браузер шлёт wheel с ctrlKey)
  if (event.ctrlKey || event.metaKey) {
    event.preventDefault()
    const factor = Math.exp(-event.deltaY * WHEEL_ZOOM_SENSITIVITY)
    setScaleAtPoint(scale.value * factor, event.clientX, event.clientY)
    return
  }

  // Двухпальцевый скролл тачпада — панорамирование при зуме
  if (isZoomed.value) {
    event.preventDefault()
    translateX.value -= event.deltaX
    translateY.value -= event.deltaY
  }
}

function onPointerDown(event: PointerEvent) {
  if (!canZoomImage() || !isZoomed.value) return
  if (event.button !== 0) return
  const target = event.target as HTMLElement | null
  if (target?.closest('button, a')) return

  isPanning.value = true
  panPointerId = event.pointerId
  panOriginX = event.clientX
  panOriginY = event.clientY
  panStartTx = translateX.value
  panStartTy = translateY.value
  stageEl.value?.setPointerCapture(event.pointerId)
  event.preventDefault()
}

function onPointerMove(event: PointerEvent) {
  if (!isPanning.value || panPointerId !== event.pointerId) return
  translateX.value = panStartTx + (event.clientX - panOriginX)
  translateY.value = panStartTy + (event.clientY - panOriginY)
}

function onPointerUp(event: PointerEvent) {
  if (panPointerId !== event.pointerId) return
  isPanning.value = false
  panPointerId = null
  if (stageEl.value?.hasPointerCapture(event.pointerId)) {
    stageEl.value.releasePointerCapture(event.pointerId)
  }
}

function onDoubleClick(event: MouseEvent) {
  if (!canZoomImage()) return
  const target = event.target as HTMLElement | null
  if (target?.closest('button, a')) return

  if (isZoomed.value) {
    resetZoom()
    return
  }
  setScaleAtPoint(2, event.clientX, event.clientY)
}

async function loadCurrent() {
  const seq = ++loadSeq
  const src = String(props.url || '').trim()
  loading.value = true
  error.value = ''
  kind.value = 'unknown'
  objectUrl.value = ''
  resetZoom()

  if (!src) {
    loading.value = false
    error.value = 'Документ недоступен'
    return
  }

  try {
    const preview = await loadStaffDocumentPreview(src)
    if (seq !== loadSeq) return
    kind.value = preview.kind
    objectUrl.value = preview.objectUrl
    if (preview.kind === 'unknown') {
      error.value = 'Формат документа не поддерживается'
    }
  } catch {
    if (seq !== loadSeq) return
    error.value = 'Не удалось открыть документ'
  } finally {
    if (seq === loadSeq) loading.value = false
  }
}

function onKeydown(event: KeyboardEvent) {
  if (!props.open) return

  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
    return
  }

  const mod = event.ctrlKey || event.metaKey
  if (mod && canZoomImage()) {
    if (event.key === '=' || event.key === '+' || event.code === 'NumpadAdd') {
      event.preventDefault()
      zoomBy(ZOOM_STEP)
      return
    }
    if (event.key === '-' || event.code === 'NumpadSubtract') {
      event.preventDefault()
      zoomBy(-ZOOM_STEP)
      return
    }
    if (event.key === '0' || event.code === 'Numpad0') {
      event.preventDefault()
      resetZoom()
      return
    }
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    emit('prev')
    return
  }
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    emit('next')
  }
}

watch(
  () => [props.open, props.url] as const,
  ([isOpen, url]) => {
    if (!isOpen || !url) {
      resetZoom()
      return
    }
    void loadCurrent()
  },
  { immediate: true },
)

watch(
  () => props.open,
  (isOpen) => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = isOpen ? 'hidden' : ''
    if (!isOpen) resetZoom()
  },
  { immediate: true },
)

function bindStageWheel(el: HTMLElement | null) {
  el?.addEventListener('wheel', onWheel, { passive: false })
}

function unbindStageWheel(el: HTMLElement | null) {
  el?.removeEventListener('wheel', onWheel)
}

watch(stageEl, (el, prev) => {
  unbindStageWheel(prev)
  bindStageWheel(el)
})

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  bindStageWheel(stageEl.value)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  unbindStageWheel(stageEl.value)
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
  loadSeq += 1
  resetZoom()
})
</script>

<style scoped>
.staff-doc-preview {
  position: fixed;
  inset: 0;
  z-index: v-bind(previewOverlayZIndex);
  display: flex;
  flex-direction: column;
  background: #2c2c2e;
  color: #fff;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
}

.staff-doc-preview__stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #1c1c1e;
  touch-action: none;
}

.staff-doc-preview--pdf .staff-doc-preview__stage {
  inset:
    calc(56px + env(safe-area-inset-top, 0px))
    0
    calc(88px + env(safe-area-inset-bottom, 0px));
  background: #525659;
  touch-action: auto;
}

.staff-doc-preview__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #1c1c1e;
  transform-origin: center center;
  will-change: transform;
  user-select: none;
  -webkit-user-drag: none;
  transition: transform 0.12s ease-out;
}

.staff-doc-preview--panning .staff-doc-preview__img {
  transition: none;
  cursor: grabbing;
}

.staff-doc-preview--zoomed .staff-doc-preview__stage {
  cursor: grab;
}

.staff-doc-preview__pdf {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  background: #525659;
}

.staff-doc-preview__open-tab {
  position: absolute;
  left: 50%;
  bottom: 12px;
  z-index: 2;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 14px;
  border-radius: 10px;
  background: #787880cc;
  backdrop-filter: blur(12px);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
  text-decoration: none;
  pointer-events: auto;
}

.staff-doc-preview__open-tab:hover {
  filter: brightness(1.06);
}

.staff-doc-preview__status {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  margin: 0;
  padding: 24px;
  text-align: center;
  font-size: 16px;
  line-height: 24px;
  color: rgba(255, 255, 255, 0.88);
}

.staff-doc-preview__status--error {
  color: #ffb4ab;
}

.staff-doc-preview__close {
  position: absolute;
  top: calc(12px + env(safe-area-inset-top, 0px));
  right: 16px;
  z-index: 5;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: #78788080;
  backdrop-filter: blur(15px);
  color: #fff;
  cursor: pointer;
}

.staff-doc-preview--pdf .staff-doc-preview__close {
  top: calc(10px + env(safe-area-inset-top, 0px));
  right: 12px;
}

.staff-doc-preview__nav {
  position: absolute;
  top: 50%;
  z-index: 4;
  transform: translateY(-50%);
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 999px;
  background: #78788080;
  backdrop-filter: blur(15px);
  color: #fff;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
}

.staff-doc-preview__nav:disabled {
  opacity: 0.45;
  cursor: default;
}

.staff-doc-preview__nav--prev {
  left: 12px;
}

.staff-doc-preview__nav--next {
  right: 12px;
}

.staff-doc-preview__zoom {
  position: absolute;
  top: calc(12px + env(safe-area-inset-top, 0px));
  left: 50%;
  z-index: 5;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border-radius: 12px;
  background: #78788080;
  backdrop-filter: blur(15px);
}

.staff-doc-preview__zoom-btn,
.staff-doc-preview__zoom-value {
  display: grid;
  place-items: center;
  min-width: 36px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
}

.staff-doc-preview__zoom-value {
  min-width: 56px;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.staff-doc-preview__zoom-btn:hover:not(:disabled),
.staff-doc-preview__zoom-value:hover {
  background: #ffffff1a;
}

.staff-doc-preview__zoom-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.staff-doc-preview__footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding:
    12px 16px
    calc(12px + env(safe-area-inset-bottom, 0px));
  pointer-events: none;
}

.staff-doc-preview__caption,
.staff-doc-preview__counter {
  margin: 0;
  max-width: calc(100% - 32px);
  padding: 8px 14px;
  border-radius: 12px;
  background: #78788080;
  backdrop-filter: blur(15px);
  text-align: center;
  font-size: 14px;
  line-height: 20px;
}
</style>
