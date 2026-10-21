<template>
  <button
    type="button"
    class="profile-doc-thumb"
    :class="{
      'profile-doc-thumb--empty': !src,
      'profile-doc-thumb--fill': fill,
      'profile-doc-thumb--pdf': displayMode === 'pdf',
      'profile-doc-thumb--loading': displayMode === 'loading',
    }"
    :disabled="disabled"
    :aria-label="ariaLabel"
    @click.stop="onClick"
  >
    <template v-if="src">
      <span v-if="displayMode === 'loading'" class="profile-doc-thumb__empty" aria-hidden="true">
        Загрузка…
      </span>
      <img
        v-else-if="displayMode === 'image' && displaySrc"
        class="profile-doc-thumb__img"
        :src="displaySrc"
        :alt="alt"
        @error="onImgError"
      />
      <span v-else-if="displayMode === 'pdf'" class="profile-doc-thumb__pdf" aria-hidden="true">
        <span class="profile-doc-thumb__pdf-badge">PDF</span>
        <span class="profile-doc-thumb__pdf-label">{{ pdfLabel }}</span>
      </span>
      <span v-else class="profile-doc-thumb__empty" aria-hidden="true">{{ brokenText }}</span>
    </template>
    <span v-else class="profile-doc-thumb__empty">{{ emptyText }}</span>
    <span class="profile-doc-thumb__eye" aria-hidden="true">
      <img :src="eyeGlyph" alt="" width="18" height="18" />
    </span>
  </button>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import eyeGlyph from '../assets/activation/passport-tips/preview-eye-glyph.svg'
import { isPdfMime, stripLeadingUtf8Bom } from '../lib/documentMedia'
import { buildDocumentPreviewCandidates } from 'bibli/shared/utils/documentApiOrigin'

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  emptyText: { type: String, default: 'Нет фото' },
  /** Явно PDF (иначе определяем по mime / содержимому). */
  isPdf: { type: Boolean, default: false },
  /** MIME с бэка (application/pdf | image/jpeg …) — надёжнее расширения в code. */
  mime: { type: String, default: '' },
  pdfLabel: { type: String, default: 'Документ' },
  /**
   * false для фото профиля: при ошибке не показывать PDF-плитку.
   * true (default) — если img не открылся, пробуем как PDF.
   */
  allowPdfFallback: { type: Boolean, default: true },
  brokenText: { type: String, default: 'Не удалось загрузить' },
  /** Растянуть на всю ширину родителя (сетки документов). */
  fill: { type: Boolean, default: false },
  /**
   * true — слот только для просмотра (не кликается без src).
   * false (default) — пустой слот тоже кликабелен (пересъём / загрузка после отклонения).
   */
  readOnly: { type: Boolean, default: false },
})

const emit = defineEmits(['click'])

/** @type {import('vue').Ref<'loading'|'image'|'pdf'|'broken'|'empty'>} */
const displayMode = ref('empty')
const displaySrc = ref('')
let objectUrl = null
let resolveSeq = 0

const disabled = computed(() => props.readOnly && !props.src)

const ariaLabel = computed(() => {
  if (!props.src) return props.emptyText || 'Добавить фото'
  if (displayMode.value === 'broken') return props.brokenText
  if (displayMode.value === 'pdf') return props.alt || 'Открыть PDF'
  if (displayMode.value === 'loading') return 'Загрузка документа'
  return props.alt || 'Открыть фото'
})

function revokeObjectUrl() {
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl)
    objectUrl = null
  }
}

function buildCandidates(src) {
  return buildDocumentPreviewCandidates(src, { isDev: import.meta.env.DEV })
}

function sniffPdf(bytes) {
  if (!bytes || bytes.length < 4) return false
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 // %PDF
}

function sniffImage(bytes) {
  if (!bytes || bytes.length < 3) return false
  // JPEG
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return true
  // PNG
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e) return true
  // GIF
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return true
  // WEBP (RIFF....WEBP)
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return true
  }
  return false
}

async function fetchAsBlob(url) {
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'omit',
    cache: 'force-cache',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const blob = await res.blob()
  const type = String(blob.type || '').toLowerCase()
  if (type.includes('json') || type.includes('html') || type.includes('text/')) {
    // Иногда SPA HTML приходит как text/html с 200
    const head = new Uint8Array(await blob.slice(0, 16).arrayBuffer())
    if (!sniffPdf(head) && !sniffImage(head)) {
      throw new Error('Not a document blob')
    }
  }
  return blob
}

async function classifyBlob(blob) {
  const type = String(blob.type || '').toLowerCase()
  if (isPdfMime(type)) return 'pdf'
  if (type.startsWith('image/')) return 'image'
  const head = new Uint8Array(await blob.slice(0, 16).arrayBuffer())
  if (sniffPdf(head)) return 'pdf'
  if (sniffImage(head)) return 'image'
  return 'unknown'
}

function setImageFromUrl(url) {
  revokeObjectUrl()
  displaySrc.value = url
  displayMode.value = 'image'
}

async function setImageFromBlob(blob) {
  revokeObjectUrl()
  const cleaned = await stripLeadingUtf8Bom(blob)
  objectUrl = URL.createObjectURL(cleaned)
  displaySrc.value = objectUrl
  displayMode.value = 'image'
}

function setPdfMode() {
  revokeObjectUrl()
  displaySrc.value = ''
  displayMode.value = 'pdf'
}

function setBroken() {
  revokeObjectUrl()
  displaySrc.value = ''
  displayMode.value = 'broken'
}

function shouldTryDirectImageFallback(src, candidates) {
  if (!src) return false
  if (src.startsWith('blob:') || src.startsWith('data:')) return true
  if (candidates.length === 0) return true
  // Если уже пробовали proxy/document/absolute через fetch, повторный <img src>
  // только дублирует 404/CORS в сети и не даёт новых данных.
  return candidates.length === 1 && candidates[0] === src
}

async function resolvePreview() {
  const seq = ++resolveSeq
  const src = String(props.src || '')
  if (!src) {
    revokeObjectUrl()
    displaySrc.value = ''
    displayMode.value = 'empty'
    return
  }

  // Явный PDF / mime с сервера — без img-попытки
  if (props.isPdf || isPdfMime(props.mime)) {
    setPdfMode()
    return
  }

  // Локальный blob/data — сразу картинка (файлы PDF сюда обычно с isPdf)
  if (src.startsWith('blob:') || src.startsWith('data:')) {
    setImageFromUrl(src)
    return
  }

  displayMode.value = 'loading'
  const candidates = buildCandidates(src)

  // 1) Быстрый путь: попробовать как <img> через fetch→blob (надёжнее прямого img при SPA HTML)
  for (const url of candidates) {
    if (seq !== resolveSeq) return
    try {
      const blob = await fetchAsBlob(url)
      if (seq !== resolveSeq) return
      const kind = await classifyBlob(blob)
      if (kind === 'image') {
        await setImageFromBlob(blob)
        return
      }
      if (kind === 'pdf') {
        if (props.allowPdfFallback || props.isPdf || isPdfMime(props.mime)) {
          setPdfMode()
          return
        }
        // Фото-only шаг, а на сервере PDF — всё равно покажем плитку PDF, лучше чем «сломано»
        setPdfMode()
        return
      }
    } catch {
      /* next candidate */
    }
  }

  if (seq !== resolveSeq) return

  // 2) Последний шанс: прямой src в img только когда он реально отличается
  // от уже проверенных fetch-кандидатов.
  if (shouldTryDirectImageFallback(src, candidates)) {
    setImageFromUrl(src)
    return
  }

  if (props.allowPdfFallback) {
    setPdfMode()
    return
  }

  setBroken()
}

function onImgError() {
  // Object URL из fetch — повторный resolvePreview только крутит document-proxy.
  if (displayMode.value !== 'image') return
  if (String(displaySrc.value || '').startsWith('blob:')) {
    setBroken()
    return
  }
  void (async () => {
    const seq = resolveSeq
    const candidates = buildCandidates(props.src).slice(1)
    for (const url of candidates) {
      if (seq !== resolveSeq) return
      try {
        const blob = await fetchAsBlob(url)
        if (seq !== resolveSeq) return
        const kind = await classifyBlob(blob)
        if (kind === 'image') {
          await setImageFromBlob(blob)
          return
        }
        if (kind === 'pdf') {
          setPdfMode()
          return
        }
      } catch {
        /* next */
      }
    }
    if (seq === resolveSeq) {
      if (props.allowPdfFallback) setPdfMode()
      else setBroken()
    }
  })()
}

watch(
  () => [props.src, props.isPdf, props.mime, props.allowPdfFallback],
  () => {
    void resolvePreview()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  resolveSeq += 1
  revokeObjectUrl()
})

function onClick(event) {
  if (disabled.value) return
  emit('click', event)
}
</script>

<style scoped>
.profile-doc-thumb {
  position: relative;
  box-sizing: border-box;
  display: block;
  width: 120px;
  max-width: 100%;
  aspect-ratio: 1 / 1;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: var(--rr-radius-l, 12px);
  overflow: hidden;
  background: var(--rr-backgrounds-quaternary, #f2f3f7);
  cursor: pointer;
  font: inherit;
  color: inherit;
  flex: 0 0 auto;
  align-self: flex-start;
}

.profile-doc-thumb--fill {
  width: 100%;
  align-self: stretch;
}

.profile-doc-thumb:disabled {
  cursor: default;
}

.profile-doc-thumb--empty:not(:disabled) {
  cursor: pointer;
}

.profile-doc-thumb__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  touch-action: manipulation;
  -webkit-user-drag: none;
  user-select: none;
  pointer-events: none;
}

.profile-doc-thumb__pdf {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 100%;
  padding: 12px;
  background: linear-gradient(160deg, #eef1f8 0%, #e2e6f0 100%);
  color: var(--rr-labels-neutral-primary, #101012);
}

.profile-doc-thumb__pdf-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  padding: 6px 10px;
  border-radius: 8px;
  background: var(--rr-labels-brand-primary, #3d5afe);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.profile-doc-thumb__pdf-label {
  font-size: var(--rr-font-size-font-size-xs, 12px);
  line-height: 1.3;
  text-align: center;
  color: var(--rr-labels-neutral-secondary, #6b6d76);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-doc-thumb__empty {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  font-size: var(--rr-font-size-font-size-xs, 12px);
  line-height: var(--rr-line-height-line-height-xs, 16px);
  color: var(--rr-labels-neutral-tertiary, #8b8d98);
  text-align: center;
  padding: 8px;
}

.profile-doc-thumb__eye {
  position: absolute;
  right: 8px;
  bottom: 8px;
  z-index: 2;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin: 0;
  padding: 0;
  border-radius: 8px;
  background: rgba(16, 16, 18, 0.72);
  pointer-events: none;
}

.profile-doc-thumb__eye img {
  display: block;
  width: 18px;
  height: 18px;
  object-fit: contain;
}
</style>
