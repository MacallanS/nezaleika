<template>
  <Teleport to="body">
    <div
      class="ppass-cam"
      role="dialog"
      aria-modal="true"
      :aria-label="cameraLabel"
      @dblclick.prevent
    >
      <!-- Live camera -->
      <template v-if="phase === 'camera'">
        <video
          ref="videoRef"
          class="ppass-cam__video"
          playsinline
          muted
          autoplay
        />
        <canvas ref="canvasRef" class="ppass-cam__canvas" aria-hidden="true" />

        <div v-if="streamReady" class="ppass-cam__dim" aria-hidden="true" />

        <div
          v-if="streamReady && variant !== 'snils'"
          class="ppass-cam__guide"
          :class="`ppass-cam__guide--${variant}`"
          aria-hidden="true"
        >
          <div class="ppass-cam__frame">
            <span v-if="variant !== 'profile'" class="ppass-cam__split" />
            <span v-if="variant === 'main'" class="ppass-cam__photo-slot" />
          </div>
        </div>

        <button
          type="button"
          class="ppass-cam__close"
          aria-label="Закрыть"
          :disabled="saving"
          @click="emitClose"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </button>

        <!-- Live preview controls -->
        <template v-if="streamReady">
          <div class="ppass-cam__controls">
            <button
              type="button"
              class="ppass-cam__side-btn"
              aria-label="Сменить камеру"
              :disabled="!canSwitch"
              @click="switchCamera"
            >
              <img class="ppass-cam__side-icon" :src="iconSwitch" alt="" width="22" height="22" />
            </button>

            <button
              type="button"
              class="ppass-cam__shutter"
              aria-label="Сделать фото"
              :disabled="capturing"
              @click="capture"
            >
              <span class="ppass-cam__shutter-inner" />
            </button>

            <button
              type="button"
              class="ppass-cam__side-btn"
              :class="{ 'ppass-cam__side-btn--on': torchOn }"
              aria-label="Вспышка"
              :disabled="!torchSupported"
              @click="toggleTorch"
            >
              <img class="ppass-cam__side-icon" :src="iconFlashOff" alt="" width="20" height="20" />
            </button>
          </div>
        </template>

        <!-- Waiting for permission / starting -->
        <div v-else-if="cameraStarting" class="ppass-cam__blocked" aria-live="polite">
          <p class="ppass-cam__blocked-title">Открываем камеру…</p>
          <p class="ppass-cam__blocked-hint">Если браузер запросил доступ — разрешите использование камеры.</p>
        </div>

        <!-- Camera failed: retry live camera only -->
        <div v-else class="ppass-cam__blocked">
          <p class="ppass-cam__blocked-title">{{ cameraError || 'Не удалось открыть камеру.' }}</p>
          <p v-if="insecureHint" class="ppass-cam__blocked-hint">{{ insecureHint }}</p>
          <div class="ppass-cam__blocked-actions">
            <button type="button" class="ppass-cam__btn ppass-cam__btn--primary" @click="retryCamera">
              Попробовать ещё раз
            </button>
          </div>
        </div>
      </template>

      <!-- Preview / confirm — та же композиция, что live-камера -->
      <template v-else>
        <div class="ppass-cam__preview-stage" aria-hidden="true">
          <img
            class="ppass-cam__preview"
            :class="{ 'ppass-cam__preview--profile': variant === 'profile' }"
            :src="previewUrl"
            :alt="previewAlt"
          />
          <div class="ppass-cam__dim ppass-cam__dim--review" />
          <div
            v-if="variant !== 'snils' && !isFileSource"
            class="ppass-cam__guide"
            :class="`ppass-cam__guide--${variant}`"
          >
            <div class="ppass-cam__frame">
              <span v-if="variant !== 'profile'" class="ppass-cam__split" />
              <span v-if="variant === 'main'" class="ppass-cam__photo-slot" />
            </div>
          </div>
        </div>

        <button
          type="button"
          class="ppass-cam__close"
          aria-label="Закрыть"
          :disabled="saving"
          @click="emitClose"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </button>

        <div class="ppass-cam__review-footer">
          <p class="ppass-cam__hint">{{ previewHint }}</p>
          <div class="ppass-cam__review-bar">
            <div class="ppass-cam__actions">
              <AuthRRButton
                variant="brand-secondary"
                :label="secondaryLabel"
                :disabled="saving"
                @click="onSecondaryAction"
              />
              <AuthRRButton
                :label="confirmLabel"
                :loading="saving"
                @click="confirmSave"
              />
            </div>
          </div>
        </div>
      </template>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { AuthRRButton } from 'bibli/shared/ui/rr'
import { useAppOverlayWhileMounted } from 'bibli/shared/composables/useAppOverlayBinding'
import { NAV_DRAWER_Z_INDEX } from 'bibli/shared/utils/layerZIndex'
import 'bibli/shared/ui/rr/auth-rr-button.css'
import iconFlashOff from '../assets/activation/passport-tips/cam-flash-off.svg?url'
import iconSwitch from '../assets/activation/passport-tips/cam-switch.svg?url'
import { isImageFile } from '../lib/documentMedia'

useAppOverlayWhileMounted()
const cameraOverlayZIndex = NAV_DRAWER_Z_INDEX

const props = defineProps({
  /** main — разворот с фото; registration — страница регистрации; inn — свидетельство ИНН; snils — СНИЛС; bank — реквизиты; profile — фото профиля */
  variant: {
    type: String,
    default: 'main',
    validator: (v) =>
      v === 'main' ||
      v === 'registration' ||
      v === 'inn' ||
      v === 'snils' ||
      v === 'bank' ||
      v === 'profile',
  },
  /** camera — съёмка; file — проверка выбранного файла (галерея) */
  source: {
    type: String,
    default: 'camera',
    validator: (v) => v === 'camera' || v === 'file',
  },
  /** Файл из галереи для превью (source=file) */
  seedFile: {
    type: [File, Blob],
    default: null,
  },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'save', 'replace'])

const phase = ref(props.source === 'file' ? 'preview' : 'camera')
const videoRef = ref(null)
const canvasRef = ref(null)
const previewUrl = ref('')
const previewBlob = ref(null)
const streamReady = ref(false)
const cameraStarting = ref(props.source !== 'file')
const capturing = ref(false)
const cameraError = ref('')
const insecureHint = ref('')
const facingMode = ref(props.variant === 'profile' ? 'user' : 'environment')
const torchOn = ref(false)
const torchSupported = ref(false)
const deviceIds = ref([])

let mediaStream = null
let localPreviewUrl = null
let startSeq = 0
let seedObjectUrl = null

const isFileSource = computed(() => props.source === 'file')
const canSwitch = computed(() => deviceIds.value.length > 1)
const cameraLabel = computed(() => {
  if (isFileSource.value) return 'Проверка фото'
  if (props.variant === 'profile') return 'Съёмка фото профиля'
  if (props.variant === 'inn') return 'Съёмка свидетельства ИНН'
  if (props.variant === 'snils') return 'Съёмка документа СНИЛС'
  if (props.variant === 'bank') return 'Съёмка банковских реквизитов'
  return 'Съёмка паспорта'
})
const previewAlt = computed(() => {
  if (props.variant === 'profile') return 'Снимок фото профиля'
  if (props.variant === 'inn') return 'Снимок свидетельства ИНН'
  if (props.variant === 'snils') return 'Снимок документа СНИЛС'
  if (props.variant === 'bank') return 'Снимок банковских реквизитов'
  return 'Снимок паспорта'
})
const previewHint = computed(() => {
  if (props.variant === 'profile') return 'Проверьте изображение'
  if (isFileSource.value) return 'Проверьте документ'
  if (props.variant === 'snils') return 'Проверьте фото'
  return 'Проверьте, хорошо ли все видно'
})
const secondaryLabel = computed(() => (isFileSource.value ? 'Заменить' : 'Переснять'))
const confirmLabel = computed(() => 'Сохранить')

async function applySeedFile(file) {
  if (!file) return
  // Камера/превью только для фото; PDF сюда не должен попадать (СНИЛС/ИНН и т.п.)
  if (!isImageFile(file)) {
    emit('close')
    return
  }
  stopStream()
  if (seedObjectUrl) {
    URL.revokeObjectURL(seedObjectUrl)
    seedObjectUrl = null
  }
  if (localPreviewUrl) {
    URL.revokeObjectURL(localPreviewUrl)
    localPreviewUrl = null
  }
  seedObjectUrl = URL.createObjectURL(file)
  previewBlob.value = file
  previewUrl.value = seedObjectUrl
  phase.value = 'preview'
  cameraStarting.value = false
  streamReady.value = false
}

function isInsecureOrigin() {
  if (typeof window === 'undefined') return false
  if (window.isSecureContext) return false
  const host = String(window.location.hostname || '').toLowerCase()
  return host !== 'localhost' && host !== '127.0.0.1' && host !== '[::1]'
}

async function listCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    deviceIds.value = devices.filter((d) => d.kind === 'videoinput').map((d) => d.deviceId)
  } catch {
    deviceIds.value = []
  }
}

function stopStream() {
  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => {
      try {
        // Гасим torch до stop — на iOS иначе вспышка может остаться / мигнуть.
        if (torchOn.value) {
          t.applyConstraints?.({ advanced: [{ torch: false }] }).catch(() => {})
        }
      } catch {
        /* ignore */
      }
      t.stop()
    })
    mediaStream = null
  }
  streamReady.value = false
  torchSupported.value = false
  torchOn.value = false
  if (videoRef.value) videoRef.value.srcObject = null
}

async function startCamera() {
  const seq = ++startSeq
  cameraStarting.value = true
  cameraError.value = ''
  insecureHint.value = ''
  stopStream()

  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    if (seq !== startSeq) return
    cameraStarting.value = false
    if (isInsecureOrigin()) {
      cameraError.value = 'Браузер не даёт live-камеру по HTTP в локальной сети.'
      insecureHint.value =
        'Нажмите «Попробовать ещё раз», чтобы снова запросить доступ к камере. На HTTP в локальной сети браузер блокирует live-камеру — нужен https:// или 127.0.0.1.'
    } else {
      cameraError.value = 'Камера недоступна в этом браузере.'
      insecureHint.value = 'Нажмите «Попробовать ещё раз» или откройте сайт по https:// / 127.0.0.1.'
    }
    return
  }

  const tryConstraints = [
    {
      audio: false,
      video: {
        facingMode: { exact: facingMode.value },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    },
    {
      audio: false,
      video: {
        facingMode: { ideal: facingMode.value },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    },
  ]

  try {
    let lastErr = null
    for (const constraints of tryConstraints) {
      if (seq !== startSeq) return
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
        lastErr = null
        break
      } catch (err) {
        lastErr = err
      }
    }
    if (seq !== startSeq) {
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop())
        mediaStream = null
      }
      return
    }
    if (!mediaStream) throw lastErr || new Error('getUserMedia failed')

    await nextTick()
    if (seq !== startSeq) return
    const video = videoRef.value
    if (!video) {
      cameraStarting.value = false
      cameraError.value = 'Не удалось открыть камеру.'
      return
    }
    video.srcObject = mediaStream
    await video.play()
    if (seq !== startSeq) return

    const track = mediaStream.getVideoTracks()[0]
    // Явно выключаем torch при старте (некоторые устройства включают свет сами).
    try {
      await track?.applyConstraints?.({ advanced: [{ torch: false }] })
    } catch {
      /* torch может не поддерживаться */
    }
    torchOn.value = false

    streamReady.value = true
    cameraStarting.value = false
    await listCameras()

    const caps = track?.getCapabilities?.() || {}
    torchSupported.value = Boolean(caps.torch)
  } catch (err) {
    if (seq !== startSeq) return
    console.error('[passport-camera] getUserMedia failed', err)
    cameraStarting.value = false
    if (isInsecureOrigin()) {
      cameraError.value = 'Браузер заблокировал live-камеру на этом адресе (нужен HTTPS).'
      insecureHint.value = 'Нажмите «Попробовать ещё раз», чтобы снова запросить доступ. На этом адресе нужен HTTPS.'
    } else if (err?.name === 'NotAllowedError') {
      cameraError.value = 'Разрешите доступ к камере в настройках браузера.'
      insecureHint.value = 'После разрешения нажмите «Попробовать ещё раз».'
    } else {
      cameraError.value = 'Не удалось открыть камеру.'
      insecureHint.value = 'Нажмите «Попробовать ещё раз».'
    }
  }
}

async function switchCamera() {
  facingMode.value = facingMode.value === 'environment' ? 'user' : 'environment'
  await startCamera()
}

async function toggleTorch() {
  if (!torchSupported.value || !mediaStream) return
  const track = mediaStream.getVideoTracks()[0]
  if (!track) return
  try {
    const next = !torchOn.value
    await track.applyConstraints({ advanced: [{ torch: next }] })
    torchOn.value = next
  } catch (err) {
    console.warn('[passport-camera] torch failed', err)
    torchSupported.value = false
  }
}

function capture() {
  const video = videoRef.value
  const canvas = canvasRef.value
  if (!video || !canvas || !streamReady.value || capturing.value) return
  capturing.value = true
  try {
    const w = video.videoWidth || 1280
    const h = video.videoHeight || 720
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, w, h)
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          capturing.value = false
          cameraError.value = 'Не удалось сделать снимок'
          return
        }
        if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
        localPreviewUrl = URL.createObjectURL(blob)
        previewBlob.value = blob
        previewUrl.value = localPreviewUrl
        phase.value = 'preview'
        stopStream()
        capturing.value = false
      },
      'image/jpeg',
      0.92,
    )
  } catch (err) {
    console.error('[passport-camera] capture failed', err)
    cameraError.value = 'Не удалось сделать снимок'
    capturing.value = false
  }
}

function retake() {
  phase.value = 'camera'
  previewBlob.value = null
  previewUrl.value = ''
  if (localPreviewUrl) {
    URL.revokeObjectURL(localPreviewUrl)
    localPreviewUrl = null
  }
  if (seedObjectUrl) {
    URL.revokeObjectURL(seedObjectUrl)
    seedObjectUrl = null
  }
  void startCamera()
}

function onSecondaryAction() {
  if (isFileSource.value) {
    emit('replace')
    return
  }
  retake()
}

function confirmSave() {
  if (props.saving || !previewBlob.value) return
  if (previewBlob.value instanceof File) {
    emit('save', { file: previewBlob.value, previewUrl: previewUrl.value })
    return
  }
  const prefix =
    props.variant === 'profile'
      ? 'profile'
      : props.variant === 'inn'
        ? 'inn'
        : props.variant === 'snils'
          ? 'snils'
          : props.variant === 'bank'
            ? 'bank'
            : `passport-${props.variant}`
  const file = new File([previewBlob.value], `${prefix}-${Date.now()}.jpg`, {
    type: 'image/jpeg',
  })
  emit('save', { file, previewUrl: previewUrl.value })
}

function retryCamera() {
  void startCamera()
}

function emitClose() {
  if (props.saving) return
  emit('close')
}

watch(
  () => props.seedFile,
  (file) => {
    if (props.source === 'file' && file) void applySeedFile(file)
  },
)

onMounted(() => {
  if (props.source === 'file') {
    if (props.seedFile) void applySeedFile(props.seedFile)
    return
  }
  void startCamera()
})

onBeforeUnmount(() => {
  startSeq += 1
  stopStream()
  if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
  if (seedObjectUrl) URL.revokeObjectURL(seedObjectUrl)
})
</script>

<style scoped>
.ppass-cam,
.ppass-cam *,
.ppass-cam *::before,
.ppass-cam *::after {
  box-sizing: border-box;
}

.ppass-cam {
  position: fixed;
  inset: 0;
  z-index: v-bind(cameraOverlayZIndex);
  display: flex;
  flex-direction: column;
  background: #2c2c2e;
  color: #fff;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  touch-action: manipulation;
  -webkit-user-select: none;
  user-select: none;
}

.ppass-cam__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #1c1c1e;
  touch-action: manipulation;
  pointer-events: none;
}

.ppass-cam__canvas {
  display: none;
}

.ppass-cam__dim {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: rgba(28, 28, 30, 0.35);
}

.ppass-cam__guide {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
  padding: 56px 10px 120px;
  box-sizing: border-box;
}

.ppass-cam__frame {
  position: relative;
  box-sizing: border-box;
  border: 2px solid rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  max-height: 100%;
}

.ppass-cam__guide--main .ppass-cam__frame {
  width: min(92vw, 440px);
  aspect-ratio: 3 / 4.2;
}

.ppass-cam__guide--main .ppass-cam__split {
  position: absolute;
  left: 8%;
  right: 8%;
  top: 50%;
  height: 2px;
  background: rgba(255, 255, 255, 0.95);
  transform: translateY(-50%);
}

.ppass-cam__photo-slot {
  position: absolute;
  left: 10%;
  bottom: 8%;
  width: 28%;
  aspect-ratio: 3 / 4;
  border: 2px solid rgba(255, 255, 255, 0.95);
  border-radius: 10px;
}

.ppass-cam__guide--registration .ppass-cam__frame {
  width: min(96vw, 520px);
  aspect-ratio: 4 / 2.6;
}

.ppass-cam__guide--registration .ppass-cam__split {
  position: absolute;
  top: 8%;
  bottom: 8%;
  left: 50%;
  width: 2px;
  background: rgba(255, 255, 255, 0.95);
  transform: translateX(-50%);
}

.ppass-cam__guide--inn .ppass-cam__frame {
  width: min(92vw, 440px);
  aspect-ratio: 3 / 4.2;
}

.ppass-cam__guide--inn .ppass-cam__split {
  display: none;
}

.ppass-cam__guide--bank .ppass-cam__frame {
  width: min(92vw, 440px);
  aspect-ratio: 3 / 4.2;
}

.ppass-cam__guide--bank .ppass-cam__split {
  display: none;
}

.ppass-cam__guide--profile .ppass-cam__frame {
  width: min(82vw, 360px);
  aspect-ratio: 3 / 4;
  border-radius: 50%;
  border-width: 2px;
  background: transparent;
}

.ppass-cam__guide--profile .ppass-cam__split {
  display: none;
}

.ppass-cam__close {
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
  -webkit-backdrop-filter: blur(15px);
  color: #fff;
  cursor: pointer;
}

.ppass-cam__close:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ppass-cam__blocked {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 72px 24px calc(24px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
  text-align: center;
  pointer-events: none;
}

.ppass-cam__blocked-title {
  margin: 0;
  max-width: 320px;
  font-size: 17px;
  font-weight: 600;
  line-height: 24px;
}

.ppass-cam__blocked-hint {
  margin: 0;
  max-width: 320px;
  font-size: 14px;
  line-height: 20px;
  color: rgba(255, 255, 255, 0.72);
}

.ppass-cam__blocked-actions {
  display: grid;
  width: 100%;
  max-width: 320px;
  gap: 10px;
  margin-top: 12px;
  pointer-events: auto;
}

.ppass-cam__controls {
  position: absolute;
  left: 50%;
  bottom: calc(40px + env(safe-area-inset-bottom, 0px));
  z-index: 2;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 48px 1fr 48px;
  align-items: center;
  width: min(88vw, 420px);
  transform: translateX(-50%);
  pointer-events: none;
}

.ppass-cam__controls > * {
  pointer-events: auto;
}

.ppass-cam__side-btn {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 999px;
  background: #78788080;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  color: #fff;
  cursor: pointer;
}

.ppass-cam__side-btn:first-child {
  justify-self: start;
}

.ppass-cam__side-btn:last-child {
  justify-self: end;
}

.ppass-cam__side-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.ppass-cam__side-btn--on {
  background: rgba(28, 74, 229, 0.85);
}

.ppass-cam__side-icon {
  display: block;
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.ppass-cam__shutter {
  display: grid;
  place-items: center;
  justify-self: center;
  width: 72px;
  height: 72px;
  padding: 0;
  border: 3px solid #fff;
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
}

.ppass-cam__shutter:disabled {
  opacity: 0.4;
  cursor: default;
}

.ppass-cam__shutter-inner {
  width: 56px;
  height: 56px;
  border-radius: 999px;
  background: #fff;
}

.ppass-cam__preview-stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #1c1c1e;
  touch-action: manipulation;
}

.ppass-cam__preview {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  background: #1c1c1e;
  touch-action: manipulation;
  -webkit-user-drag: none;
  user-select: none;
  pointer-events: none;
}

.ppass-cam__preview--profile {
  object-fit: cover;
}

.ppass-cam__dim--review {
  background: rgba(28, 28, 30, 0.42);
}

.ppass-cam__review-footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  pointer-events: none;
}

.ppass-cam__hint {
  margin: 0;
  width: max-content;
  max-width: calc(100% - 32px);
  padding: 10px 16px;
  border-radius: 12px;
  box-sizing: border-box;
  background: #78788080;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 400;
  font-style: normal;
  font-size: var(--rr-font-size-font-size-m, 16px);
  line-height: var(--rr-line-height-line-height-m, 24px);
  letter-spacing: var(--rr-tracking-tracking-m, 0px);
  text-align: center;
  color: #fff;
}

.ppass-cam__review-bar {
  width: 100%;
  padding:
    16px
    16px
    calc(16px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
  border-radius: 16px 16px 0 0;
  background: var(--rr-backgrounds-quaternary, #f2f3f7);
  pointer-events: auto;
}

.ppass-cam__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
}

.ppass-cam__actions :deep(.auth-rr-button) {
  width: 100%;
}

.ppass-cam__blocked-actions .ppass-cam__btn {
  min-height: 48px;
  width: 100%;
  border: none;
  border-radius: var(--rr-radius-l, 12px);
  font: inherit;
  font-size: var(--rr-font-size-font-size-m, 16px);
  font-weight: 600;
  cursor: pointer;
}

.ppass-cam__btn--primary {
  background: var(--rr-labels-brand-primary, #1c4ae5);
  color: #fff;
}
</style>
