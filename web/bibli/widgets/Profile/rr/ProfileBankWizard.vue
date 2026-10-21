<template>
  <div class="profile-bank-wizard">
    <ProfileStepShell
      :class="{ 'profile-step-shell--review-muted': step === BANK_WIZARD_TOTAL }"
      :current="step"
      :total="BANK_WIZARD_TOTAL"
      :title="shellTitle"
      :subtitle="shellSubtitle"
      :rejection="showStepRejection ? stepRejection : null"
      :hide-progress="viewOnly || isRejectedSection"
      @back="onBack"
    >
      <!-- Step 1: upload -->
      <div v-if="step === 1" class="piw-stack">
        <template v-if="isBankPhotoValid(form)">
          <ProfileDocThumb
            :src="reviewPhotoUrl"
            :is-pdf="form.photoIsPdf"
            :mime="form.photoMime || ''"
            alt="Банковские реквизиты"
            pdf-label="Реквизиты"
            empty-text="Нет файла"
            :allow-pdf-fallback="true"
            @click="openPreview(reviewPhotoUrl)"
          />
        </template>
        <template v-else-if="!initialLoaded">
          <div class="piw-photo-pending" aria-busy="true" aria-label="Загрузка документа" />
        </template>
        <template v-else>
          <div class="piw-hero piw-hero--example">
            <img
              class="piw-hero__img piw-hero__img--bank"
              :src="exampleBank"
              alt="Пример банковских реквизитов"
            />
          </div>

          <p class="piw-reqs">
            БИК и номер счёта должны читаться. Название банка введёте сами на следующем шаге
          </p>

          <button type="button" class="piw-help-link piw-help-link--start" @click="helpOpen = true">
            <img
              class="piw-help-link__icon"
              :src="helpCircleIcon"
              alt=""
              width="20"
              height="20"
              aria-hidden="true"
            />
            Где найти реквизиты
          </button>
        </template>
      </div>

      <!-- Step 2: fill fields -->
      <div v-else-if="step === 2" class="piw-review">
        <ProfileDocThumb
          :src="reviewPhotoUrl"
          :is-pdf="form.photoIsPdf"
          :mime="form.photoMime || ''"
          alt="Банковские реквизиты"
          pdf-label="Реквизиты"
          empty-text="Нет файла"
          :allow-pdf-fallback="true"
          @click="openPreview(reviewPhotoUrl)"
        />

        <p v-if="ocrUserHint" class="piw-ocr-hint" role="status">{{ ocrUserHint }}</p>

        <AuthRRField label="БИК банка" :error="bikFieldError">
          <input
            class="auth-rr-input__control auth-rr-input__control--align-left"
            :class="{ 'auth-rr-input__control--error': !!bikFieldError }"
            type="text"
            inputmode="numeric"
            placeholder="9 цифр"
            maxlength="9"
            :value="form.bankBik"
            :aria-invalid="!!bikFieldError"
            @input="onBikInput"
            @blur="bikTouched = true"
          />
        </AuthRRField>

        <AuthRRField label="Расчётный счёт" :error="accountFieldError">
          <input
            class="auth-rr-input__control auth-rr-input__control--align-left"
            :class="{ 'auth-rr-input__control--error': !!accountFieldError }"
            type="text"
            inputmode="numeric"
            placeholder="20 цифр"
            maxlength="20"
            :value="form.bankAccount"
            :aria-invalid="!!accountFieldError"
            @input="onAccountInput"
            @blur="accountTouched = true"
          />
        </AuthRRField>

        <AuthRRField label="Название банка" :error="bankNameFieldError">
          <input
            class="auth-rr-input__control auth-rr-input__control--align-left"
            :class="{ 'auth-rr-input__control--error': !!bankNameFieldError }"
            type="text"
            placeholder="Например, ПАО Сбербанк"
            maxlength="255"
            :value="form.bankName"
            :aria-invalid="!!bankNameFieldError"
            @input="onBankNameInput"
            @blur="bankNameTouched = true"
          />
        </AuthRRField>
      </div>

      <!-- Step 3: review / confirm -->
      <div v-else class="piw-review">
        <ProfileDocThumb
          :src="reviewPhotoUrl"
          :is-pdf="form.photoIsPdf"
          :mime="form.photoMime || ''"
          alt="Банковские реквизиты"
          pdf-label="Реквизиты"
          empty-text="Нет файла"
          :allow-pdf-fallback="true"
          @click="openPreview(reviewPhotoUrl)"
        />

        <AuthRRField label="БИК банка" :error="bikFieldError">
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
            @input="onBikInput"
            @blur="bikTouched = true"
          />
        </AuthRRField>

        <AuthRRField label="Расчётный счёт" :error="accountFieldError">
          <input
            class="auth-rr-input__control auth-rr-input__control--align-left"
            :class="{ 'auth-rr-input__control--error': !!accountFieldError }"
            type="text"
            inputmode="numeric"
            placeholder="20 цифр"
            maxlength="20"
            :value="form.bankAccount"
            :readonly="viewOnly"
            :aria-invalid="!!accountFieldError"
            @input="onAccountInput"
            @blur="accountTouched = true"
          />
        </AuthRRField>

        <AuthRRField label="Название банка" :error="bankNameFieldError">
          <input
            class="auth-rr-input__control auth-rr-input__control--align-left"
            :class="{ 'auth-rr-input__control--error': !!bankNameFieldError }"
            type="text"
            placeholder="Например, ПАО Сбербанк"
            maxlength="255"
            :value="form.bankName"
            :readonly="viewOnly"
            :aria-invalid="!!bankNameFieldError"
            @input="onBankNameInput"
            @blur="bankNameTouched = true"
          />
        </AuthRRField>
      </div>

      <template #footer>
        <template v-if="viewOnly">
          <AuthRRButton label="Назад к профилю" @click="navigateTo('/profile', { replace: true })" />
        </template>
        <template v-else-if="step === 1">
          <AuthRRButton
            v-if="hasUploadedPhoto"
            label="Продолжить"
            :loading="busy || ocrChecking"
            @click="onContinueFromPhoto"
          />
          <AuthRRButton
            v-else-if="initialLoaded"
            label="Загрузить файл"
            :loading="busy"
            @click="openFilePicker"
          />
        </template>
        <AuthRRButton
          v-else-if="!viewOnly && step === 2"
          label="Продолжить"
          :disabled="!canContinueFields"
          :loading="busy"
          @click="submitBankFieldsStep"
        />
        <template v-else-if="!viewOnly">
          <ProfileRrCheckbox v-model="form.dataConfirmed" label="Данные верны" />
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

    <div
      v-if="ocrChecking"
      class="piw-ocr-overlay"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div class="piw-ocr-overlay__card">
        <div class="piw-ocr-overlay__spinner" aria-hidden="true" />
        <p class="piw-ocr-overlay__text">Проверяем правильность фотографии…</p>
      </div>
    </div>

    <input
      ref="fileInputRef"
      class="piw-file-input"
      type="file"
      :accept="ACCEPT_IMAGE_OR_PDF"
      @change="onFilePicked"
    />

    <RrBottomSheet
      v-model="helpOpen"
      height-mode="fit"
      :height-percent="helpSheetHeightPercent"
      title="Как найти реквизиты"
      subtitle="В приложении вашего банка"
      title-id="pbw-sheet-title"
    >
      <ul class="piw-ways" role="list">
        <li v-for="way in findWays" :key="way.num" class="piw-way">
          <span class="piw-way__num" aria-hidden="true">{{ way.num }}</span>
          <span class="piw-way__text">
            <span class="piw-way__title">{{ way.title }}</span>
          </span>
        </li>
      </ul>

      <template #footer>
        <AuthRRButton label="Понятно" @click="helpOpen = false" />
      </template>
    </RrBottomSheet>

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
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, reactive, ref } from 'vue'
import { useProfileApi, useProfileNavigate } from '../composables/useProfileServices'
import { AuthRRButton, AuthRRField, RrBottomSheet } from 'bibli/shared/ui/rr'
import { parseApiErrorDetail } from 'bibli/widgets/Profile/lib/parseApiError'
import { getBankAccountValidationError } from 'bibli/shared/utils/russianBankAccount'
import {
  BANK_WIZARD_TOTAL,
  bankAccountDigits,
  bankBikDigits,
  bankWizardPath,
  createEmptyBankForm,
  getBankAccountFieldError,
  getBankBikFieldError,
  getBankNameFieldError,
  isBankFieldsValid,
  isBankPhotoValid,
  isBankReadyToSubmit,
  parseBankWizardStep,
} from './lib/bankWizard'
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
  ACCEPT_IMAGE_OR_PDF,
  isAllowedUploadFile,
  isPdfFile,
  isPdfSource,
  uploadRejectMessage,
} from './lib/documentMedia'
import { applyPhotoMetaToForm, EMPTY_PHOTO_PREVIEW_TOKEN } from './lib/profilePhotos'
import {
  rememberPhotosFromResponse,
  seedPhotoSlot,
} from './lib/seedWizardPhotos'
import { clearRememberedProfilePhotos, rememberProfilePhotoKind } from './lib/profilePhotosSnapshot'
import {
  applyBankMapped,
  formatOcrUserHint,
  OCR_LOCAL_SOFT_DEADLINE_MS,
  OCR_SOFT_TIMEOUT_HINT,
  pickMappedForKind,
} from 'bibli/shared/ocr'
import ProfileStepShell from './personal/ProfileStepShell.vue'
import ProfileRrCheckbox from './personal/ProfileRrCheckbox.vue'
import ProfileDocThumb from './personal/ProfileDocThumb.vue'
import ProfilePhotoReviewOverlay from './personal/ProfilePhotoReviewOverlay.vue'
import exampleBank from './assets/activation/bank-examples/example-bank.webp'
import helpCircleIcon from './assets/activation/help-circle-contained.svg'

const api = useProfileApi()
const navigateTo = useProfileNavigate()
const {
  getDocumentUrl,
  getUserData,
  getActivationStatusFresh,
  getPassportData,
  getProfilePhotos,
  peekProfilePhotos,
  uploadProfilePhoto,
  recognizeProfileDocument,
  SubmitPassportData,
} = api


const props = defineProps({
  step: { type: Number, default: 1 },
  helpSheetHeightPercent: { type: Number, default: 90 },
})

const step = computed(() => parseBankWizardStep(props.step))
const busy = ref(false)
const ocrChecking = ref(false)
const formError = ref('')
/** In-flight bank OCR after photo upload. */
let bankOcrPromise = null
/** Bumped on every photo replace so a late OCR from an old file cannot refill inputs. */
let bankOcrGeneration = 0
const ocrUserHint = ref('')
const viewOnly = ref(false)
const stepStatus = ref('')
const stepRejection = ref(null)
seedWizardActivationGate('bank', { stepStatus, viewOnly })
redirectViewOnlyToReviewStep({
  viewOnly: viewOnly.value,
  currentStep: step.value,
  reviewStep: BANK_WIZARD_TOTAL,
  navigateTo,
  pathForStep: bankWizardPath,
})
const isRejectedSection = computed(() => isActivationSectionRejected(stepStatus.value))
const form = reactive(createEmptyBankForm())
const helpOpen = ref(false)
const previewUrl = ref('')
const previewIsPdf = ref(false)
const fileInputRef = ref(null)
const initialLoaded = ref(false)
const bikTouched = ref(false)
const accountTouched = ref(false)
const bankNameTouched = ref(false)

let photoPreviewObjectUrl = null

seedPhotoSlot({
  kind: 'banking_details',
  peekHost: peekProfilePhotos,
  getDocumentUrl,
  localFile: form.photoFile,
  currentPreviewUrl: form.photoPreviewUrl,
  setServerPath: (code) => {
    form.photoServerPath = code
  },
  setPreviewUrl: (url) => {
    form.photoPreviewUrl = url
  },
  setMime: (mime) => {
    form.photoMime = mime
  },
  setIsPdf: (isPdf) => {
    form.photoIsPdf = isPdf
  },
  clearLocalFile: () => {
    form.photoFile = null
  },
})

const findWays = [
  { num: '1', title: 'Откройте приложение банка' },
  { num: '2', title: 'Найдите ваш счёт или карту' },
  { num: '3', title: 'Откройте «Реквизиты» или «Для перевода»' },
  { num: '4', title: 'Сделайте скриншот или сохраните PDF' },
]

const canContinueFields = computed(() => isBankFieldsValid(form))
const canSubmit = computed(() => isBankReadyToSubmit(form))
const hasUploadedPhoto = computed(() => isBankPhotoValid(form))
const bikFieldError = computed(() =>
  getBankBikFieldError(form.bankBik, form.bankAccount, bikTouched.value),
)

const accountFieldError = computed(() =>
  getBankAccountFieldError(form.bankAccount, form.bankBik, accountTouched.value),
)
const bankNameFieldError = computed(() =>
  getBankNameFieldError(form.bankName, bankNameTouched.value),
)

const showStepRejection = computed(
  () => step.value === BANK_WIZARD_TOTAL && !!stepRejection.value,
)

const shellTitle = computed(() => {
  if (viewOnly.value) return reviewShellTitle(stepStatus.value)
  if (step.value === 1) return 'Загрузите банковские реквизиты'
  if (step.value === 2) return 'Введите реквизиты'
  return reviewShellTitle(stepStatus.value)
})

const shellSubtitle = computed(() => {
  if (viewOnly.value) return 'Изменение недоступно'
  if (step.value === 1) {
    if (!initialLoaded.value && !hasUploadedPhoto.value) return ''
    return hasUploadedPhoto.value
      ? 'Файл готов. Нажмите на него, чтобы загрузить заново.'
      : 'Скриншот из приложения банка или PDF'
  }
  if (step.value === 2) return 'Перепишите с загруженного документа'
  return ''
})

const reviewPhotoUrl = computed(() => {
  if (form.photoPreviewUrl) return form.photoPreviewUrl
  if (form.photoServerPath) return getDocumentUrl(form.photoServerPath)
  return ''
})

function apiError(err, fallback) {
  return parseApiErrorDetail(err, fallback) || fallback
}

function goToStep(n, { replace = true } = {}) {
  if (viewOnly.value && parseBankWizardStep(n) !== BANK_WIZARD_TOTAL) return
  formError.value = ''
  const next = parseBankWizardStep(n)
  if (next === step.value) return
  void navigateTo(bankWizardPath(next), replace ? { replace: true } : undefined)
}

function onBack() {
  if (busy.value) return
  if (viewOnly.value || isRejectedSection.value || step.value <= 1) {
    void navigateTo(readActivationReturnPath(), { replace: true })
    return
  }
  if (step.value === 3) form.dataConfirmed = false
  void navigateTo(bankWizardPath(step.value - 1), { replace: true })
}

function syncActivationGate(userRes, activationRes) {
  applyWizardActivationGate(userRes, activationRes, 'bank', {
    stepStatus,
    viewOnly,
    stepRejection,
  })
  redirectViewOnlyToReviewStep({
    viewOnly: viewOnly.value,
    currentStep: step.value,
    reviewStep: BANK_WIZARD_TOTAL,
    navigateTo,
    pathForStep: bankWizardPath,
  })
}

function onBikInput(event) {
  if (viewOnly.value) return
  form.bankBik = bankBikDigits(event.target.value)
}

function onAccountInput(event) {
  if (viewOnly.value) return
  form.bankAccount = bankAccountDigits(event.target.value)
}

function onBankNameInput(event) {
  if (viewOnly.value) return
  form.bankName = String(event.target.value || '')
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
    form.photoIsPdf ||
    isPdfSource(url, form.photoFile, form.photoServerPath, form.photoMime)
  previewUrl.value = url
}

function openFilePicker() {
  fileInputRef.value?.click()
}

function onReplaceFromPreview() {
  if (busy.value || viewOnly.value) return
  closePreview()
  openFilePicker()
}

async function uploadBankFile(file) {
  const localUrl = URL.createObjectURL(file)
  if (photoPreviewObjectUrl) URL.revokeObjectURL(photoPreviewObjectUrl)
  photoPreviewObjectUrl = localUrl
  form.photoFile = file
  form.photoPreviewUrl = localUrl
  form.photoIsPdf = isPdfFile(file)
  form.photoMime = file.type || (isPdfFile(file) ? 'application/pdf' : null)
  const res = await uploadProfilePhoto('banking_details', file)
  const code = res?.data?.code
  if (!code) throw new Error('Сервер не вернул код файла')
  form.photoServerPath = code
  if (res?.data?.mime) {
    form.photoMime = res.data.mime
    form.photoIsPdf = isPdfSource(
      form.photoPreviewUrl,
      form.photoFile,
      code,
      res.data.mime,
    )
  }
  rememberProfilePhotoKind(
    'banking_details',
    res?.data || { kind: 'banking_details', code, url: '', mime: form.photoMime },
  )
  return code
}

function clearBankOcrFields() {
  // Only OCR-filled fields — bankName is always typed by the agent.
  ocrUserHint.value = ''
  form.bankBik = ''
  form.bankAccount = ''
}

async function startBankOcr(photoCode, generation) {
  try {
    const res = await recognizeProfileDocument({
      photo_kind: 'banking_details',
      photo_code: photoCode,
    })
    if (generation !== bankOcrGeneration) return null
    const status = res?.data?.status
    const suggestions = res?.data?.suggestions || {}
    const hint = formatOcrUserHint(res?.data?.hint)
    if (hint) ocrUserHint.value = hint
    if (status === 'done' && suggestions && Object.keys(suggestions).length) {
      ocrUserHint.value = ''
      return suggestions
    }
  } catch {
    /* silent */
  }
  return null
}

function applyOcrSuggestions(suggestions, generation = bankOcrGeneration) {
  if (generation !== bankOcrGeneration) return
  if (!suggestions || typeof suggestions !== 'object') return
  applyBankMapped(form, pickMappedForKind('bank', suggestions))
}

function beginBankOcr(photoCode) {
  bankOcrGeneration += 1
  const generation = bankOcrGeneration
  clearBankOcrFields()
  bankOcrPromise = startBankOcr(photoCode, generation)
  return generation
}

async function enterFormWithOcr() {
  goToStep(2)
  const generation = bankOcrGeneration
  const pending = bankOcrPromise
  if (!pending) return

  ocrChecking.value = true
  try {
    const raced = await Promise.race([
      pending.then((s) => ({ kind: 'ok', suggestions: s })),
      new Promise((resolve) =>
        setTimeout(() => resolve({ kind: 'timeout', suggestions: null }), OCR_LOCAL_SOFT_DEADLINE_MS),
      ),
    ])
    if (generation !== bankOcrGeneration) return
    if (raced.kind === 'ok' && raced.suggestions) {
      applyOcrSuggestions(raced.suggestions, generation)
    } else if (raced.kind === 'timeout' && !ocrUserHint.value) {
      ocrUserHint.value = OCR_SOFT_TIMEOUT_HINT
    }
    // Soft timeout / empty OCR: manual entry only — no late background fill.
  } finally {
    if (generation === bankOcrGeneration) ocrChecking.value = false
  }
}

async function onContinueFromPhoto() {
  if (busy.value || ocrChecking.value || viewOnly.value) return
  if (!isBankPhotoValid(form)) return
  if (!bankOcrPromise && form.photoServerPath) {
    beginBankOcr(form.photoServerPath)
  }
  await enterFormWithOcr()
}

async function onFilePicked(event) {
  const input = event.target
  const file = input?.files?.[0]
  if (input) input.value = ''
  if (!file || busy.value) return
  formError.value = ''

  if (!isAllowedUploadFile(file, 'image-or-pdf')) {
    formError.value = uploadRejectMessage('image-or-pdf')
    return
  }

  busy.value = true
  try {
    const code = await uploadBankFile(file)
    beginBankOcr(code)
    if (!viewOnly.value) {
      await enterFormWithOcr()
    }
  } catch (err) {
    formError.value = apiError(err, 'Не удалось загрузить файл реквизитов')
  } finally {
    busy.value = false
  }
}

function buildPayload() {
  return {
    bank_bik: bankBikDigits(form.bankBik),
    bank_account: bankAccountDigits(form.bankAccount),
    bank_name: form.bankName.trim(),
  }
}

async function submitBankFieldsStep() {
  if (!canContinueFields.value || busy.value) return
  formError.value = ''
  bikTouched.value = true
  accountTouched.value = true
  bankNameTouched.value = true
  if (!isBankPhotoValid(form)) {
    formError.value = 'Загрузите фото банковских реквизитов'
    return
  }
  const fieldError = getBankAccountValidationError(form.bankAccount, form.bankBik)
  if (fieldError) {
    formError.value = fieldError
    return
  }
  if (!form.bankName.trim()) {
    formError.value = 'Укажите название банка'
    return
  }
  busy.value = true
  try {
    await SubmitPassportData(buildPayload())
    form.dataConfirmed = false
    goToStep(3)
  } catch (err) {
    formError.value = apiError(err, 'Не удалось сохранить реквизиты')
  } finally {
    busy.value = false
  }
}

async function submitForReview() {
  if (!canSubmit.value || busy.value) return
  formError.value = ''
  bikTouched.value = true
  accountTouched.value = true
  bankNameTouched.value = true
  if (!isBankPhotoValid(form)) {
    formError.value = 'Загрузите фото банковских реквизитов'
    return
  }
  const fieldError = getBankAccountValidationError(form.bankAccount, form.bankBik)
  if (fieldError) {
    formError.value = fieldError
    return
  }
  if (!form.bankName.trim()) {
    formError.value = 'Укажите название банка'
    return
  }
  if (!form.dataConfirmed) {
    formError.value = 'Подтвердите, что данные верны'
    return
  }
  busy.value = true
  try {
    await SubmitPassportData({
      ...buildPayload(),
      submit_for_review: true,
      confirm_step: 'bank',
    })
    markActivationStep('bank', 'review')
    await navigateTo(activationSubmitExitPath(), { replace: true })
  } catch (err) {
    formError.value = apiError(err, 'Не удалось отправить данные')
  } finally {
    busy.value = false
  }
}

async function loadInitial() {
  try {
    const [data, photosRes, userRes, activationRes] = await Promise.all([
      getPassportData(),
      getProfilePhotos(),
      getUserData(),
      getActivationStatusFresh(),
    ])
    const row = data?.data || data || {}
    const serverBik = bankBikDigits(row.bank_bik || '')
    const serverAccount = bankAccountDigits(row.bank_account || '')
    const serverName = row.bank_name || ''
    if (serverBik) form.bankBik = serverBik
    if (serverAccount) form.bankAccount = serverAccount
    if (serverName) form.bankName = serverName

    const bankPhoto = photosRes?.data?.banking_details
    rememberPhotosFromResponse(photosRes)
    applyPhotoMetaToForm({
      meta: bankPhoto,
      getDocumentUrl,
      localFile: form.photoFile,
      currentPreviewUrl: form.photoPreviewUrl,
      setServerPath: (code) => {
        form.photoServerPath = code
      },
      setPreviewUrl: (url) => {
        form.photoPreviewUrl = url
      },
      setMime: (mime) => {
        form.photoMime = mime
      },
      setIsPdf: (isPdf) => {
        form.photoIsPdf = isPdf
      },
      clearLocalFile: () => {
        form.photoFile = null
        if (photoPreviewObjectUrl) {
          URL.revokeObjectURL(photoPreviewObjectUrl)
          photoPreviewObjectUrl = null
        }
      },
    })

    syncActivationGate(userRes, activationRes)
  } catch (err) {
    formError.value = apiError(err, 'Не удалось загрузить банковские данные')
    console.error('[bank-wizard] load failed', err)
  } finally {
    initialLoaded.value = true
  }
}

function softResetUi() {
  formError.value = ''
  helpOpen.value = false
  busy.value = false
  previewUrl.value = ''
  previewIsPdf.value = false
}

function resetLocalState() {
  softResetUi()
  form.dataConfirmed = false
  if (photoPreviewObjectUrl) {
    URL.revokeObjectURL(photoPreviewObjectUrl)
    photoPreviewObjectUrl = null
  }
  Object.assign(form, createEmptyBankForm())
  initialLoaded.value = false
  clearRememberedProfilePhotos()
}

onMounted(() => {
  void loadInitial()
})

const skipNextActivateReload = ref(true)

onActivated(() => {
  let forceReload = false
  try {
    forceReload = Boolean(
      typeof sessionStorage !== 'undefined' && sessionStorage.getItem('profile-data-cleared-at'),
    )
    if (forceReload) sessionStorage.removeItem('profile-data-cleared-at')
  } catch {
    /* ignore */
  }

  if (skipNextActivateReload.value && !forceReload) {
    skipNextActivateReload.value = false
    return
  }
  skipNextActivateReload.value = false
  if (forceReload) resetLocalState()
  else softResetUi()
  void loadInitial()
})

onDeactivated(() => {
  busy.value = false
})

onBeforeUnmount(() => {
  busy.value = false
  if (photoPreviewObjectUrl) URL.revokeObjectURL(photoPreviewObjectUrl)
})
</script>

<style scoped>
.profile-bank-wizard,
.profile-bank-wizard *,
.profile-bank-wizard *::before,
.profile-bank-wizard *::after {
  box-sizing: border-box;
}

.profile-bank-wizard {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  flex: 1 1 0;
  overflow: hidden;
}

.profile-bank-wizard :deep(.profile-step-shell__footer) {
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

.piw-photo-pending {
  min-height: 220px;
  border-radius: var(--rr-radius-xl);
  background: var(--rr-backgrounds-secondary);
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
  max-width: 160px;
  height: auto;
  border-radius: var(--rr-radius-m);
  object-fit: contain;
  box-shadow: 0 var(--rr-spacing-padding-m) var(--rr-spacing-padding-3-xl) var(--rr-fx-shadow-major);
}

.piw-hero__img--bank {
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
  font-style: normal;
  font-size: var(--rr-font-size-font-size-m);
  line-height: var(--rr-line-height-line-height-m);
  letter-spacing: var(--rr-tracking-tracking-m);
  color: var(--rr-labels-neutral-primary);
  text-align: left;
}

.piw-help-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--rr-spacing-padding-m);
  align-self: center;
  border: none;
  background: none;
  padding: var(--rr-spacing-padding-s) 0;
  color: var(--rr-labels-brand-primary);
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 400;
  font-style: normal;
  font-size: var(--rr-font-size-font-size-m);
  line-height: var(--rr-line-height-line-height-m);
  letter-spacing: var(--rr-tracking-tracking-m);
  cursor: pointer;
}

.piw-help-link--start {
  align-self: flex-start;
  justify-content: flex-start;
}

.piw-help-link__icon {
  display: block;
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.piw-file-input {
  display: none;
}

.piw-review {
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-xl);
}


.piw-ocr-hint {
  margin: var(--rr-spacing-padding-m) 0 0;
  color: var(--rr-labels-secondary);
  font-size: var(--rr-font-size-font-size-s);
  line-height: var(--rr-line-height-line-height-s);
  text-align: center;
}

.piw-error {
  margin: var(--rr-spacing-padding-m) 0 0;
  color: var(--rr-labels-danger-primary);
  font-size: var(--rr-font-size-font-size-s);
  line-height: var(--rr-line-height-line-height-s);
  text-align: center;
}

.piw-ways {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-m);
}

.piw-way {
  display: flex;
  gap: var(--rr-spacing-padding-l);
  align-items: center;
  padding: 14px var(--rr-spacing-padding-l);
  border-radius: var(--rr-radius-xl);
  background: var(--rr-backgrounds-secondary);
}

.piw-way__num {
  flex: 0 0 auto;
  display: inline-grid;
  place-items: center;
  width: var(--rr-size-2-xl);
  height: var(--rr-size-2-xl);
  border-radius: var(--rr-radius-full);
  background: var(--rr-fills-brand-primary);
  color: var(--rr-labels-brand-primary);
  font-size: 19.2px;
  font-weight: 500;
  line-height: 19.2px;
  letter-spacing: -0.4px;
}

.piw-way__text {
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-xs);
  min-width: 0;
}

.piw-way__title {
  font-size: var(--rr-font-size-font-size-m);
  font-weight: 600;
  line-height: var(--rr-line-height-line-height-m);
  letter-spacing: var(--rr-tracking-tracking-m);
  color: var(--rr-labels-neutral-primary);
}

.piw-ocr-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.45);
  padding: 24px;
}

.piw-ocr-overlay__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  min-width: min(280px, 100%);
  padding: 24px 28px;
  border-radius: 16px;
  background: var(--rr-backgrounds-primary, #fff);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
}

.piw-ocr-overlay__spinner {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 3px solid rgba(15, 23, 42, 0.12);
  border-top-color: var(--rr-labels-neutral-primary, #111);
  animation: piw-ocr-spin 0.8s linear infinite;
}

.piw-ocr-overlay__text {
  margin: 0;
  text-align: center;
  font-size: 15px;
  line-height: 1.4;
  color: var(--rr-labels-neutral-primary, #111);
}

@keyframes piw-ocr-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
