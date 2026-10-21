<template>
  <div class="staff-profile-documents">
    <StaffDocumentSidebar
      :active-doc="activeDoc"
      :steps-map="profile.activationSteps"
      :partial-step-ids="partialStepIds"
      @select="emit('select-doc', $event)"
    />

    <div
      v-if="readOnlyBlur"
      class="staff-profile-documents__panel staff-profile-documents__panel--blurred"
    >
      <div class="staff-profile-documents__blur-card" aria-hidden="true">
        <div class="staff-profile-documents__blur-lines">
          <span /><span /><span /><span />
        </div>
      </div>
      <p class="staff-profile-documents__blur-hint">
        Содержимое документов скрыто. Доступны только статусы этапов в меню слева.
      </p>
    </div>

    <div
      v-else
      class="staff-profile-documents__panel"
      :aria-busy="actionsBusy ? 'true' : undefined"
    >
      <div
        v-if="actionsBusy"
        class="staff-profile-documents__busy"
        role="status"
        aria-live="polite"
      >
        <span class="staff-profile-documents__busy-spinner" aria-hidden="true" />
        Сохранение…
      </div>
      <StaffPassportPanel
        v-if="activeDoc === 'passport'"
        :passport="profile.passport"
        :step-status="profile.activationSteps.passport"
        :reject-reason="stepRejection('passport')?.reason"
        :reject-count="stepRejection('passport')?.count"
        :get-file-url="getFileUrl"
        :show-reject-actions="canReject('passport')"
        :show-accept-actions="canAccept('passport')"
        :server-field-errors="serverFieldErrors"
        @copy="emit('copy', $event)"
        @accept="emit('accept-step', 'passport')"
        @reject="emit('reject-step', 'passport')"
        @save="emit('save-passport', $event)"
      />

      <StaffPersonalPanel
        v-else-if="activeDoc === 'personal'"
        :registration="registration"
        :passport="profile.passport"
        :phone="profile.phone"
        :email="profile.email"
        :telegram_username="profile.telegram_username"
        :gender="personalGender"
        :get-file-url="getFileUrl"
        :step-status="profile.activationSteps.personal"
        :reject-reason="stepRejection('personal')?.reason"
        :reject-count="stepRejection('personal')?.count"
        :show-reject-actions="canReject('personal')"
        :show-accept-actions="canAccept('personal')"
        :server-field-errors="serverFieldErrors"
        @copy="emit('copy', $event)"
        @accept="emit('accept-step', 'personal')"
        @reject="emit('reject-step', 'personal')"
        @save="emit('save-personal', $event)"
      />

      <StaffDocumentPanelStub
        v-else-if="activeDoc === 'inn'"
        title="ИНН"
        :rows="innRows"
        :images="innImages"
        :uploaded-label="uploadedLabel"
        :version="stepVersion(activeDoc)"
        :reason-label="stepReasonLabel(activeDoc)"
        :step-status="profile.activationSteps.inn"
        :show-reject-actions="canReject('inn')"
        :show-accept-actions="canAccept('inn')"
        :server-field-errors="serverFieldErrors"
        @copy="emit('copy', $event)"
        @accept="emit('accept-step', 'inn')"
        @reject="emit('reject-step', 'inn')"
        @save="emit('save-fields', $event)"
      />

      <StaffDocumentPanelStub
        v-else-if="activeDoc === 'snils'"
        title="СНИЛС"
        :rows="snilsRows"
        :images="snilsImages"
        :uploaded-label="uploadedLabel"
        :version="stepVersion(activeDoc)"
        :reason-label="stepReasonLabel(activeDoc)"
        :step-status="profile.activationSteps.snils"
        :show-reject-actions="canReject('snils')"
        :show-accept-actions="canAccept('snils')"
        :server-field-errors="serverFieldErrors"
        @copy="emit('copy', $event)"
        @accept="emit('accept-step', 'snils')"
        @reject="emit('reject-step', 'snils')"
        @save="emit('save-fields', $event)"
      />

      <StaffDocumentPanelStub
        v-else-if="activeDoc === 'bank'"
        title="Банковские реквизиты"
        :rows="bankRows"
        :images="bankImages"
        :uploaded-label="uploadedLabel"
        :version="stepVersion(activeDoc)"
        :reason-label="stepReasonLabel(activeDoc)"
        :columns="1"
        :step-status="profile.activationSteps.bank"
        :show-reject-actions="canReject('bank')"
        :show-accept-actions="canAccept('bank')"
        :server-field-errors="serverFieldErrors"
        @copy="emit('copy', $event)"
        @accept="emit('accept-step', 'bank')"
        @reject="emit('reject-step', 'bank')"
        @save="emit('save-fields', $event)"
      />

      <StaffDocumentPanelStub
        v-else-if="activeDoc === 'agent-type'"
        title="Тип оформления"
        :rows="agentTypeRows"
        :images="agentTypeImages"
        :columns="agentTypeColumns"
        :uploaded-label="uploadedLabel"
        :version="stepVersion(activeDoc)"
        :reason-label="stepReasonLabel(activeDoc)"
        :step-status="profile.activationSteps['agent-type']"
        :show-reject-actions="canReject('agent-type')"
        :show-accept-actions="canAccept('agent-type')"
        :server-field-errors="serverFieldErrors"
        @copy="emit('copy', $event)"
        @accept="emit('accept-step', 'agent-type')"
        @reject="emit('reject-step', 'agent-type')"
        @save="emit('save-fields', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ActivationStepId } from 'bibli/widgets/Profile/rr/lib/activationSteps'
import type { StaffProfileModel } from '../../composables/useStaffProfile'
import type { StaffPersonalSavePayload } from '../../lib/staffProfilePersonalSave'
import type {
  StaffFieldsSavePayload,
  StaffPassportSavePayload,
} from '../../lib/staffProfileDocImagesSave'
import {
  formatStaffRejectReason,
  formatStaffSnils,
  formatUploadMeta,
  resolveStaffDocVersion,
} from '../../lib/staffProfileFormat'
import { buildStaffAgentTypePanel } from '../../lib/staffProfileAgentType'
import { canSupportRejectActivationStep } from '../../lib/staffProfileRejectActions'
import { isStaffDocSectionEmpty } from '../../lib/staffProfileSectionEmpty'
import StaffDocumentSidebar from '../documents/StaffDocumentSidebar.vue'
import StaffPassportPanel from '../documents/StaffPassportPanel.vue'
import StaffPersonalPanel from '../documents/StaffPersonalPanel.vue'
import StaffDocumentPanelStub from '../documents/StaffDocumentPanelStub.vue'

const props = withDefaults(
  defineProps<{
    profile: StaffProfileModel
    activeDoc: ActivationStepId
    getFileUrl: (file: string | null | undefined) => string
    actionsBusy?: boolean
    serverFieldErrors?: Record<string, string>
    /** HR: только статусы этапов, содержимое документов скрыто */
    readOnlyBlur?: boolean
  }>(),
  { actionsBusy: false, serverFieldErrors: () => ({}), readOnlyBlur: false },
)

const emit = defineEmits<{
  'select-doc': [doc: ActivationStepId]
  copy: [value: string]
  'accept-step': [step: ActivationStepId]
  'reject-step': [step: ActivationStepId]
  'save-passport': [payload: StaffPassportSavePayload]
  'save-fields': [payload: StaffFieldsSavePayload]
  'save-personal': [payload: StaffPersonalSavePayload]
}>()

function hasStepContent(step: ActivationStepId): boolean {
  const passport = props.profile.passport
  switch (step) {
    case 'passport':
      return !isStaffDocSectionEmpty({
        rows: [
          { value: passport?.passport },
          { value: passport?.passport_date },
          { value: passport?.passport_code },
          { value: passport?.passport_issued },
          { value: passport?.birthday_place },
          { value: passport?.registration_address },
        ],
        imageUrls: [
          props.getFileUrl(passport?.file_passport),
          props.getFileUrl(passport?.file_passport_registration),
        ],
      })
    case 'personal':
      return !isStaffDocSectionEmpty({
        rows: [
          { value: props.profile.fullName },
          { value: passport?.birthday },
          { value: props.profile.phone },
          { value: props.profile.email },
          { value: props.profile.telegram_username },
        ],
        imageUrls: [props.getFileUrl(passport?.file_agent_with_passport)],
        extraValues: [personalGender.value],
      })
    case 'inn':
      return !isStaffDocSectionEmpty({ rows: innRows.value, images: innImages.value })
    case 'snils':
      return !isStaffDocSectionEmpty({ rows: snilsRows.value, images: snilsImages.value })
    case 'bank':
      return !isStaffDocSectionEmpty({ rows: bankRows.value, images: bankImages.value })
    case 'agent-type':
      return !isStaffDocSectionEmpty({
        rows: agentTypeRows.value,
        images: agentTypeImages.value,
      })
    default:
      return false
  }
}

function canReject(step: ActivationStepId): boolean {
  if (props.readOnlyBlur) return false
  return canSupportRejectActivationStep(
    props.profile.activationSteps[step],
    hasStepContent(step),
  )
}

function canAccept(step: ActivationStepId): boolean {
  if (props.readOnlyBlur) return false
  const status = props.profile.activationSteps[step]
  return status === 'review' || status === 'error'
}

/** empty + уже есть поля/файлы — для подписи «Частично заполнено» в сайдбаре. */
const partialStepIds = computed(() =>
  (Object.keys(props.profile.activationSteps) as ActivationStepId[]).filter((step) => {
    const status = props.profile.activationSteps[step]
    if (status === 'partial') return true
    return status === 'empty' && hasStepContent(step)
  }),
)

function fileImage(file: string | null | undefined, label: string, key: string) {
  const url = props.getFileUrl(file)
  return [{ url: url || '', label, key }]
}

const uploadedLabel = computed(() =>
  formatUploadMeta(props.profile.passport?.updated_at || props.profile.passport?.created_at),
)

function stepRejection(step: ActivationStepId) {
  return props.profile.activationRejections?.[step]
}

function stepVersion(step: ActivationStepId) {
  return resolveStaffDocVersion({
    stepStatus: props.profile.activationSteps[step],
    rejectCount: stepRejection(step)?.count,
  })
}

function stepReasonLabel(step: ActivationStepId) {
  return formatStaffRejectReason(stepRejection(step)?.reason)
}

const registration = computed(() => props.profile.rawRegistration ?? {})

const personalGender = computed(() => {
  const reg = registration.value as Record<string, unknown>
  const staffData = props.profile.rawStaffDetails?.data as Record<string, unknown> | undefined
  const raw = reg.gender ?? staffData?.gender
  return raw === 'm' || raw === 'f' ? raw : null
})

const innRows = computed(() => [
  { field: 'inn', label: 'Номер ИНН', value: props.profile.passport?.inn || '—' },
])

const innImages = computed(() => fileImage(props.profile.passport?.file_inn, 'ИНН', 'inn'))

const snilsRows = computed(() => [
  {
    field: 'snils',
    label: 'СНИЛС',
    value: formatStaffSnils(props.profile.passport?.snils),
  },
])

const snilsImages = computed(() => fileImage(props.profile.passport?.file_snils, 'СНИЛС', 'snils'))

const bankRows = computed(() => [
  { field: 'bank_bik', label: 'БИК банка', value: props.profile.passport?.bank_bik || '—' },
  { field: 'bank_account', label: 'Расчётный счёт', value: props.profile.passport?.bank_account || '—' },
  { field: 'bank_name', label: 'Название банка', value: props.profile.passport?.bank_name || '—' },
])

const bankImages = computed(() =>
  fileImage(props.profile.passport?.file_banking_details, 'Банковские реквизиты', 'bank'),
)

const agentTypePanel = computed(() => buildStaffAgentTypePanel(props.profile, props.getFileUrl))
const agentTypeRows = computed(() => agentTypePanel.value.rows)
const agentTypeImages = computed(() => agentTypePanel.value.images)
const agentTypeColumns = computed(() => agentTypePanel.value.columns)
</script>

<style scoped>
.staff-profile-documents {
  display: grid;
  flex: 1 1 auto;
  grid-template-columns: minmax(248px, 292px) minmax(0, 1fr);
  gap: 8px;
  align-items: start;
}

.staff-profile-documents__panel {
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 16px;
  border: none;
  border-radius: var(--rr-radius-2-xl, 20px);
  background: var(--rr-backgrounds-primary, #ffffff);
}

.staff-profile-documents__busy {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
  font-size: 14px;
  font-weight: 600;
}

.staff-profile-documents__busy-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #e5e7eb;
  border-top-color: #111827;
  border-radius: 50%;
  animation: staff-docs-spin 0.8s linear infinite;
}

@keyframes staff-docs-spin {
  to {
    transform: rotate(360deg);
  }
}

.staff-profile-documents__panel > :deep(.staff-doc-panel-stub),
.staff-profile-documents__panel > :deep(.staff-passport-panel),
.staff-profile-documents__panel > :deep(.staff-personal-panel) {
  flex: 1 1 auto;
  min-height: 100%;
}

.staff-profile-documents__panel--blurred {
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 280px;
}

.staff-profile-documents__blur-card {
  width: min(100%, 360px);
  padding: 20px;
  border-radius: 14px;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%);
  filter: blur(2px);
}

.staff-profile-documents__blur-lines {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.staff-profile-documents__blur-lines span {
  display: block;
  height: 12px;
  border-radius: 6px;
  background: rgba(17, 24, 39, 0.12);
}

.staff-profile-documents__blur-lines span:nth-child(2) {
  width: 78%;
}

.staff-profile-documents__blur-lines span:nth-child(3) {
  width: 92%;
}

.staff-profile-documents__blur-lines span:nth-child(4) {
  width: 64%;
}

.staff-profile-documents__blur-hint {
  margin: 0;
  max-width: 320px;
  text-align: center;
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
  font-size: 14px;
  line-height: 1.4;
}

@media (max-width: 720px) {
  .staff-profile-documents {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
    align-content: start;
    width: 100%;
    min-width: 0;
    min-height: 0;
    gap: 8px;
    overflow-x: hidden;
  }

  .staff-profile-documents > :deep(.staff-doc-sidebar-wrap) {
    align-self: start;
    width: 100%;
  }

  .staff-profile-documents__panel {
    min-height: 0;
    padding: 14px;
    border-radius: var(--rr-radius-2-xl, 20px);
  }
}
</style>
