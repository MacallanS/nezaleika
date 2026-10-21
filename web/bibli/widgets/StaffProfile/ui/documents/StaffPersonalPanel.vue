<template>
  <section class="staff-personal-panel">
    <StaffDocPanelEmpty
      v-if="showEmptyState"
      title="Личные данные"
      @add-manual="manualFill = true"
    />

    <template v-else>
    <header class="staff-personal-panel__head">
      <div class="staff-personal-panel__title-row">
        <h2 class="staff-personal-panel__title">Личные данные</h2>
        <StaffDocAcceptedBadge :status="stepStatus" :partial="!isEmptyState" />
      </div>
    </header>

    <div class="staff-personal-panel__body">
      <div class="staff-personal-panel__hero">
        <StaffDocImageCard
          class="staff-personal-panel__photo"
          :url="displayPhotoUrl"
          label="Фото"
          :size="180"
          upload-mode="image"
          :editing="true"
          @replace="onReplacePhoto"
          @remove="onRemovePhoto"
          @preview="onPreviewDocument"
        />

        <div class="staff-personal-panel__fio">
          <span class="staff-personal-panel__group-label">ФИО</span>
          <div class="staff-personal-panel__fio-stack">
            <StaffCopyField
              label="Фамилия"
              :show-label="false"
              :value="draft.surname"
              :editable="true"
              :error="fieldErrors.surname"
              @copy="emit('copy', $event)"
              @update:value="onDraft('surname', $event)"
            />
            <StaffCopyField
              label="Имя"
              :show-label="false"
              :value="draft.name"
              :editable="true"
              :error="fieldErrors.name"
              @copy="emit('copy', $event)"
              @update:value="onDraft('name', $event)"
            />
            <StaffCopyField
              label="Отчество"
              :show-label="false"
              :value="draft.patronymic"
              :editable="true"
              :error="fieldErrors.patronymic"
              @copy="emit('copy', $event)"
              @update:value="onDraft('patronymic', $event)"
            />
          </div>
        </div>
      </div>

      <div class="staff-personal-panel__row staff-personal-panel__row--gender">
        <div class="staff-personal-panel__gender-wrap">
          <ProfileRrGender
            :model-value="draft.gender"
            @update:model-value="onDraft('gender', $event)"
          />
          <p v-if="fieldErrors.gender" class="staff-personal-panel__gender-error">
            {{ fieldErrors.gender }}
          </p>
        </div>
        <StaffCopyField
          label="Дата рождения"
          :value="draft.birthday"
          :editable="true"
          :error="fieldErrors.birthday"
          @copy="emit('copy', $event)"
          @update:value="onDraft('birthday', $event)"
        />
      </div>

      <div class="staff-personal-panel__row">
        <StaffCopyField
          label="Номер телефона"
          :value="draft.phone"
          :editable="true"
          :error="fieldErrors.phone"
          @copy="emit('copy', $event)"
          @update:value="onDraft('phone', $event)"
        />
        <StaffCopyField
          label="Почта"
          :value="draft.email"
          :editable="true"
          :error="fieldErrors.email"
          @copy="emit('copy', $event)"
          @update:value="onDraft('email', $event)"
        />
      </div>

      <StaffCopyField
        label="Ник в тг (через @)"
        :value="draft.telegram_username"
        :editable="true"
        :error="fieldErrors.telegram_username"
        @copy="emit('copy', $event)"
        @update:value="onDraft('telegram_username', $event)"
      />
    </div>

    <footer class="staff-personal-panel__footer">
      <StaffDocMetaLine
        :uploaded-label="uploadedLabel"
        :version="docVersion"
        :reason-label="rejectReasonLabel"
      />
      <div
        v-if="isDirty || showRejectActions || showAcceptActions"
        class="staff-personal-panel__actions"
      >
        <template v-if="isDirty">
          <button type="button" class="staff-personal-panel__cancel" @click="resetDraft">
            Сбросить
          </button>
          <button type="button" class="staff-personal-panel__save" @click="submitEdit">
            Сохранить
          </button>
        </template>
        <template v-else>
          <button
            v-if="showRejectActions"
            type="button"
            class="staff-personal-panel__reject"
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
            class="staff-personal-panel__accept"
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
import { ProfileRrGender } from 'bibli/widgets/Profile/rr'
import type { StaffProfilePassportView } from '../../composables/useStaffProfile'
import {
  formatStaffContactPhone,
  formatStaffRejectReason,
  formatTelegramHandle,
  formatUploadMeta,
  resolveStaffDocVersion,
} from '../../lib/staffProfileFormat'
import { resolveStaffDocPanelEmpty } from '../../lib/staffProfileSectionEmpty'
import {
  applyStaffFieldMask,
  birthdayFromApi,
  toApiDate,
  validateStaffDocField,
} from '../../lib/staffProfileFieldValidation'
import type { StaffPersonalSavePayload } from '../../lib/staffProfilePersonalSave'
import { useStaffProfileDocPreview } from '../../composables/useStaffProfileDocPreview'
import StaffCopyField from './StaffCopyField.vue'
import StaffDocImageCard from './StaffDocImageCard.vue'
import StaffDocMetaLine from './StaffDocMetaLine.vue'
import StaffDocPreviewOverlay from './StaffDocPreviewOverlay.vue'
import StaffDocAcceptedBadge from './StaffDocAcceptedBadge.vue'
import StaffDocPanelEmpty from './StaffDocPanelEmpty.vue'

type PersonalGender = 'm' | 'f' | null

const props = defineProps<{
  registration: Record<string, unknown> | null
  passport: StaffProfilePassportView | null
  phone: string | null
  email: string | null
  telegram_username: string | null
  gender?: PersonalGender
  getFileUrl: (file: string | null | undefined) => string
  stepStatus?: ActivationStepStatus | null
  rejectReason?: string | null
  rejectCount?: number
  showRejectActions?: boolean
  showAcceptActions?: boolean
  serverFieldErrors?: Record<string, string>
}>()

const emit = defineEmits<{
  copy: [value: string]
  accept: []
  reject: []
  save: [payload: StaffPersonalSavePayload]
}>()

const fieldErrors = reactive<Record<string, string>>({})
const pendingPhotoFile = ref<File | null>(null)
const photoRemoved = ref(false)
const localPhotoObjectUrl = ref('')
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
  name: '—',
  surname: '—',
  patronymic: '—',
  birthday: '—',
  phone: '—',
  email: '—',
  telegram_username: '—',
  gender: null as PersonalGender,
})

function displayOrDash(value: string | null | undefined): string {
  const trimmed = String(value ?? '').trim()
  return trimmed || '—'
}

function resolveGender(): PersonalGender {
  const fromProps = props.gender
  if (fromProps === 'm' || fromProps === 'f') return fromProps
  const reg = props.registration ?? {}
  const raw = reg.gender
  if (raw === 'm' || raw === 'f') return raw
  return null
}

function buildSnapshot(photoPending: boolean, removed: boolean): string {
  return JSON.stringify({
    name: draft.name,
    surname: draft.surname,
    patronymic: draft.patronymic,
    birthday: draft.birthday,
    phone: draft.phone,
    email: draft.email,
    telegram_username: draft.telegram_username,
    gender: draft.gender,
    photoPending,
    photoRemoved: removed,
  })
}

function captureBaseline() {
  baseline.value = buildSnapshot(false, false)
}

const isDirty = computed(
  () => buildSnapshot(Boolean(pendingPhotoFile.value), photoRemoved.value) !== baseline.value,
)

function syncDraft() {
  const reg = props.registration ?? {}
  draft.name = displayOrDash(reg.name as string | undefined)
  draft.surname = displayOrDash(reg.surname as string | undefined)
  draft.patronymic = displayOrDash(reg.patronymic as string | undefined)
  draft.birthday = displayOrDash(
    birthdayFromApi(props.passport?.birthday) || props.passport?.birthday,
  )
  draft.phone = formatStaffContactPhone(props.phone)
  draft.email = displayOrDash(props.email)
  draft.telegram_username = formatTelegramHandle(props.telegram_username)
  draft.gender = resolveGender()
  resetPhotoDraft()
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

watch(
  () => [props.registration, props.passport, props.phone, props.email, props.telegram_username, props.gender],
  () => {
    if (!baseline.value || !isDirty.value) syncDraft()
  },
  { immediate: true, deep: true },
)

function onDraft(field: keyof typeof draft, value: string) {
  if (field === 'gender') {
    draft.gender = value === 'm' || value === 'f' ? value : null
    fieldErrors.gender = ''
    return
  }
  draft[field] = applyStaffFieldMask(field, value)
  fieldErrors[field] = validateStaffDocField(field, draft[field])
}

function revokeLocalPhotoUrl() {
  if (localPhotoObjectUrl.value) {
    URL.revokeObjectURL(localPhotoObjectUrl.value)
    localPhotoObjectUrl.value = ''
  }
}

function resetPhotoDraft() {
  revokeLocalPhotoUrl()
  pendingPhotoFile.value = null
  photoRemoved.value = false
}

function submitEdit() {
  let hasError = false
  const fields = ['name', 'surname', 'patronymic', 'birthday', 'phone', 'email', 'telegram_username'] as const

  for (const key of fields) {
    if (key === 'patronymic' && (!draft.patronymic || draft.patronymic === '—')) {
      fieldErrors[key] = ''
      continue
    }
    const error = validateStaffDocField(key, draft[key])
    fieldErrors[key] = error
    if (error) hasError = true
  }
  if (draft.gender !== 'm' && draft.gender !== 'f') {
    fieldErrors.gender = 'Укажите пол'
    hasError = true
  } else {
    fieldErrors.gender = ''
  }
  if (hasError) return

  emit('save', {
    fields: {
      name: draft.name === '—' ? '' : draft.name.trim(),
      surname: draft.surname === '—' ? '' : draft.surname.trim(),
      patronymic: draft.patronymic === '—' ? '' : draft.patronymic.trim(),
      birthday: toApiDate(draft.birthday),
      phone: draft.phone === '—' ? '' : draft.phone.trim(),
      email: draft.email === '—' ? '' : draft.email.trim(),
      telegram_username: draft.telegram_username === '—' ? '' : draft.telegram_username.trim(),
      gender: draft.gender,
    },
    photoFile: pendingPhotoFile.value,
    photoRemoved: photoRemoved.value,
  })
  resetPhotoDraft()
  captureBaseline()
}

const serverPhotoUrl = computed(() =>
  props.getFileUrl(props.passport?.file_agent_with_passport),
)

const displayPhotoUrl = computed(() => {
  if (photoRemoved.value) return ''
  if (localPhotoObjectUrl.value) return localPhotoObjectUrl.value
  return serverPhotoUrl.value
})

function onReplacePhoto(file: File) {
  revokeLocalPhotoUrl()
  pendingPhotoFile.value = file
  photoRemoved.value = false
  localPhotoObjectUrl.value = URL.createObjectURL(file)
}

function onRemovePhoto() {
  revokeLocalPhotoUrl()
  pendingPhotoFile.value = null
  photoRemoved.value = true
}

watch(
  () => [props.passport?.file_agent_with_passport, props.stepStatus] as const,
  () => {
    if (!isDirty.value) resetPhotoDraft()
  },
)

onBeforeUnmount(() => {
  revokeLocalPhotoUrl()
})

const galleryItems = computed(() =>
  displayPhotoUrl.value ? [{ url: displayPhotoUrl.value, label: 'Фото' }] : [],
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
      { value: draft.name },
      { value: draft.surname },
      { value: draft.patronymic },
      { value: draft.birthday },
      { value: draft.phone },
      { value: draft.email },
      { value: draft.telegram_username },
    ],
    imageUrls: [serverPhotoUrl.value],
    extraValues: [draft.gender],
  }),
)

const showEmptyState = computed(() => isEmptyState.value && !manualFill.value)
</script>

<style scoped>
.staff-personal-panel {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
  min-width: 0;
}

.staff-personal-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 36px;
}

.staff-personal-panel__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.staff-personal-panel__title {
  margin: 0;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 600;
  font-size: var(--rr-font-size-font-size-l, 20px);
  line-height: var(--rr-line-height-line-height-l, 24px);
  letter-spacing: var(--rr-tracking-tracking-l, -0.3px);
  color: var(--rr-labels-neutral-primary, #101012);
}

.staff-personal-panel__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  container-type: inline-size;
}

.staff-personal-panel__hero {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

.staff-personal-panel__photo {
  flex: 0 0 auto;
}

.staff-personal-panel__fio {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.staff-personal-panel__group-label {
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-size: var(--rr-font-size-font-size-xs, 12px);
  line-height: var(--rr-line-height-line-height-xs, 16px);
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
}

.staff-personal-panel__fio-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.staff-personal-panel__row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  min-width: 0;
}

.staff-personal-panel__row--gender :deep(.profile-rr-gender) {
  width: 100%;
  min-width: 0;
}

.staff-personal-panel__gender-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.staff-personal-panel__gender-error {
  margin: 0;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-size: var(--rr-font-size-font-size-xs, 12px);
  line-height: var(--rr-line-height-line-height-xs, 16px);
  color: var(--rr-labels-negative, #d70015);
}

.staff-personal-panel__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 4px;
  margin-top: auto;
  min-width: 0;
}

.staff-personal-panel__footer :deep(.staff-doc-meta) {
  flex: 1 1 auto;
  min-width: 0;
}

.staff-personal-panel__actions {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.staff-personal-panel__cancel,
.staff-personal-panel__save,
.staff-personal-panel__reject,
.staff-personal-panel__accept {
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
  cursor: pointer;
}

.staff-personal-panel__reject {
  min-width: 145px;
  padding: var(--rr-spacing-padding-l, 12px) var(--rr-spacing-padding-xl, 16px);
  border: 1px solid var(--rr-button-neutral-quaternary-border-default, rgba(120, 120, 128, 0.36));
  background: transparent;
  color: var(--rr-button-neutral-quaternary-text-default, #101012);
}

.staff-personal-panel__accept {
  min-width: 123px;
  padding: var(--rr-spacing-padding-l, 12px) var(--rr-spacing-padding-xl, 16px);
  border: none;
  background: var(--rr-labels-neutral-primary, #101012);
  color: var(--rr-button-brand-primary-text-default, #fff);
}

.staff-personal-panel__cancel {
  min-width: 110px;
  padding: var(--rr-spacing-padding-l, 12px) var(--rr-spacing-padding-xl, 16px);
  border: 1px solid var(--rr-button-neutral-quaternary-border-default, rgba(120, 120, 128, 0.36));
  background: transparent;
  color: var(--rr-button-neutral-quaternary-text-default, #101012);
}

.staff-personal-panel__save {
  width: 118px;
  padding: var(--rr-spacing-padding-l, 12px) var(--rr-spacing-padding-xl, 16px);
  border: none;
  background: var(--rr-button-brand-primary-background-default, #5b7dec);
  color: var(--rr-button-brand-primary-text-default, #fff);
}

/* Stack photo / FIO only when the panel itself is narrow (not at 900px viewport). */
@container (max-width: 420px) {
  .staff-personal-panel__hero {
    flex-direction: column;
  }
}

@container (max-width: 520px) {
  .staff-personal-panel__row,
  .staff-personal-panel__row--gender {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .staff-personal-panel__footer {
    flex-direction: column;
    align-items: stretch;
  }

  .staff-personal-panel__actions {
    margin-left: 0;
    justify-content: flex-end;
  }
}
</style>
