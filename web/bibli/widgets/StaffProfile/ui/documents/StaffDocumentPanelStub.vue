<template>
  <section class="staff-doc-panel-stub">
    <template v-if="showEmptyState">
      <StaffDocPanelEmpty :title="title" @add-manual="manualFill = true" />
    </template>

    <template v-else>
      <header class="staff-doc-panel-stub__head">
        <div class="staff-doc-panel-stub__title-row">
          <h2 class="staff-doc-panel-stub__title">{{ title }}</h2>
          <StaffDocAcceptedBadge :status="stepStatus" :partial="!isEmptyState" />
        </div>
      </header>

      <div v-if="visibleImages.length" class="staff-doc-panel-stub__images">
        <StaffDocImageCard
          v-for="image in visibleImages"
          :key="image.key"
          :url="image.url"
          :label="image.label"
          :upload-mode="uploadMode"
          :editing="true"
          @replace="onReplaceImage(image.key, $event)"
          @remove="onRemoveImage(image.key)"
          @preview="onPreviewDocument"
        />
      </div>

      <div class="staff-doc-panel-stub__fields" :class="fieldsClass">
        <StaffCopyField
          v-for="row in visibleRows"
          :key="row.field"
          :label="row.label"
          :value="draft[row.field] ?? row.value"
          :editable="true"
          :error="fieldErrors[row.field]"
          @copy="emit('copy', $event)"
          @update:value="onDraft(row.field, $event)"
        />
      </div>

      <footer class="staff-doc-panel-stub__footer">
        <StaffDocMetaLine
          :uploaded-label="uploadedLabel"
          :version="version"
          :reason-label="reasonLabel"
        />
        <div
          v-if="isDirty || showRejectActions || showAcceptActions"
          class="staff-doc-panel-stub__actions"
        >
          <template v-if="isDirty">
            <button type="button" class="staff-doc-panel-stub__cancel" @click="resetDraft">
              Сбросить
            </button>
            <button type="button" class="staff-doc-panel-stub__save" @click="submitEdit">
              Сохранить
            </button>
          </template>
          <template v-else>
            <button
              v-if="showRejectActions"
              type="button"
              class="staff-doc-panel-stub__reject"
              @click="emit('reject')"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M4 4l8 8M12 4L4 12"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
              Отклонить
            </button>
            <button
              v-if="showAcceptActions"
              type="button"
              class="staff-doc-panel-stub__accept"
              @click="emit('accept')"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M3.5 8.2L6.4 11.1L12.5 4.9"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              Принять
            </button>
          </template>
        </div>
      </footer>
    </template>

    <StaffDocPreviewOverlay
      :open="preview.open"
      :url="activePreview?.url ?? ''"
      :title="activePreview?.label"
      :index="preview.index"
      :total="preview.items.length"
      @close="closePreview"
      @prev="showPrev"
      @next="showNext"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { resolveStaffDocPanelEmpty } from '../../lib/staffProfileSectionEmpty'
import {
  resolveStaffDocImageDisplayUrl,
  revokeStaffDocPendingPreviews,
} from '../../lib/staffProfileDocImagesDraft'
import {
  applyStaffFieldMask,
  birthdayFromApi,
  toApiDate,
  validateStaffDocField,
} from '../../lib/staffProfileFieldValidation'
import type { StaffFieldsSavePayload } from '../../lib/staffProfileDocImagesSave'
import StaffCopyField from './StaffCopyField.vue'
import StaffDocMetaLine from './StaffDocMetaLine.vue'
import StaffDocImageCard from './StaffDocImageCard.vue'
import StaffDocPreviewOverlay from './StaffDocPreviewOverlay.vue'
import StaffDocAcceptedBadge from './StaffDocAcceptedBadge.vue'
import StaffDocPanelEmpty from './StaffDocPanelEmpty.vue'
import { useStaffProfileDocPreview } from '../../composables/useStaffProfileDocPreview'

export interface StaffDocRow {
  field: string
  label: string
  value: string
}

const props = withDefaults(
  defineProps<{
    title: string
    description?: string
    rows?: StaffDocRow[]
    images?: Array<{ url: string; label: string; key: string }>
    uploadedLabel?: string
    version?: number
    reasonLabel?: string
    columns?: 1 | 2 | 3
    showRejectActions?: boolean
    showAcceptActions?: boolean
    stepStatus?: string | null
    uploadMode?: 'image' | 'image-or-pdf'
    serverFieldErrors?: Record<string, string>
  }>(),
  {
    description: '',
    rows: () => [],
    images: () => [],
    uploadedLabel: '',
    version: 1,
    reasonLabel: '',
    columns: 1,
    showRejectActions: false,
    showAcceptActions: false,
    stepStatus: null,
    uploadMode: 'image-or-pdf',
    serverFieldErrors: () => ({}),
  },
)

const emit = defineEmits<{
  copy: [value: string]
  accept: []
  reject: []
  save: [payload: StaffFieldsSavePayload]
}>()

const hiddenImageKeys = ref<string[]>([])
const pendingReplacements = ref<Record<string, File>>({})
const pendingPreviewByKey = ref<Record<string, string>>({})
const fieldErrors = reactive<Record<string, string>>({})
const draft = reactive<Record<string, string>>({})
const baseline = ref('')
const { preview, openGallery, closePreview, showPrev, showNext } = useStaffProfileDocPreview()

watch(
  () => props.serverFieldErrors,
  (errors) => {
    if (!errors) return
    for (const [key, message] of Object.entries(errors)) {
      if (message) fieldErrors[key] = message
    }
  },
  { deep: true, immediate: true },
)

const visibleRows = computed(() => props.rows ?? [])

function buildSnapshot(hiddenKeys: string[], replacementKeys: string[]): string {
  const fields: Record<string, string> = {}
  for (const row of visibleRows.value) {
    fields[row.field] = draft[row.field] ?? ''
  }
  return JSON.stringify({
    fields,
    hiddenImageKeys: [...hiddenKeys].sort(),
    replacementKeys: [...replacementKeys].sort(),
  })
}

function captureBaseline() {
  baseline.value = buildSnapshot([], [])
}

const isDirty = computed(
  () =>
    buildSnapshot(hiddenImageKeys.value, Object.keys(pendingReplacements.value)) !== baseline.value,
)

function clearPendingImageDraft() {
  pendingPreviewByKey.value = revokeStaffDocPendingPreviews(pendingPreviewByKey.value)
  hiddenImageKeys.value = []
  pendingReplacements.value = {}
}

function syncDraft() {
  for (const key of Object.keys(draft)) {
    delete draft[key]
  }
  for (const row of visibleRows.value) {
    const value = row.value
    if (row.field === 'birthday') {
      draft[row.field] = birthdayFromApi(value) || (value === '—' ? '' : value)
    } else {
      const source = value === '—' ? '' : value
      draft[row.field] = applyStaffFieldMask(row.field, source)
    }
  }
  clearPendingImageDraft()
  captureBaseline()
}

function clearFieldErrors() {
  for (const key of Object.keys(fieldErrors)) {
    delete fieldErrors[key]
  }
}

function resetDraft() {
  clearFieldErrors()
  syncDraft()
}

onBeforeUnmount(() => {
  pendingPreviewByKey.value = revokeStaffDocPendingPreviews(pendingPreviewByKey.value)
})

function isIePanel() {
  return visibleRows.value.some(
    (row) =>
      row.field === 'payment_account' ||
      row.field === 'correspondent_account' ||
      row.field === 'ogrnip' ||
      row.field === 'bank_inn',
  )
}

function validationCtx() {
  return {
    bankBik: draft.bank_bik || '',
    bankAccount: draft.bank_account || '',
    paymentAccount: draft.payment_account || '',
    correspondentAccount: draft.correspondent_account || '',
    ieMode: isIePanel(),
  }
}

function validateField(field: string) {
  fieldErrors[field] = validateStaffDocField(field, draft[field] ?? '', validationCtx())
}

function revalidateBankRelated(field: string) {
  validateField(field)
  if (field === 'bank_bik') {
    if ('bank_account' in draft) validateField('bank_account')
    if ('payment_account' in draft) validateField('payment_account')
    if ('correspondent_account' in draft) validateField('correspondent_account')
  }
  if (field === 'bank_account' || field === 'payment_account' || field === 'correspondent_account') {
    if ('bank_bik' in draft) validateField('bank_bik')
  }
}

function onDraft(field: string, value: string) {
  draft[field] = applyStaffFieldMask(field, value)
  revalidateBankRelated(field)
}

watch(
  visibleRows,
  () => {
    if (!baseline.value || !isDirty.value) syncDraft()
  },
  { immediate: true, deep: true },
)

function submitEdit() {
  let hasError = false
  for (const row of visibleRows.value) {
    const error = validateStaffDocField(row.field, draft[row.field] ?? '', validationCtx())
    fieldErrors[row.field] = error
    if (error) hasError = true
  }
  if (hasError) return

  const payload: Record<string, string> = {}
  for (const row of visibleRows.value) {
    const value = draft[row.field] ?? ''
    const trimmed = value === '—' ? '' : value.trim()
    payload[row.field] = row.field === 'birthday' ? toApiDate(trimmed) : trimmed
  }
  emit('save', {
    fields: payload,
    removedImageKeys: [...hiddenImageKeys.value],
    replacedImages: { ...pendingReplacements.value },
  })
  clearPendingImageDraft()
  captureBaseline()
}

const visibleImages = computed(() =>
  (props.images ?? []).map((image) => ({
    ...image,
    url: resolveStaffDocImageDisplayUrl({
      key: image.key,
      serverUrl: image.url,
      hiddenKeys: hiddenImageKeys.value,
      pendingPreviewByKey: pendingPreviewByKey.value,
    }),
  })),
)

function onReplaceImage(key: string, file: File) {
  pendingPreviewByKey.value = revokeStaffDocPendingPreviews(pendingPreviewByKey.value, [key])
  hiddenImageKeys.value = hiddenImageKeys.value.filter((k) => k !== key)
  pendingReplacements.value = { ...pendingReplacements.value, [key]: file }
  pendingPreviewByKey.value = {
    ...pendingPreviewByKey.value,
    [key]: URL.createObjectURL(file),
  }
}

function onRemoveImage(key: string) {
  pendingPreviewByKey.value = revokeStaffDocPendingPreviews(pendingPreviewByKey.value, [key])
  if (pendingReplacements.value[key]) {
    const next = { ...pendingReplacements.value }
    delete next[key]
    pendingReplacements.value = next
  }
  if (!hiddenImageKeys.value.includes(key)) {
    hiddenImageKeys.value = [...hiddenImageKeys.value, key]
  }
}

const galleryItems = computed(() =>
  visibleImages.value
    .filter((image) => Boolean(image.url))
    .map((image) => ({ url: image.url, label: image.label })),
)

const activePreview = computed(() => preview.items[preview.index] ?? null)

function onPreviewDocument(url: string) {
  openGallery(galleryItems.value, url)
}

const manualFill = ref(false)

const isEmptyState = computed(() =>
  resolveStaffDocPanelEmpty({
    stepStatus: props.stepStatus,
    rows: props.rows ?? [],
    images: props.images ?? [],
  }),
)

const showEmptyState = computed(() => isEmptyState.value && !manualFill.value)

const fieldsClass = computed(() => {
  if (props.columns === 3) return 'staff-doc-panel-stub__fields--triple'
  if (props.columns === 2) return 'staff-doc-panel-stub__fields--double'
  return ''
})
</script>

<style scoped>
.staff-doc-panel-stub {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 18px;
  min-height: 100%;
  min-width: 0;
}

.staff-doc-panel-stub__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 36px;
}

.staff-doc-panel-stub__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.staff-doc-panel-stub__title {
  margin: 0;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 600;
  font-size: var(--rr-font-size-font-size-l, 20px);
  line-height: var(--rr-line-height-line-height-l, 24px);
  letter-spacing: var(--rr-tracking-tracking-l, -0.3px);
  vertical-align: middle;
  color: var(--rr-labels-neutral-primary, #101012);
}

.staff-doc-panel-stub__images {
  display: flex;
  flex-wrap: wrap;
  gap: var(--rr-spacing-padding-l, 12px);
}

.staff-doc-panel-stub__fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.staff-doc-panel-stub__fields--double,
.staff-doc-panel-stub__fields--triple {
  display: grid;
  gap: 12px;
}

.staff-doc-panel-stub__fields--double {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.staff-doc-panel-stub__fields--triple {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.staff-doc-panel-stub__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 4px;
  margin-top: auto;
  min-width: 0;
}

.staff-doc-panel-stub__footer :deep(.staff-doc-meta) {
  flex: 1 1 auto;
  min-width: 0;
}

.staff-doc-panel-stub__actions {
  display: flex;
  gap: 4px;
  margin-left: auto;
  flex: 0 0 auto;
}

.staff-doc-panel-stub__cancel,
.staff-doc-panel-stub__save,
.staff-doc-panel-stub__reject,
.staff-doc-panel-stub__accept {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 48px;
  border-radius: var(--rr-radius-m, 8px);
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 600;
  font-size: var(--rr-font-size-font-size-m, 16px);
  line-height: var(--rr-line-height-line-height-m, 24px);
  letter-spacing: var(--rr-tracking-tracking-m, 0px);
  text-align: center;
  cursor: pointer;
}

.staff-doc-panel-stub__reject {
  width: 145px;
  padding: var(--rr-spacing-padding-l, 12px) var(--rr-spacing-padding-xl, 16px);
  border: 1px solid var(--rr-button-neutral-quaternary-border-default, rgba(120, 120, 128, 0.36));
  background: transparent;
  color: var(--rr-button-neutral-quaternary-text-default, #101012);
}

.staff-doc-panel-stub__accept {
  min-width: 123px;
  padding: var(--rr-spacing-padding-l, 12px) var(--rr-spacing-padding-xl, 16px);
  border: none;
  background: var(--rr-labels-neutral-primary, #101012);
  color: var(--rr-button-brand-primary-text-default, #fff);
}

.staff-doc-panel-stub__cancel {
  min-width: 110px;
  padding: var(--rr-spacing-padding-l, 12px) var(--rr-spacing-padding-xl, 16px);
  border: 1px solid var(--rr-button-neutral-quaternary-border-default, rgba(120, 120, 128, 0.36));
  background: transparent;
  color: var(--rr-button-neutral-quaternary-text-default, #101012);
}

.staff-doc-panel-stub__save {
  width: 118px;
  padding: var(--rr-spacing-padding-l, 12px) var(--rr-spacing-padding-xl, 16px);
  border: none;
  background: var(--rr-button-brand-primary-background-default, #5b7dec);
  color: var(--rr-button-brand-primary-text-default, #fff);
}

@media (max-width: 900px) {
  .staff-doc-panel-stub__fields--double,
  .staff-doc-panel-stub__fields--triple {
    grid-template-columns: 1fr;
  }

  .staff-doc-panel-stub__footer {
    flex-direction: column;
    align-items: stretch;
  }

  .staff-doc-panel-stub__actions {
    margin-left: 0;
    justify-content: flex-end;
  }
}
</style>
