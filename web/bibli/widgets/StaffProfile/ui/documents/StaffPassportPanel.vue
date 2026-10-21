<template>
  <section class="staff-passport-panel">
    <StaffDocPanelEmpty
      v-if="showEmptyState"
      title="Паспорт РФ"
      @add-manual="manualFill = true"
    />

    <template v-else>
    <header class="staff-passport-panel__head">
      <div class="staff-passport-panel__title-row">
        <h2 class="staff-passport-panel__title">Паспорт РФ</h2>
        <StaffDocAcceptedBadge :status="stepStatus" :partial="!isEmptyState" />
      </div>
    </header>

    <div class="staff-passport-panel__images">
      <StaffDocImageCard
        v-for="image in images"
        :key="image.key"
        :url="image.url"
        :label="image.label"
        upload-mode="image"
        :editing="true"
        @replace="onReplaceImage(image.key, $event)"
        @remove="onRemoveImage(image.key)"
        @preview="onPreviewDocument"
      />
    </div>

    <div class="staff-passport-panel__fields">
      <div class="staff-passport-panel__row staff-passport-panel__row--triple">
        <StaffCopyField
          label="Серия и номер"
          :value="draft.passport"
          :editable="true"
          :error="fieldErrors.passport"
          @copy="emit('copy', $event)"
          @update:value="onDraft('passport', $event)"
        />
        <StaffCopyField
          label="Дата выдачи"
          :value="draft.passport_date"
          :editable="true"
          :error="fieldErrors.passport_date"
          @copy="emit('copy', $event)"
          @update:value="onDraft('passport_date', $event)"
        />
        <StaffCopyField
          label="Код подразделения"
          :value="draft.passport_code"
          :editable="true"
          :error="fieldErrors.passport_code"
          @copy="emit('copy', $event)"
          @update:value="onDraft('passport_code', $event)"
        />
      </div>

      <StaffCopyField
        label="Кем выдан"
        :value="draft.passport_issued"
        :editable="true"
        :error="fieldErrors.passport_issued"
        @copy="emit('copy', $event)"
        @update:value="onDraft('passport_issued', $event)"
      />
      <StaffCopyField
        label="Место рождения"
        :value="draft.birthday_place"
        :editable="true"
        address-suggest="city"
        :error="fieldErrors.birthday_place"
        @copy="emit('copy', $event)"
        @update:value="onDraft('birthday_place', $event)"
      />
      <StaffCopyField
        label="Адрес регистрации"
        :value="draft.registration_address"
        :editable="true"
        address-suggest="address"
        :error="fieldErrors.registration_address"
        @copy="emit('copy', $event)"
        @update:value="onDraft('registration_address', $event)"
      />
    </div>

    <footer class="staff-passport-panel__footer">
      <StaffDocMetaLine
        :uploaded-label="uploadedLabel"
        :version="docVersion"
        :reason-label="rejectReasonLabel"
      />
      <div
        v-if="isDirty || showRejectActions || showAcceptActions"
        class="staff-passport-panel__actions"
      >
        <template v-if="isDirty">
          <button type="button" class="staff-passport-panel__cancel" @click="resetDraft">
            Сбросить
          </button>
          <button type="button" class="staff-passport-panel__save" @click="submitEdit">
            Сохранить
          </button>
        </template>
        <template v-else>
          <button
            v-if="showRejectActions"
            type="button"
            class="staff-passport-panel__reject"
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
            class="staff-passport-panel__accept"
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
import type { ActivationStepStatus } from 'bibli/widgets/Profile/rr/lib/activationSteps'
import type { StaffProfilePassportView } from '../../composables/useStaffProfile'
import { formatPassportSeriesNumber, formatStaffRejectReason, formatUploadMeta, resolveStaffDocVersion } from '../../lib/staffProfileFormat'
import { resolveStaffDocPanelEmpty } from '../../lib/staffProfileSectionEmpty'
import {
  resolveStaffDocImageDisplayUrl,
  revokeStaffDocPendingPreviews,
} from '../../lib/staffProfileDocImagesDraft'
import {
  applyStaffFieldMask,
  birthdayFromApi,
  passportCodeDigits,
  passportDigits,
  toApiDate,
  validateStaffDocField,
} from '../../lib/staffProfileFieldValidation'
import type { StaffPassportSavePayload } from '../../lib/staffProfileDocImagesSave'
import StaffCopyField from './StaffCopyField.vue'
import StaffDocMetaLine from './StaffDocMetaLine.vue'
import StaffDocImageCard from './StaffDocImageCard.vue'
import StaffDocPreviewOverlay from './StaffDocPreviewOverlay.vue'
import StaffDocAcceptedBadge from './StaffDocAcceptedBadge.vue'
import StaffDocPanelEmpty from './StaffDocPanelEmpty.vue'
import { useStaffProfileDocPreview } from '../../composables/useStaffProfileDocPreview'

const props = defineProps<{
  passport: StaffProfilePassportView | null
  stepStatus?: ActivationStepStatus | null
  rejectReason?: string | null
  rejectCount?: number
  getFileUrl: (file: string | null | undefined) => string
  showRejectActions?: boolean
  showAcceptActions?: boolean
  serverFieldErrors?: Record<string, string>
}>()

const emit = defineEmits<{
  copy: [value: string]
  accept: []
  reject: []
  save: [payload: StaffPassportSavePayload]
}>()

const hiddenImageKeys = ref<string[]>([])
const pendingReplacements = ref<Record<string, File>>({})
const pendingPreviewByKey = ref<Record<string, string>>({})
const fieldErrors = reactive<Record<string, string>>({})
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
const draft = reactive({
  passport: '—',
  passport_date: '—',
  passport_code: '—',
  passport_issued: '—',
  birthday_place: '—',
  registration_address: '—',
})

function displayOrDash(value: string | null | undefined): string {
  const trimmed = String(value ?? '').trim()
  return trimmed || '—'
}

function buildSnapshot(hiddenKeys: string[], replacementKeys: string[]): string {
  return JSON.stringify({
    passport: draft.passport,
    passport_date: draft.passport_date,
    passport_code: draft.passport_code,
    passport_issued: draft.passport_issued,
    birthday_place: draft.birthday_place,
    registration_address: draft.registration_address,
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

function syncDraft() {
  draft.passport = formatPassportSeriesNumber(props.passport?.passport).display
  draft.passport_date = displayOrDash(
    birthdayFromApi(props.passport?.passport_date) || props.passport?.passport_date,
  )
  draft.passport_code = props.passport?.passport_code
    ? applyStaffFieldMask('passport_code', props.passport.passport_code)
    : '—'
  draft.passport_issued = displayOrDash(props.passport?.passport_issued)
  draft.birthday_place = displayOrDash(props.passport?.birthday_place)
  draft.registration_address = displayOrDash(props.passport?.registration_address)
  clearPendingImageDraft()
  captureBaseline()
}

function clearPendingImageDraft() {
  pendingPreviewByKey.value = revokeStaffDocPendingPreviews(pendingPreviewByKey.value)
  hiddenImageKeys.value = []
  pendingReplacements.value = {}
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

watch(
  () => props.passport,
  () => {
    if (!baseline.value || !isDirty.value) syncDraft()
  },
  { immediate: true },
)

function birthdayCtx() {
  return {
    birthday: birthdayFromApi(props.passport?.birthday) || props.passport?.birthday || '',
  }
}

function onDraft(field: keyof typeof draft, value: string) {
  draft[field] = applyStaffFieldMask(field, value)
  fieldErrors[field] = validateStaffDocField(field, draft[field], birthdayCtx())
}

function submitEdit() {
  let hasError = false
  for (const key of Object.keys(draft) as Array<keyof typeof draft>) {
    const error = validateStaffDocField(key, draft[key], birthdayCtx())
    fieldErrors[key] = error
    if (error) hasError = true
  }
  if (hasError) return

  emit('save', {
    fields: {
      passport: passportDigits(draft.passport),
      passport_date: toApiDate(draft.passport_date),
      passport_code: passportCodeDigits(draft.passport_code),
      passport_issued: draft.passport_issued === '—' ? '' : draft.passport_issued.trim(),
      birthday_place: draft.birthday_place === '—' ? '' : draft.birthday_place.trim(),
      registration_address: draft.registration_address === '—' ? '' : draft.registration_address.trim(),
    },
    removedImageKeys: [...hiddenImageKeys.value],
    replacedImages: { ...pendingReplacements.value },
  })
  clearPendingImageDraft()
  captureBaseline()
}

const images = computed(() => {
  const items = [
    { key: 'passport', label: 'Паспорт', file: props.passport?.file_passport },
    {
      key: 'registration',
      label: 'Прописка',
      file: props.passport?.file_passport_registration,
    },
  ]

  // Всегда показываем оба слота: после удаления — пустой блок «Загрузить».
  return items.map((item) => ({
    ...item,
    url: resolveStaffDocImageDisplayUrl({
      key: item.key,
      serverUrl: props.getFileUrl(item.file),
      hiddenKeys: hiddenImageKeys.value,
      pendingPreviewByKey: pendingPreviewByKey.value,
    }),
  }))
})

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
  images.value
    .filter((image) => Boolean(image.url))
    .map((image) => ({ url: image.url, label: image.label })),
)

const activePreview = computed(() => preview.items[preview.index] ?? null)

function onPreviewDocument(url: string) {
  openGallery(galleryItems.value, url)
}

const uploadedLabel = computed(() =>
  formatUploadMeta(props.passport?.updated_at || props.passport?.created_at),
)

const docVersion = computed(() =>
  resolveStaffDocVersion({
    stepStatus: props.stepStatus,
    rejectCount: props.rejectCount,
  }),
)

const rejectReasonLabel = computed(() => formatStaffRejectReason(props.rejectReason))

const manualFill = ref(false)

const isEmptyState = computed(() =>
  resolveStaffDocPanelEmpty({
    stepStatus: props.stepStatus,
    rows: [
      { value: draft.passport },
      { value: draft.passport_date },
      { value: draft.passport_code },
      { value: draft.passport_issued },
      { value: draft.birthday_place },
      { value: draft.registration_address },
    ],
    imageUrls: [
      props.getFileUrl(props.passport?.file_passport),
      props.getFileUrl(props.passport?.file_passport_registration),
    ],
  }),
)

const showEmptyState = computed(() => isEmptyState.value && !manualFill.value)
</script>

<style scoped>
.staff-passport-panel {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
  min-width: 0;
}

.staff-passport-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 36px;
}

.staff-passport-panel__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.staff-passport-panel__title {
  margin: 0;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 600;
  font-size: var(--rr-font-size-font-size-l, 20px);
  line-height: var(--rr-line-height-line-height-l, 24px);
  letter-spacing: var(--rr-tracking-tracking-l, -0.3px);
  vertical-align: middle;
  color: var(--rr-labels-neutral-primary, #101012);
}

.staff-passport-panel__images {
  display: flex;
  flex-wrap: wrap;
  gap: var(--rr-spacing-padding-l, 12px);
}

.staff-passport-panel__fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.staff-passport-panel__row {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.staff-passport-panel__row--triple {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.staff-passport-panel__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 4px;
  margin-top: auto;
  min-width: 0;
}

.staff-passport-panel__footer :deep(.staff-doc-meta) {
  flex: 1 1 auto;
  min-width: 0;
}

.staff-passport-panel__actions {
  display: flex;
  gap: 4px;
  margin-left: auto;
  flex: 0 0 auto;
}

.staff-passport-panel__cancel,
.staff-passport-panel__save,
.staff-passport-panel__reject,
.staff-passport-panel__accept {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
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

.staff-passport-panel__reject {
  min-width: 145px;
  padding: var(--rr-spacing-padding-l, 12px) var(--rr-spacing-padding-xl, 16px);
  border: 1px solid var(--rr-button-neutral-quaternary-border-default, rgba(120, 120, 128, 0.36));
  background: transparent;
  color: var(--rr-button-neutral-quaternary-text-default, #101012);
}

.staff-passport-panel__accept {
  min-width: 123px;
  padding: var(--rr-spacing-padding-l, 12px) var(--rr-spacing-padding-xl, 16px);
  border: none;
  background: var(--rr-labels-neutral-primary, #101012);
  color: var(--rr-button-brand-primary-text-default, #fff);
}

.staff-passport-panel__cancel {
  min-width: 110px;
  padding: var(--rr-spacing-padding-l, 12px) var(--rr-spacing-padding-xl, 16px);
  border: 1px solid var(--rr-button-neutral-quaternary-border-default, rgba(120, 120, 128, 0.36));
  background: transparent;
  color: var(--rr-button-neutral-quaternary-text-default, #101012);
}

.staff-passport-panel__save {
  width: 118px;
  padding: var(--rr-spacing-padding-l, 12px) var(--rr-spacing-padding-xl, 16px);
  border: none;
  background: var(--rr-button-brand-primary-background-default, #5b7dec);
  color: var(--rr-button-brand-primary-text-default, #fff);
}

@media (max-width: 900px) {
  .staff-passport-panel__row--triple {
    grid-template-columns: 1fr;
  }

  .staff-passport-panel__footer {
    flex-direction: column;
    align-items: stretch;
  }

  .staff-passport-panel__actions {
    margin-left: 0;
    justify-content: flex-end;
  }
}
</style>
