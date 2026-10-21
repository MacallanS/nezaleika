<template>
  <div
    class="staff-doc-image-card"
    :class="{ 'staff-doc-image-card--editing': editing }"
    :style="cardSizeStyle"
  >
    <div class="staff-doc-image-card__frame" :style="previewFrameStyle">
      <button
        v-if="displayMode !== 'empty'"
        type="button"
        class="staff-doc-image-card__preview"
        :disabled="!previewUrl"
        :aria-label="previewAriaLabel"
        @click="onPreview"
      >
        <span v-if="displayMode === 'loading'" class="staff-doc-image-card__placeholder">
          Загрузка…
        </span>
        <img
          v-else-if="displayMode === 'image' && displaySrc"
          :src="displaySrc"
          :alt="label"
          class="staff-doc-image-card__image"
          @error="onImgError"
        />
        <span v-else-if="displayMode === 'pdf'" class="staff-doc-image-card__pdf" aria-hidden="true">
          <embed
            v-if="pdfThumbSrc && usePdfEmbedThumb"
            class="staff-doc-image-card__pdf-frame"
            :src="pdfThumbSrc"
            type="application/pdf"
            tabindex="-1"
          />
          <iframe
            v-else-if="pdfThumbSrc"
            class="staff-doc-image-card__pdf-frame"
            :src="pdfThumbSrc"
            tabindex="-1"
          />
          <template v-else>
            <span class="staff-doc-image-card__pdf-badge">PDF</span>
            <span class="staff-doc-image-card__pdf-label">{{ label }}</span>
          </template>
          <span
            v-if="pdfThumbSrc"
            class="staff-doc-image-card__pdf-badge staff-doc-image-card__pdf-badge--overlay"
          >
            PDF
          </span>
        </span>
        <span v-else class="staff-doc-image-card__placeholder">{{ brokenText }}</span>
      </button>

      <div
        v-else
        class="staff-doc-image-card__preview staff-doc-image-card__preview--empty"
        :aria-label="label"
      >
        <button
          v-if="editing"
          type="button"
          class="staff-doc-image-card__upload"
          @click="fileInput?.click()"
        >
          Загрузить
        </button>
        <span v-else class="staff-doc-image-card__empty-label">Нет файла</span>
      </div>

      <div v-if="editing && displayMode !== 'empty'" class="staff-doc-image-card__actions">
        <button
          type="button"
          class="staff-doc-image-card__btn"
          aria-label="Заменить фото"
          @click="fileInput?.click()"
        >
          <img class="staff-doc-image-card__icon" :src="iconReplace" alt="" width="16" height="16" />
        </button>
        <button
          type="button"
          class="staff-doc-image-card__btn"
          aria-label="Удалить фото"
          @click="emit('remove')"
        >
          <img class="staff-doc-image-card__icon" :src="iconDelete" alt="" width="16" height="16" />
        </button>
      </div>
    </div>

    <p v-if="showCaption && label" class="staff-doc-image-card__caption">{{ label }}</p>

    <input
      ref="fileInput"
      class="staff-doc-image-card__file"
      type="file"
      :accept="acceptValue"
      @change="onReplace"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import {
  ACCEPT_IMAGE,
  ACCEPT_IMAGE_OR_PDF,
  isAllowedUploadFile,
  uploadRejectMessage,
} from 'bibli/widgets/Profile/rr/lib/documentMedia'
import iconReplace from '../../assets/icons/image-replace.svg'
import iconDelete from '../../assets/icons/image-delete.svg'
import {
  classifyStaffLocalFile,
  loadStaffDocumentPreview,
  pdfFrameSrc,
  revokeStaffDocumentPreview,
  usePdfThumbnailEmbed,
  type StaffDocumentKind,
} from '../../lib/staffProfileDocumentMedia'

const props = withDefaults(
  defineProps<{
    url: string
    label: string
    editing?: boolean
    uploadMode?: 'image' | 'image-or-pdf'
    brokenText?: string
    /** Сторона квадрата превью в px. */
    size?: number
    /** Подпись под превью (Паспорт / Прописка). */
    showCaption?: boolean
  }>(),
  {
    editing: false,
    uploadMode: 'image-or-pdf',
    brokenText: 'Не удалось загрузить',
    size: 120,
    showCaption: true,
  },
)

const emit = defineEmits<{
  replace: [file: File]
  remove: []
  preview: [url: string]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const previewUrl = ref(props.url)
const displayMode = ref<'loading' | 'image' | 'pdf' | 'broken' | 'empty'>('empty')
const displaySrc = ref('')
const pdfPreviewUrl = ref('')
const localFile = ref<File | null>(null)
let objectUrl = ''
let resolveSeq = 0

const acceptValue = computed(() =>
  props.uploadMode === 'image' ? ACCEPT_IMAGE : ACCEPT_IMAGE_OR_PDF,
)

const cardSizeStyle = computed(() => ({
  width: `${props.size}px`,
}))

const previewFrameStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
}))

const usePdfEmbedThumb = computed(() => usePdfThumbnailEmbed())

const pdfThumbSrc = computed(() => {
  if (!pdfPreviewUrl.value) return ''
  return pdfFrameSrc(pdfPreviewUrl.value, { mode: 'thumb' })
})

const previewAriaLabel = computed(() => {
  if (!previewUrl.value) return props.label
  if (displayMode.value === 'pdf') return `Открыть PDF: ${props.label}`
  if (displayMode.value === 'loading') return `Загрузка: ${props.label}`
  return `Открыть: ${props.label}`
})

function revokeLocalObjectUrl() {
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl)
    objectUrl = ''
  }
}

function setDisplay(kind: StaffDocumentKind, src: string) {
  if (kind === 'pdf') {
    displaySrc.value = ''
    pdfPreviewUrl.value = src
    displayMode.value = 'pdf'
    return
  }
  pdfPreviewUrl.value = ''
  if (kind === 'image') {
    displaySrc.value = src
    displayMode.value = 'image'
    return
  }
  displaySrc.value = ''
  displayMode.value = 'broken'
}

let imgErrorRetries = 0

async function resolveThumb() {
  const seq = ++resolveSeq
  const src = String(previewUrl.value || '').trim()
  imgErrorRetries = 0

  if (!src) {
    revokeLocalObjectUrl()
    displaySrc.value = ''
    pdfPreviewUrl.value = ''
    displayMode.value = 'empty'
    return
  }

  if (localFile.value) {
    const kind = classifyStaffLocalFile(localFile.value)
    setDisplay(kind, src)
    return
  }

  if (src.startsWith('blob:') || src.startsWith('data:')) {
    displayMode.value = 'loading'
    try {
      const preview = await loadStaffDocumentPreview(src)
      if (seq !== resolveSeq) return
      setDisplay(preview.kind, preview.objectUrl)
    } catch {
      if (seq !== resolveSeq) return
      displayMode.value = 'broken'
    }
    return
  }

  displayMode.value = 'loading'
  try {
    const preview = await loadStaffDocumentPreview(src)
    if (seq !== resolveSeq) return
    setDisplay(preview.kind, preview.objectUrl)
  } catch {
    if (seq !== resolveSeq) return
    displayMode.value = 'broken'
  }
}

function onImgError() {
  if (displayMode.value !== 'image') return
  // Object URL уже из document-proxy: если <img> не открыл — повторный fetch не поможет
  // и при useCache:false + revoke даёт бесконечный цикл запросов.
  if (String(displaySrc.value || '').startsWith('blob:')) {
    displaySrc.value = ''
    displayMode.value = 'broken'
    return
  }
  if (imgErrorRetries >= 1) {
    displaySrc.value = ''
    displayMode.value = 'broken'
    return
  }
  imgErrorRetries += 1
  displaySrc.value = ''
  const seq = resolveSeq
  void (async () => {
    try {
      const preview = await loadStaffDocumentPreview(previewUrl.value)
      if (seq !== resolveSeq) return
      setDisplay(preview.kind, preview.objectUrl)
    } catch {
      if (seq !== resolveSeq) return
      displayMode.value = 'broken'
    }
  })()
}

function onPreview() {
  if (!previewUrl.value) return
  emit('preview', previewUrl.value)
}

function onReplace(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  if (!isAllowedUploadFile(file, props.uploadMode)) {
    window.alert(uploadRejectMessage(props.uploadMode))
    return
  }

  if (objectUrl) URL.revokeObjectURL(objectUrl)
  const kind = classifyStaffLocalFile(file)
  const typed =
    kind === 'pdf' && !String(file.type || '').toLowerCase().includes('pdf')
      ? new File([file], file.name, { type: 'application/pdf' })
      : file
  objectUrl = URL.createObjectURL(typed)
  localFile.value = typed
  previewUrl.value = objectUrl
  emit('replace', file)
}

watch(
  () => props.url,
  (url) => {
    const next = String(url || '')
    if (objectUrl && previewUrl.value === objectUrl) {
      revokeLocalObjectUrl()
    }
    localFile.value = null
    const prev = String(previewUrl.value || '')
    // Сбрасываем кэш предыдущего src, не нового — иначе гонка revoke ↔ <img>.
    if (prev && prev !== next) {
      revokeStaffDocumentPreview(prev)
    }
    if (previewUrl.value === next) {
      void resolveThumb()
      return
    }
    previewUrl.value = next
  },
)

watch(previewUrl, () => {
  void resolveThumb()
}, { immediate: true })

onBeforeUnmount(() => {
  resolveSeq += 1
  revokeLocalObjectUrl()
})
</script>

<style scoped>
.staff-doc-image-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  flex-shrink: 0;
  gap: 6px;
  background: transparent;
}

.staff-doc-image-card__frame {
  position: relative;
  flex: 0 0 auto;
  width: 100%;
  border-radius: var(--rr-radius-l, 12px);
  overflow: hidden;
  background: var(--rr-backgrounds-quaternary, #f2f3f7);
}

.staff-doc-image-card__preview {
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: var(--rr-radius-l, 12px);
  background: transparent;
  cursor: pointer;
  overflow: hidden;
  flex: 0 0 auto;
}

.staff-doc-image-card__preview:disabled {
  cursor: default;
}

.staff-doc-image-card--editing .staff-doc-image-card__preview {
  cursor: pointer;
}

.staff-doc-image-card--editing .staff-doc-image-card__preview:disabled {
  cursor: default;
}

.staff-doc-image-card__image {
  flex: 1 1 auto;
  align-self: stretch;
  display: block;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  object-fit: cover;
  object-position: center;
  background: #fff;
}

.staff-doc-image-card__caption {
  margin: 0;
  padding: 0 2px;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  text-align: center;
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
  word-break: break-word;
}

.staff-doc-image-card__pdf {
  flex: 1 1 auto;
  align-self: stretch;
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  overflow: clip;
  background: linear-gradient(160deg, #eef1f8 0%, #e2e6f0 100%);
  color: var(--rr-labels-neutral-primary, #101012);
}

.staff-doc-image-card__pdf:not(:has(.staff-doc-image-card__pdf-frame)) {
  padding: 8px;
}

.staff-doc-image-card__pdf-frame {
  /* Чуть крупнее карточки — обрезаем chrome/scrollbar PDF viewer по краям. */
  position: absolute;
  inset: -14px;
  display: block;
  width: calc(100% + 28px);
  height: calc(100% + 28px);
  max-width: none;
  margin: 0;
  padding: 0;
  border: none;
  overflow: hidden;
  pointer-events: none;
  background: #ffffff;
}

.staff-doc-image-card__pdf-badge {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  padding: 4px 8px;
  border-radius: 6px;
  background: var(--rr-labels-brand-primary, #3d5afe);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1;
}

.staff-doc-image-card__pdf-badge--overlay {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 1;
  box-shadow: 0 1px 4px rgba(16, 16, 18, 0.16);
}

.staff-doc-image-card__pdf-label {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  max-height: 2.6em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  text-align: center;
  font-size: 10px;
  line-height: 1.3;
  color: var(--rr-labels-neutral-secondary, #6b6d76);
  word-break: break-word;
}

.staff-doc-image-card__preview--empty {
  cursor: default;
}

.staff-doc-image-card__placeholder,
.staff-doc-image-card__preview--empty {
  padding: 8px;
  text-align: center;
}

.staff-doc-image-card__placeholder {
  font-size: 12px;
  line-height: 16px;
  color: var(--rr-labels-neutral-tertiary, #8b8d98);
}

.staff-doc-image-card__empty-label {
  font-size: 12px;
  line-height: 16px;
  color: var(--rr-labels-neutral-tertiary, #8b8d98);
}

.staff-doc-image-card__upload {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  max-width: 100%;
  padding: 6px 10px;
  border: none;
  border-radius: var(--rr-radius-s, 6px);
  background: var(--rr-labels-brand-primary, #3d5afe);
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  cursor: pointer;
}

.staff-doc-image-card__upload:hover {
  filter: brightness(0.96);
}

.staff-doc-image-card__actions {
  position: absolute;
  right: 8px;
  bottom: 8px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.staff-doc-image-card__btn {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 4px;
  border: none;
  border-radius: var(--rr-radius-s, 6px);
  background: #ffffff;
  cursor: pointer;
}

.staff-doc-image-card__icon {
  display: block;
  width: 16px;
  height: 16px;
}

.staff-doc-image-card__file {
  display: none;
}
</style>
