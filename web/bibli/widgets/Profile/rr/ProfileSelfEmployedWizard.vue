<template>
  <div class="profile-se-wizard">
    <ProfileStepShell
      :class="{ 'profile-step-shell--review-muted': step === SE_WIZARD_TOTAL }"
      :current="step"
      :total="SE_WIZARD_TOTAL"
      :title="shellTitle"
      :subtitle="shellSubtitle"
      :rejection="showStepRejection ? stepRejection : null"
      :hide-progress="viewOnly || isRejectedSection"
      @back="onBack"
    >
      <!-- Steps 1–2: upload -->
      <div v-if="step === 1 || step === 2" class="piw-stack">
        <template v-if="currentHasFile">
          <ProfileDocThumb
            :src="currentPreviewUrl"
            :is-pdf="step === 1 ? form.registrationIsPdf : form.incomeIsPdf"
            :alt="step === 1 ? 'Справка о постановке' : 'Справка о доходах'"
            :pdf-label="step === 1 ? 'Постановка' : 'Доходы'"
            empty-text="Нет файла"
            :allow-pdf-fallback="true"
            @click="openPreview(currentPreviewUrl, step === 1 ? 'registration' : 'income')"
          />
        </template>
        <template v-else>
          <div class="piw-hero piw-hero--example">
            <img
              class="piw-hero__img piw-hero__img--doc"
              :src="step === 1 ? exampleRegistration : exampleIncome"
              :alt="step === 1 ? 'Пример справки о постановке на учёт' : 'Пример справки о доходах'"
            />
          </div>

          <div class="piw-reqs-block">
            <template v-if="step === 1">
              <p class="piw-reqs">Скачайте в приложении «Мой налог» Прочее → Справки → Постановка на учёт.</p>
              <p class="piw-reqs">
                Сохраните как PDF за текущий год, дата
                <span class="piw-reqs__accent">не позднее 3 дней назад</span>
              </p>
            </template>
            <template v-else>
              <p class="piw-reqs">Скачайте в приложении «Мой налог» Прочее → Справки → О доходах.</p>
              <p class="piw-reqs">
                Справка должна быть свежей за текущий год. Дата формирования
                <span class="piw-reqs__accent">не позднее 3 дней назад</span>
              </p>
            </template>
          </div>
        </template>
      </div>

      <!-- Step 3: review -->
      <div v-else class="piw-review">
        <div class="piw-docs-row">
          <ProfileDocThumb
            fill
            :src="registrationUrl"
            :is-pdf="form.registrationIsPdf"
            alt="Справка о постановке"
            pdf-label="Постановка"
            empty-text="Нет файла"
            @click="openPreview(registrationUrl, 'registration')"
          />
          <ProfileDocThumb
            fill
            :src="incomeUrl"
            :is-pdf="form.incomeIsPdf"
            alt="Справка о доходах"
            pdf-label="Доходы"
            empty-text="Нет файла"
            @click="openPreview(incomeUrl, 'income')"
          />
        </div>
      </div>

      <template #footer>
        <template v-if="viewOnly">
          <AuthRRButton label="Назад к профилю" @click="navigateTo('/profile', { replace: true })" />
        </template>
        <template v-else>
          <template v-if="step === 1 || step === 2">
            <AuthRRButton
              v-if="currentHasFile"
              label="Продолжить"
              :disabled="busy"
              @click="goToStep(step + 1)"
            />
            <AuthRRButton
              v-else
              label="Загрузить файл"
              :disabled="busy"
              @click="openFilePicker"
            />
          </template>
          <template v-if="step === 3">
            <ProfileRrCheckbox
              v-model="form.dataConfirmed"
              label="Документы действительны и не истекли"
            />
            <AuthRRButton
              label="Отправить на проверку"
              :disabled="!canSubmit"
              :loading="busy"
              @click="submitForReview"
            />
          </template>
        </template>
        <p v-if="formError" class="piw-error" role="alert">{{ formError }}</p>
      </template>
    </ProfileStepShell>

    <input
      ref="fileInputRef"
      class="piw-file-input"
      type="file"
      accept="image/*,application/pdf"
      @change="onFilePicked"
    />

    <PassportCameraCapture
      v-if="cameraOpen"
      variant="inn"
      source="file"
      :seed-file="captureSeedFile"
      :saving="busy"
      @close="closeCapture"
      @save="onCaptureSave"
      @replace="onCaptureReplace"
    />

    <ProfilePhotoReviewOverlay
      v-if="previewUrl"
      :src="previewUrl === EMPTY_PHOTO_PREVIEW_TOKEN ? '' : previewUrl"
      :is-pdf="previewIsPdf"
      alt="Просмотр"
      aria-label="Просмотр документа"
      :hint="!previewUrl || previewUrl === EMPTY_PHOTO_PREVIEW_TOKEN ? 'Загрузите документ' : 'Проверьте документ'"
      :show-secondary="!viewOnly"
      :secondary-label="!previewUrl || previewUrl === EMPTY_PHOTO_PREVIEW_TOKEN ? 'Загрузить' : 'Заменить'"
      primary-label="Готово"
      @close="closePreview"
      @primary="closePreview"
      @secondary="onReplaceFromPreview"
    />
  </div>
</template>

<script setup>
import { computed, onActivated, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useProfileApi, useProfileNavigate } from '../composables/useProfileServices'
import { AuthRRButton } from 'bibli/shared/ui/rr'
import { parseApiErrorDetail } from 'bibli/widgets/Profile/lib/parseApiError'
import {
  SE_WIZARD_TOTAL,
  createEmptySeForm,
  isSeIncomeValid,
  isSeReadyToSubmit,
  isSeRegistrationValid,
  parseWizardStep,
  seWizardPath,
} from './lib/agentTypeWizard'
import { reviewShellTitle } from './lib/activationSteps'
import {
  applyWizardActivationGate,
  isActivationSectionRejected,
  redirectViewOnlyToReviewStep,
  seedWizardActivationGate,
} from './lib/wizardActivationContext'
import { activationSubmitExitPath, readActivationReturnPath } from './lib/activationReturnPath'
import { markActivationStep } from './lib/activationStatusSync'
import {
  isAllowedUploadFile,
  isImageFile,
  isPdfFile,
  isPdfSource,
  uploadRejectMessage,
} from './lib/documentMedia'
import ProfileStepShell from './personal/ProfileStepShell.vue'
import ProfileRrCheckbox from './personal/ProfileRrCheckbox.vue'
import ProfileDocThumb from './personal/ProfileDocThumb.vue'
import ProfilePhotoReviewOverlay from './personal/ProfilePhotoReviewOverlay.vue'
import PassportCameraCapture from './passport/PassportCameraCapture.vue'
import { EMPTY_PHOTO_PREVIEW_TOKEN } from './lib/profilePhotos'
import exampleRegistration from './assets/activation/agent-type-examples/example-se-registration.webp'
import exampleIncome from './assets/activation/agent-type-examples/example-se-income.webp'

const api = useProfileApi()
const navigateTo = useProfileNavigate()
const {
  getDocumentUrl,
  getUserData,
  getActivationStatusFresh,
  getSelfEmployedData,
  submitSelfEmployedData,
} = api


const props = defineProps({
  step: { type: Number, default: 1 },
})

const step = computed(() => parseWizardStep(props.step, SE_WIZARD_TOTAL))
const busy = ref(false)
const formError = ref('')
const viewOnly = ref(false)
const stepStatus = ref('')
const stepRejection = ref(null)
seedWizardActivationGate('agent-type', { stepStatus, viewOnly })
redirectViewOnlyToReviewStep({
  viewOnly: viewOnly.value,
  currentStep: step.value,
  reviewStep: SE_WIZARD_TOTAL,
  navigateTo,
  pathForStep: seWizardPath,
})
const isRejectedSection = computed(() => isActivationSectionRejected(stepStatus.value))
const form = reactive(createEmptySeForm())
const previewUrl = ref('')
const previewIsPdf = ref(false)
const fileInputRef = ref(null)
const replaceTarget = ref('registration')
const cameraOpen = ref(false)
const captureSeedFile = ref(null)
const pendingCaptureKind = ref('registration')

let registrationObjectUrl = null
let incomeObjectUrl = null

const showStepRejection = computed(
  () => step.value === SE_WIZARD_TOTAL && !!stepRejection.value,
)

const shellTitle = computed(() => {
  if (viewOnly.value) return reviewShellTitle(stepStatus.value)
  if (step.value === 1) return 'Справка о постановке на учёт'
  if (step.value === 2) return 'Справка о доходах'
  return reviewShellTitle(stepStatus.value)
})

const shellSubtitle = computed(() => {
  if (viewOnly.value) return 'Изменение недоступно'
  if (step.value === 1) {
    return isSeRegistrationValid(form)
      ? 'Файл готов. Нажмите на него, чтобы загрузить заново.'
      : 'Подтвердите статус самозанятого'
  }
  if (step.value === 2) {
    return isSeIncomeValid(form)
      ? 'Файл готов. Нажмите на него, чтобы загрузить заново.'
      : 'По форме КНД 1122036, актуальная'
  }
  return ''
})

const registrationUrl = computed(() => {
  if (form.registrationPreviewUrl) return form.registrationPreviewUrl
  if (form.registrationServerPath) return getDocumentUrl(form.registrationServerPath)
  return ''
})

const incomeUrl = computed(() => {
  if (form.incomePreviewUrl) return form.incomePreviewUrl
  if (form.incomeServerPath) return getDocumentUrl(form.incomeServerPath)
  return ''
})

const currentPreviewUrl = computed(() => (step.value === 1 ? registrationUrl.value : incomeUrl.value))
const currentHasFile = computed(() => Boolean(currentPreviewUrl.value))
const canSubmit = computed(() => isSeReadyToSubmit(form))

function apiError(err, fallback) {
  return parseApiErrorDetail(err, fallback) || fallback
}

function goToStep(n, { replace = true } = {}) {
  if (viewOnly.value && parseWizardStep(n, SE_WIZARD_TOTAL) !== SE_WIZARD_TOTAL) return
  formError.value = ''
  const next = parseWizardStep(n, SE_WIZARD_TOTAL)
  if (next === step.value) return
  void navigateTo(seWizardPath(next), replace ? { replace: true } : undefined)
}

function onBack() {
  if (busy.value) return
  if (viewOnly.value || isRejectedSection.value || step.value <= 1) {
    void navigateTo(readActivationReturnPath(), { replace: true })
    return
  }
  void navigateTo(seWizardPath(step.value - 1), { replace: true })
}

function syncActivationGate(userRes, activationRes) {
  applyWizardActivationGate(userRes, activationRes, 'agent-type', {
    stepStatus,
    viewOnly,
    stepRejection,
  })
  redirectViewOnlyToReviewStep({
    viewOnly: viewOnly.value,
    currentStep: step.value,
    reviewStep: SE_WIZARD_TOTAL,
    navigateTo,
    pathForStep: seWizardPath,
  })
}

function closePreview() {
  previewUrl.value = ''
  previewIsPdf.value = false
}

function openPreview(url, kind = null) {
  if (viewOnly.value && !url) return
  if (kind) replaceTarget.value = kind
  if (!url) {
    previewIsPdf.value = false
    previewUrl.value = EMPTY_PHOTO_PREVIEW_TOKEN
    return
  }
  const target = kind || replaceTarget.value
  const file = target === 'income' ? form.incomeFile : form.registrationFile
  const flagged = target === 'income' ? form.incomeIsPdf : form.registrationIsPdf
  const path =
    target === 'income' ? form.incomeServerPath : form.registrationServerPath
  previewIsPdf.value = flagged || isPdfSource(url, file, path)
  previewUrl.value = url
}

function openFilePicker() {
  if (step.value === 1) replaceTarget.value = 'registration'
  else if (step.value === 2) replaceTarget.value = 'income'
  fileInputRef.value?.click()
}

function closeCapture({ force = false } = {}) {
  if (busy.value && !force) return
  cameraOpen.value = false
  captureSeedFile.value = null
}

function onCaptureReplace() {
  formError.value = ''
  openFilePicker()
}

function onReplaceFromPreview() {
  closePreview()
  fileInputRef.value?.click()
}

function assignLocalFile(kind, file) {
  const localUrl = URL.createObjectURL(file)
  const pdf = isPdfFile(file)
  if (kind === 'registration') {
    if (registrationObjectUrl) URL.revokeObjectURL(registrationObjectUrl)
    registrationObjectUrl = localUrl
    form.registrationFile = file
    form.registrationPreviewUrl = localUrl
    form.registrationServerPath = null
    form.registrationIsPdf = pdf
  } else {
    if (incomeObjectUrl) URL.revokeObjectURL(incomeObjectUrl)
    incomeObjectUrl = localUrl
    form.incomeFile = file
    form.incomePreviewUrl = localUrl
    form.incomeServerPath = null
    form.incomeIsPdf = pdf
  }
}

async function resolveFile(file, serverPath, name) {
  if (file) return file
  if (!serverPath) return null
  const url = getDocumentUrl(serverPath)
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) throw new Error('Не удалось получить файл с сервера')
  const blob = await res.blob()
  return new File([blob], name, { type: blob.type || 'application/octet-stream' })
}

async function onFilePicked(event) {
  const input = event.target
  const file = input?.files?.[0]
  if (input) input.value = ''
  if (!file || busy.value) return
  formError.value = ''
  const kind = step.value === 3 ? replaceTarget.value : step.value === 1 ? 'registration' : 'income'

  if (!isAllowedUploadFile(file, 'image-or-pdf')) {
    formError.value = uploadRejectMessage('image-or-pdf')
    return
  }

  if (isImageFile(file)) {
    pendingCaptureKind.value = kind
    captureSeedFile.value = file
    cameraOpen.value = true
    return
  }

  assignLocalFile(kind, file)
}

function onCaptureSave({ file }) {
  if (!file) return
  assignLocalFile(pendingCaptureKind.value, file)
  closeCapture({ force: true })
}

async function submitForReview() {
  if (!canSubmit.value || busy.value) return
  formError.value = ''
  busy.value = true
  try {
    const registration = await resolveFile(
      form.registrationFile,
      form.registrationServerPath,
      'registration.pdf',
    )
    const income = await resolveFile(form.incomeFile, form.incomeServerPath, 'income.pdf')
    if (!registration || !income) {
      formError.value = 'Загрузите оба документа'
      return
    }
    await submitSelfEmployedData({
      file_self_employed: registration,
      file_income_statement: income,
    })
    markActivationStep('agent-type', 'review')
    await navigateTo(activationSubmitExitPath(), { replace: true })
  } catch (err) {
    formError.value = apiError(err, 'Не удалось отправить данные')
  } finally {
    busy.value = false
  }
}

async function loadInitial() {
  try {
    const [res, userRes, activationRes] = await Promise.all([
      getSelfEmployedData(),
      getUserData(),
      getActivationStatusFresh(),
    ])
    const row = res?.data || res || {}
    if (row.file_self_employed) {
      const keepLocal =
        Boolean(form.registrationFile) ||
        (typeof form.registrationPreviewUrl === 'string' &&
          (form.registrationPreviewUrl.startsWith('blob:') ||
            form.registrationPreviewUrl.startsWith('data:')))
      form.registrationServerPath = row.file_self_employed
      if (!keepLocal) {
        form.registrationPreviewUrl = getDocumentUrl(row.file_self_employed)
        form.registrationFile = null
        if (registrationObjectUrl) {
          URL.revokeObjectURL(registrationObjectUrl)
          registrationObjectUrl = null
        }
      }
      form.registrationIsPdf = isPdfSource(
        form.registrationPreviewUrl,
        form.registrationFile,
        row.file_self_employed,
      )
    }
    if (row.file_income_statement) {
      const keepLocal =
        Boolean(form.incomeFile) ||
        (typeof form.incomePreviewUrl === 'string' &&
          (form.incomePreviewUrl.startsWith('blob:') ||
            form.incomePreviewUrl.startsWith('data:')))
      form.incomeServerPath = row.file_income_statement
      if (!keepLocal) {
        form.incomePreviewUrl = getDocumentUrl(row.file_income_statement)
        form.incomeFile = null
        if (incomeObjectUrl) {
          URL.revokeObjectURL(incomeObjectUrl)
          incomeObjectUrl = null
        }
      }
      form.incomeIsPdf = isPdfSource(
        form.incomePreviewUrl,
        form.incomeFile,
        row.file_income_statement,
      )
    }
    syncActivationGate(userRes, activationRes)
  } catch (err) {
    console.error('[se-wizard] load failed', err)
  }
}

function softResetUi() {
  formError.value = ''
  busy.value = false
  closePreview()
  closeCapture({ force: true })
}

function resetLocalState() {
  softResetUi()
  form.dataConfirmed = false
  if (registrationObjectUrl) URL.revokeObjectURL(registrationObjectUrl)
  if (incomeObjectUrl) URL.revokeObjectURL(incomeObjectUrl)
  registrationObjectUrl = null
  incomeObjectUrl = null
  Object.assign(form, createEmptySeForm())
}

onMounted(() => {
  void loadInitial()
})

const skipNextActivateReload = ref(true)
onActivated(() => {
  if (skipNextActivateReload.value) {
    skipNextActivateReload.value = false
    return
  }
  softResetUi()
  void loadInitial()
})

onBeforeUnmount(() => {
  if (registrationObjectUrl) URL.revokeObjectURL(registrationObjectUrl)
  if (incomeObjectUrl) URL.revokeObjectURL(incomeObjectUrl)
})
</script>

<style scoped>
.profile-se-wizard,
.profile-se-wizard *,
.profile-se-wizard *::before,
.profile-se-wizard *::after {
  box-sizing: border-box;
}

.profile-se-wizard {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  flex: 1 1 0;
  overflow: hidden;
}

.profile-se-wizard :deep(.profile-step-shell__footer) {
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-m);
}

.piw-stack {
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-xl);
}

.piw-hero {
  display: grid;
  place-items: center;
  padding: var(--rr-spacing-padding-2-xl) var(--rr-spacing-padding-xl);
  border-radius: var(--rr-radius-xl);
  background: var(--rr-backgrounds-brand-secondary-default);
  overflow: hidden;
}

.piw-hero--example {
  align-items: end;
  justify-items: center;
  min-height: 220px;
  padding-top: var(--rr-spacing-padding-3-xl);
  padding-bottom: 0;
}

.piw-hero__img {
  display: block;
  width: 100%;
  max-width: 200px;
  height: auto;
  border-radius: var(--rr-radius-m);
  object-fit: contain;
  box-shadow: 0 var(--rr-spacing-padding-m) var(--rr-spacing-padding-3-xl) var(--rr-fx-shadow-major);
}

.piw-hero__img--doc {
  max-width: 240px;
  margin: 0;
  border-radius: var(--rr-radius-m) var(--rr-radius-m) 0 0;
  box-shadow: 0 var(--rr-spacing-padding-s) var(--rr-spacing-padding-2-xl) var(--rr-fx-shadow-major);
  object-position: bottom center;
}

.piw-reqs-block {
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-s);
}

.piw-reqs {
  margin: 0;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 400;
  font-size: var(--rr-font-size-font-size-m);
  line-height: var(--rr-line-height-line-height-m);
  letter-spacing: var(--rr-tracking-tracking-m);
  color: var(--rr-labels-neutral-primary);
  text-align: left;
}

.piw-reqs__accent {
  color: var(--rr-labels-brand-primary);
}

.piw-file-input {
  display: none;
}

.piw-review {
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-xl);
}

.piw-docs-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--rr-spacing-padding-l);
}


.piw-error {
  margin: var(--rr-spacing-padding-m) 0 0;
  color: var(--rr-labels-danger-primary);
  font-size: var(--rr-font-size-font-size-s);
  text-align: center;
}

</style>
