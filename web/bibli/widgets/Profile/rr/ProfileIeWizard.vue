<template>
  <div class="profile-ie-wizard">
    <ProfileStepShell
      :class="{ 'profile-step-shell--review-muted': step === IE_WIZARD_TOTAL }"
      :current="step"
      :total="IE_WIZARD_TOTAL"
      :title="shellTitle"
      :subtitle="shellSubtitle"
      :rejection="showStepRejection ? stepRejection : null"
      :hide-progress="viewOnly || isRejectedSection"
      @back="onBack"
    >
      <!-- Step 1: EGRIP upload -->
      <div v-if="step === 1" class="piw-stack">
        <template v-if="hasOgrnipFile">
          <ProfileDocThumb
            :src="ogrnipUrl"
            :is-pdf="form.ogrnipIsPdf"
            alt="Лист записи ЕГРИП"
            pdf-label="ЕГРИП"
            empty-text="Нет файла"
            :allow-pdf-fallback="true"
            @click="openPreview(ogrnipUrl)"
          />
        </template>
        <template v-else>
          <div class="piw-hero piw-hero--example">
            <img
              class="piw-hero__img piw-hero__img--doc"
              :src="exampleEgrip"
              alt="Пример листа записи ЕГРИП"
            />
          </div>
          <p class="piw-reqs">Скачайте на nalog.ru → ИП → Сведения → Лист записи ЕГРИП</p>
        </template>
      </div>

      <!-- Step 2: form -->
      <div v-else-if="step === 2" class="piw-review">
        <AuthRRField label="ФИО ИП" :error="nameFieldError">
          <input
            class="auth-rr-input__control auth-rr-input__control--align-left"
            :class="{ 'auth-rr-input__control--error': !!nameFieldError }"
            type="text"
            placeholder="Введите ФИО"
            :value="form.name"
            :readonly="viewOnly"
            :aria-invalid="!!nameFieldError"
            @input="onNameInput"
            @blur="nameTouched = true"
          />
        </AuthRRField>
        <AuthRRField label="ИНН ИП" :error="innFieldError">
          <input
            class="auth-rr-input__control auth-rr-input__control--align-left"
            :class="{ 'auth-rr-input__control--error': !!innFieldError }"
            type="text"
            inputmode="numeric"
            placeholder="12 цифр"
            maxlength="12"
            :value="form.inn"
            :readonly="viewOnly"
            :aria-invalid="!!innFieldError"
            @input="onInnInput"
            @blur="innTouched = true"
          />
        </AuthRRField>
        <AuthRRField label="ОГРНИП" :error="ogrnipFieldError">
          <input
            class="auth-rr-input__control auth-rr-input__control--align-left"
            :class="{ 'auth-rr-input__control--error': !!ogrnipFieldError }"
            type="text"
            inputmode="numeric"
            placeholder="15 цифр"
            maxlength="15"
            :value="form.ogrnip"
            :readonly="viewOnly"
            :aria-invalid="!!ogrnipFieldError"
            @input="onOgrnipInput"
            @blur="ogrnipTouched = true"
          />
        </AuthRRField>
        <AuthRRField label="Расчетный счет" :error="paymentAccountFieldError">
          <input
            class="auth-rr-input__control auth-rr-input__control--align-left"
            :class="{ 'auth-rr-input__control--error': !!paymentAccountFieldError }"
            type="text"
            inputmode="numeric"
            placeholder="20 цифр"
            maxlength="20"
            :value="form.paymentAccount"
            :readonly="viewOnly"
            :aria-invalid="!!paymentAccountFieldError"
            @input="onPaymentAccountInput"
            @blur="paymentAccountTouched = true"
          />
        </AuthRRField>
        <AuthRRField label="Банк" :error="bankNameFieldError">
          <input
            class="auth-rr-input__control auth-rr-input__control--align-left"
            :class="{ 'auth-rr-input__control--error': !!bankNameFieldError }"
            type="text"
            placeholder="Название банка"
            :value="form.bank"
            :readonly="viewOnly"
            :aria-invalid="!!bankNameFieldError"
            @input="onBankInput"
            @blur="bankNameTouched = true"
          />
        </AuthRRField>
        <AuthRRField label="БИК Банка" :error="bikFieldError">
          <input
            class="auth-rr-input__control auth-rr-input__control--align-left"
            :class="{ 'auth-rr-input__control--error': !!bikFieldError }"
            type="text"
            inputmode="numeric"
            placeholder="9 цифр"
            maxlength="9"
            :value="form.bankBik"
            :readonly="viewOnly"
            :aria-invalid="!!bikFieldError"
            @input="onBankBikInput"
            @blur="bikTouched = true"
          />
        </AuthRRField>
        <AuthRRField label="ИНН банка" :error="bankInnFieldError">
          <input
            class="auth-rr-input__control auth-rr-input__control--align-left"
            :class="{ 'auth-rr-input__control--error': !!bankInnFieldError }"
            type="text"
            inputmode="numeric"
            placeholder="10 цифр"
            maxlength="10"
            :value="form.bankInn"
            :readonly="viewOnly"
            :aria-invalid="!!bankInnFieldError"
            @input="onBankInnInput"
            @blur="bankInnTouched = true"
          />
        </AuthRRField>
        <AuthRRField label="Корреспондентский счет" :error="correspondentFieldError">
          <input
            class="auth-rr-input__control auth-rr-input__control--align-left"
            :class="{ 'auth-rr-input__control--error': !!correspondentFieldError }"
            type="text"
            inputmode="numeric"
            placeholder="20 цифр"
            maxlength="20"
            :value="form.correspondentAccount"
            :readonly="viewOnly"
            :aria-invalid="!!correspondentFieldError"
            @input="onCorrInput"
            @blur="correspondentTouched = true"
          />
        </AuthRRField>
      </div>

      <!-- Step 3: review -->
      <div v-else class="piw-review">
        <ProfileDocThumb
          :src="ogrnipUrl"
          :is-pdf="form.ogrnipIsPdf"
          alt="ЕГРИП"
          pdf-label="ЕГРИП"
          empty-text="Нет файла"
          @click="openPreview(ogrnipUrl)"
        />

        <AuthRRField label="ФИО ИП">
          <input
            class="auth-rr-input__control auth-rr-input__control--align-left"
            :value="form.name"
            readonly
          />
        </AuthRRField>
        <AuthRRField label="ИНН ИП">
          <input
            class="auth-rr-input__control auth-rr-input__control--align-left"
            :value="form.inn"
            readonly
          />
        </AuthRRField>
        <AuthRRField label="ОГРНИП">
          <input
            class="auth-rr-input__control auth-rr-input__control--align-left"
            :value="form.ogrnip"
            readonly
          />
        </AuthRRField>
        <AuthRRField label="Расчетный счет">
          <input
            class="auth-rr-input__control auth-rr-input__control--align-left"
            :value="form.paymentAccount"
            readonly
          />
        </AuthRRField>
        <AuthRRField label="Банк">
          <input
            class="auth-rr-input__control auth-rr-input__control--align-left"
            :value="form.bank"
            readonly
          />
        </AuthRRField>
        <AuthRRField label="БИК Банка">
          <input
            class="auth-rr-input__control auth-rr-input__control--align-left"
            :value="form.bankBik"
            readonly
          />
        </AuthRRField>
        <AuthRRField label="ИНН банка">
          <input
            class="auth-rr-input__control auth-rr-input__control--align-left"
            :value="form.bankInn"
            readonly
          />
        </AuthRRField>
        <AuthRRField label="Корреспондентский счет">
          <input
            class="auth-rr-input__control auth-rr-input__control--align-left"
            :value="form.correspondentAccount"
            readonly
          />
        </AuthRRField>

      </div>

      <template #footer>
        <template v-if="viewOnly">
          <AuthRRButton label="Назад к профилю" @click="navigateTo('/profile', { replace: true })" />
        </template>
        <template v-else-if="step === 1">
          <AuthRRButton
            v-if="hasOgrnipFile"
            label="Продолжить"
            :disabled="busy"
            @click="goToStep(2)"
          />
          <AuthRRButton
            v-else
            label="Загрузить файл"
            :disabled="busy"
            @click="openFilePicker"
          />
        </template>
        <AuthRRButton
          v-else-if="!viewOnly && step === 2"
          label="Продолжить"
          :disabled="!canContinueForm"
          :loading="busy"
          @click="goToStep(3)"
        />
        <template v-else-if="!viewOnly">
          <ProfileRrCheckbox
            v-model="form.dataConfirmed"
            label="Данные верны, ИП зарегистрировано"
          />
          <AuthRRButton
            label="Отправить на проверку"
            :disabled="!canSubmit"
            :loading="busy"
            @click="submitForReview"
          />
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
import { computed, onActivated, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useProfileApi, useProfileNavigate } from '../composables/useProfileServices'
import { AuthRRButton, AuthRRField } from 'bibli/shared/ui/rr'
import { parseApiErrorDetail } from 'bibli/widgets/Profile/lib/parseApiError'
import {
  IE_WIZARD_TOTAL,
  createEmptyIeForm,
  digitsOnly,
  getIeBankInnFieldError,
  getIeBankNameFieldError,
  getIeBikFieldError,
  getIeCorrespondentAccountFieldError,
  getIeInnFieldError,
  getIeNameFieldError,
  getIeOgrnipFieldError,
  getIePaymentAccountFieldError,
  ieWizardPath,
  isIeFormValid,
  isIeOgrnipFileValid,
  isIeReadyToSubmit,
  parseWizardStep,
} from './lib/agentTypeWizard'
import { sanitizePersonNameInput } from 'bibli/shared/ui/rr/form/composables/useCyrillicNameValidation.js'
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
import exampleEgrip from './assets/activation/agent-type-examples/example-egrip.webp'

const api = useProfileApi()
const navigateTo = useProfileNavigate()
const {
  getDocumentUrl,
  getUserData,
  getActivationStatusFresh,
  getIndividualEntrepreneurData,
  submitIndividualEntrepreneurData,
} = api


const props = defineProps({
  step: { type: Number, default: 1 },
})

const step = computed(() => parseWizardStep(props.step, IE_WIZARD_TOTAL))
const busy = ref(false)
const formError = ref('')
const viewOnly = ref(false)
const stepStatus = ref('')
const stepRejection = ref(null)
seedWizardActivationGate('agent-type', { stepStatus, viewOnly })
redirectViewOnlyToReviewStep({
  viewOnly: viewOnly.value,
  currentStep: step.value,
  reviewStep: IE_WIZARD_TOTAL,
  navigateTo,
  pathForStep: ieWizardPath,
})
const isRejectedSection = computed(() => isActivationSectionRejected(stepStatus.value))
const form = reactive(createEmptyIeForm())
const previewUrl = ref('')
const previewIsPdf = ref(false)
const fileInputRef = ref(null)
const cameraOpen = ref(false)
const captureSeedFile = ref(null)
const innTouched = ref(false)
const nameTouched = ref(false)
const ogrnipTouched = ref(false)
const paymentAccountTouched = ref(false)
const bikTouched = ref(false)
const bankInnTouched = ref(false)
const correspondentTouched = ref(false)
const bankNameTouched = ref(false)

let ogrnipObjectUrl = null

const showStepRejection = computed(
  () => step.value === IE_WIZARD_TOTAL && !!stepRejection.value,
)

const shellTitle = computed(() => {
  if (viewOnly.value) return reviewShellTitle(stepStatus.value)
  if (step.value === 1) return 'Лист записи ЕГРИП'
  if (step.value === 2) return 'Данные ИП'
  return reviewShellTitle(stepStatus.value)
})

const shellSubtitle = computed(() => {
  if (viewOnly.value) return 'Изменение недоступно'
  if (step.value === 1) {
    return hasOgrnipFile.value
      ? 'Файл готов. Нажмите на него, чтобы загрузить заново.'
      : 'Документ о регистрации ИП'
  }
  if (step.value === 2) return 'ОГРНИП и система налогообложения'
  return ''
})

const ogrnipUrl = computed(() => {
  if (form.ogrnipPreviewUrl) return form.ogrnipPreviewUrl
  if (form.ogrnipServerPath) return getDocumentUrl(form.ogrnipServerPath)
  return ''
})

const hasOgrnipFile = computed(() => isIeOgrnipFileValid(form))
const canContinueForm = computed(() => isIeFormValid(form))
const canSubmit = computed(() => isIeReadyToSubmit(form))
const innFieldError = computed(() => getIeInnFieldError(form.inn, innTouched.value))
const nameFieldError = computed(() => getIeNameFieldError(form.name, nameTouched.value))
const ogrnipFieldError = computed(() => getIeOgrnipFieldError(form.ogrnip, ogrnipTouched.value))
const paymentAccountFieldError = computed(() =>
  getIePaymentAccountFieldError(form.paymentAccount, form.bankBik, paymentAccountTouched.value),
)

const bikFieldError = computed(() =>
  getIeBikFieldError(
    form.bankBik,
    form.paymentAccount,
    form.correspondentAccount,
    bikTouched.value,
  ),
)
const bankInnFieldError = computed(() => getIeBankInnFieldError(form.bankInn, bankInnTouched.value))
const correspondentFieldError = computed(() =>
  getIeCorrespondentAccountFieldError(
    form.correspondentAccount,
    form.bankBik,
    correspondentTouched.value,
  ),
)
const bankNameFieldError = computed(() => getIeBankNameFieldError(form.bank, bankNameTouched.value))

function apiError(err, fallback) {
  return parseApiErrorDetail(err, fallback) || fallback
}

function goToStep(n, { replace = true } = {}) {
  if (viewOnly.value && parseWizardStep(n, IE_WIZARD_TOTAL) !== IE_WIZARD_TOTAL) return
  formError.value = ''
  const next = parseWizardStep(n, IE_WIZARD_TOTAL)
  if (next === step.value) return
  void navigateTo(ieWizardPath(next), replace ? { replace: true } : undefined)
}

function onBack() {
  if (busy.value) return
  if (viewOnly.value || isRejectedSection.value || step.value <= 1) {
    void navigateTo(readActivationReturnPath(), { replace: true })
    return
  }
  void navigateTo(ieWizardPath(step.value - 1), { replace: true })
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
    reviewStep: IE_WIZARD_TOTAL,
    navigateTo,
    pathForStep: ieWizardPath,
  })
}

function onNameInput(e) {
  if (viewOnly.value) return
  form.name = sanitizePersonNameInput(e.target.value)
}
function onInnInput(e) {
  if (viewOnly.value) return
  form.inn = digitsOnly(e.target.value, 12)
}
function onOgrnipInput(e) {
  if (viewOnly.value) return
  form.ogrnip = digitsOnly(e.target.value, 15)
}
function onPaymentAccountInput(e) {
  if (viewOnly.value) return
  form.paymentAccount = digitsOnly(e.target.value, 20)
}
function onBankInput(e) {
  if (viewOnly.value) return
  form.bank = e.target.value
}
function onBankBikInput(e) {
  if (viewOnly.value) return
  form.bankBik = digitsOnly(e.target.value, 9)
}
function onBankInnInput(e) {
  if (viewOnly.value) return
  form.bankInn = digitsOnly(e.target.value, 10)
}
function onCorrInput(e) {
  if (viewOnly.value) return
  form.correspondentAccount = digitsOnly(e.target.value, 20)
}

function closePreview() {
  previewUrl.value = ''
  previewIsPdf.value = false
}

function openPreview(url) {
  if (viewOnly.value && !url) return
  if (!url) {
    previewIsPdf.value = false
    previewUrl.value = EMPTY_PHOTO_PREVIEW_TOKEN
    return
  }
  previewIsPdf.value =
    form.ogrnipIsPdf || isPdfSource(url, form.ogrnipFile, form.ogrnipServerPath)
  previewUrl.value = url
}

function openFilePicker() {
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

function assignOgrnipFile(file) {
  const localUrl = URL.createObjectURL(file)
  if (ogrnipObjectUrl) URL.revokeObjectURL(ogrnipObjectUrl)
  ogrnipObjectUrl = localUrl
  form.ogrnipFile = file
  form.ogrnipPreviewUrl = localUrl
  form.ogrnipServerPath = null
  form.ogrnipIsPdf = isPdfFile(file)
}

function onFilePicked(event) {
  const input = event.target
  const file = input?.files?.[0]
  if (input) input.value = ''
  if (!file || busy.value) return
  formError.value = ''

  if (!isAllowedUploadFile(file, 'image-or-pdf')) {
    formError.value = uploadRejectMessage('image-or-pdf')
    return
  }

  if (isImageFile(file)) {
    captureSeedFile.value = file
    cameraOpen.value = true
    return
  }

  assignOgrnipFile(file)
}

function onCaptureSave({ file }) {
  if (!file) return
  assignOgrnipFile(file)
  closeCapture({ force: true })
}

async function resolveOgrnipFile() {
  if (form.ogrnipFile) return form.ogrnipFile
  if (!form.ogrnipServerPath) return null
  const url = getDocumentUrl(form.ogrnipServerPath)
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) throw new Error('Не удалось получить файл ЕГРИП')
  const blob = await res.blob()
  return new File([blob], 'egrip.pdf', { type: blob.type || 'application/octet-stream' })
}

async function submitForReview() {
  if (!canSubmit.value || busy.value) return
  formError.value = ''
  busy.value = true
  try {
    const file = await resolveOgrnipFile()
    if (!file) {
      formError.value = 'Загрузите лист записи ЕГРИП'
      return
    }
    await submitIndividualEntrepreneurData({
      name: form.name.trim(),
      inn: digitsOnly(form.inn, 12),
      ogrnip: digitsOnly(form.ogrnip, 15),
      file_ogrnip: file,
      payment_account: digitsOnly(form.paymentAccount, 20),
      bank: form.bank.trim(),
      bank_bik: digitsOnly(form.bankBik, 9),
      bank_inn: digitsOnly(form.bankInn, 10),
      correspondent_account: digitsOnly(form.correspondentAccount, 20),
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
      getIndividualEntrepreneurData(),
      getUserData(),
      getActivationStatusFresh(),
    ])
    const row = res?.data || res || {}
    form.name = row.name || ''
    form.inn = digitsOnly(row.inn || '', 12)
    form.ogrnip = digitsOnly(row.ogrnip || '', 15)
    form.paymentAccount = digitsOnly(row.payment_account || '', 20)
    form.bank = row.bank || ''
    form.bankBik = digitsOnly(row.bank_bik || '', 9)
    form.bankInn = digitsOnly(row.bank_inn || '', 10)
    form.correspondentAccount = digitsOnly(row.correspondent_account || '', 20)
    if (row.file_ogrnip) {
      const keepLocal =
        Boolean(form.ogrnipFile) ||
        (typeof form.ogrnipPreviewUrl === 'string' &&
          (form.ogrnipPreviewUrl.startsWith('blob:') ||
            form.ogrnipPreviewUrl.startsWith('data:')))
      form.ogrnipServerPath = row.file_ogrnip
      if (!keepLocal) {
        form.ogrnipPreviewUrl = getDocumentUrl(row.file_ogrnip)
        form.ogrnipFile = null
        if (ogrnipObjectUrl) {
          URL.revokeObjectURL(ogrnipObjectUrl)
          ogrnipObjectUrl = null
        }
      }
      form.ogrnipIsPdf = isPdfSource(form.ogrnipPreviewUrl, form.ogrnipFile, row.file_ogrnip)
    }
    syncActivationGate(userRes, activationRes)
  } catch (err) {
    console.error('[ie-wizard] load failed', err)
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
  innTouched.value = false
  nameTouched.value = false
  ogrnipTouched.value = false
  paymentAccountTouched.value = false
  bikTouched.value = false
  bankInnTouched.value = false
  correspondentTouched.value = false
  bankNameTouched.value = false
  if (ogrnipObjectUrl) URL.revokeObjectURL(ogrnipObjectUrl)
  ogrnipObjectUrl = null
  Object.assign(form, createEmptyIeForm())
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
  if (ogrnipObjectUrl) URL.revokeObjectURL(ogrnipObjectUrl)
})
</script>

<style scoped>
.profile-ie-wizard,
.profile-ie-wizard *,
.profile-ie-wizard *::before,
.profile-ie-wizard *::after {
  box-sizing: border-box;
}

.profile-ie-wizard {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  flex: 1 1 0;
  overflow: hidden;
}

.profile-ie-wizard :deep(.profile-step-shell__footer) {
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

.piw-file-input {
  display: none;
}

.piw-review {
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-xl);
}


.piw-error {
  margin: var(--rr-spacing-padding-m) 0 0;
  color: var(--rr-labels-danger-primary);
  font-size: var(--rr-font-size-font-size-s);
  text-align: center;
}

</style>
