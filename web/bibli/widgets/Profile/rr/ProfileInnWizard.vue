<template>
  <div class="profile-inn-wizard">
    <ProfileStepShell
      :class="{ 'profile-step-shell--review-muted': step === INN_WIZARD_TOTAL }"
      :current="step"
      :total="INN_WIZARD_TOTAL"
      :title="shellTitle"
      :subtitle="shellSubtitle"
      :rejection="showStepRejection ? stepRejection : null"
      :hide-progress="viewOnly || isRejectedSection"
      @back="onBack"
    >
      <!-- Step 1: upload document -->
      <div v-if="step === 1" class="piw-stack">
        <template v-if="isInnPhotoValid(form)">
          <ProfileDocThumb
            :src="reviewPhotoUrl"
            alt="Фото свидетельства ИНН"
            :allow-pdf-fallback="true"
            pdf-label="ИНН"
            broken-text="Фото недоступно"
            @click="openPreview(reviewPhotoUrl)"
          />
        </template>
        <template v-else-if="!initialLoaded">
          <div class="piw-photo-pending" aria-busy="true" aria-label="Загрузка документа" />
        </template>
        <template v-else>
          <div class="piw-hero">
            <img
              class="piw-hero__img"
              :src="exampleInn"
              alt="Пример свидетельства ИНН"
            />
          </div>

          <p class="piw-reqs">
            Номер ИНН и ФИО должны хорошо читаться. Печать налоговой видна полностью. Без бликов от вспышки.
          </p>

          <button type="button" class="piw-help-link" @click="helpOpen = true">
            <img
              class="piw-help-link__icon"
              :src="helpCircleIcon"
              alt=""
              width="20"
              height="20"
              aria-hidden="true"
            />
            Не нашли свидетельство
          </button>
        </template>
      </div>

      <!-- Step 2: INN number -->
      <div v-else-if="step === 2" class="piw-stack">
        <AuthRRField label="Номер ИНН" :error="innFieldError">
          <input
            class="auth-rr-input__control auth-rr-input__control--align-left"
            :class="{ 'auth-rr-input__control--error': !!innFieldError }"
            type="text"
            inputmode="numeric"
            placeholder="000000000000"
            maxlength="12"
            :value="form.inn"
            :readonly="viewOnly"
            :aria-invalid="!!innFieldError"
            @input="onInnInput"
            @blur="innTouched = true"
          />
        </AuthRRField>
        <p v-if="ocrUserHint" class="piw-ocr-hint" role="status">{{ ocrUserHint }}</p>
      </div>

      <!-- Step 3: review -->
      <div v-else class="piw-review">
        <ProfileDocThumb
          :src="reviewPhotoUrl"
          alt="Фото свидетельства ИНН"
          :allow-pdf-fallback="true"
          pdf-label="ИНН"
          @click="openPreview(reviewPhotoUrl)"
        />
        <AuthRRField label="Номер ИНН" :error="innFieldError">
          <input
            class="auth-rr-input__control auth-rr-input__control--align-left"
            :class="{ 'auth-rr-input__control--error': !!innFieldError }"
            type="text"
            inputmode="numeric"
            maxlength="12"
            :value="form.inn"
            :readonly="viewOnly"
            :aria-invalid="!!innFieldError"
            @input="onInnInput"
            @blur="innTouched = true"
          />
        </AuthRRField>
      </div>

      <template #footer>
        <template v-if="viewOnly">
          <AuthRRButton label="Назад к профилю" @click="navigateTo('/profile', { replace: true })" />
        </template>
        <template v-else-if="step === 1">
          <AuthRRButton
            v-if="isInnPhotoValid(form)"
            label="Продолжить"
            :loading="busy || ocrChecking"
            @click="onContinueFromPhoto"
          />
          <template v-else-if="initialLoaded">
            <AuthRRButton
              label="Сфотографироваться"
              :loading="busy"
              @click="openCameraCapture"
            />
            <AuthRRButton
              variant="brand-secondary"
              label="Загрузить файл"
              :disabled="busy"
              @click="openFilePicker"
            />
          </template>
        </template>
        <AuthRRButton
          v-else-if="!viewOnly && step === 2"
          label="Продолжить"
          :disabled="!canContinueInn"
          :loading="busy"
          @click="submitInnStep"
        />
        <template v-else-if="!viewOnly">
          <ProfileRrCheckbox
            v-model="form.dataConfirmed"
            label="Данные верны"
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
    <PassportCameraCapture
      v-if="cameraOpen"
      variant="inn"
      :source="captureSource"
      :seed-file="captureSeedFile"
      :saving="busy"
      @close="closeCapture"
      @save="onCameraSave"
      @replace="onCaptureReplace"
    />

    <RrBottomSheet
      v-model="helpOpen"
      height-mode="fit"
      :height-percent="helpSheetHeightPercent"
      title="Как найти свидетельство"
      subtitle="Выберите подходящий способ"
      title-id="piw-sheet-title"
    >
      <ul class="piw-ways" role="list">
        <li v-for="way in findWays" :key="way.title" class="piw-way">
          <span class="piw-way__num" aria-hidden="true">{{ way.num }}</span>
          <span class="piw-way__text">
            <span class="piw-way__title">{{ way.title }}</span>
            <span class="piw-way__desc">{{ way.desc }}</span>
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
      alt="Просмотр фото"
      aria-label="Просмотр фото"
      :show-secondary="!viewOnly"
      :secondary-label="!previewUrl || previewUrl === EMPTY_PHOTO_PREVIEW_TOKEN ? 'Сделать фото' : 'Переснять'"
      :show-file-action="!viewOnly"
      file-action-label="Загрузить"
      primary-label="Готово"
      @close="previewUrl = ''"
      @primary="previewUrl = ''"
      @secondary="onReplaceFromPreview"
      @file="onReuploadFromPreview"
    />
  </div>
</template>

<script setup>
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, reactive, ref, watch } from 'vue'
import { useProfileApi, useProfileNavigate } from '../composables/useProfileServices'
import { AuthRRButton, AuthRRField, RrBottomSheet } from 'bibli/shared/ui/rr'
import { parseApiErrorDetail } from 'bibli/widgets/Profile/lib/parseApiError'
import {
  INN_WIZARD_TOTAL,
  createEmptyInnForm,
  getInnFieldError,
  innDigits,
  innWizardPath,
  isInnPhotoValid,
  isInnReadyToSubmit,
  isInnValid,
  maskInn,
  parseInnWizardStep,
} from './lib/innWizard'
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
  uploadRejectMessage,
} from './lib/documentMedia'
import { applyPhotoMetaToForm, EMPTY_PHOTO_PREVIEW_TOKEN } from './lib/profilePhotos'
import {
  rememberPhotosFromResponse,
  seedPhotoSlot,
} from './lib/seedWizardPhotos'
import { clearRememberedProfilePhotos, rememberProfilePhotoKind } from './lib/profilePhotosSnapshot'
import {
  applyInnMapped,
  formatOcrUserHint,
  OCR_LOCAL_SOFT_DEADLINE_MS,
  OCR_SOFT_TIMEOUT_HINT,
  pickMappedForKind,
} from 'bibli/shared/ocr'
import ProfileStepShell from './personal/ProfileStepShell.vue'
import ProfileRrCheckbox from './personal/ProfileRrCheckbox.vue'
import ProfileDocThumb from './personal/ProfileDocThumb.vue'
import ProfilePhotoReviewOverlay from './personal/ProfilePhotoReviewOverlay.vue'
import PassportCameraCapture from './passport/PassportCameraCapture.vue'
import exampleInn from './assets/activation/inn-examples/example-inn.webp'
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
  /** Высота help-sheet в % экрана (20–100). */
  helpSheetHeightPercent: { type: Number, default: 90 },
})

const step = computed(() => parseInnWizardStep(props.step))
const busy = ref(false)
const ocrChecking = ref(false)
const formError = ref('')
/** In-flight INN OCR after photo upload. */
let innOcrPromise = null
/** Bumped on every photo replace so a late OCR from an old file cannot refill inputs. */
let innOcrGeneration = 0
const ocrUserHint = ref('')
const viewOnly = ref(false)
const stepStatus = ref('')
const stepRejection = ref(null)
seedWizardActivationGate('inn', { stepStatus, viewOnly })
redirectViewOnlyToReviewStep({
  viewOnly: viewOnly.value,
  currentStep: step.value,
  reviewStep: INN_WIZARD_TOTAL,
  navigateTo,
  pathForStep: innWizardPath,
})
const isRejectedSection = computed(() => isActivationSectionRejected(stepStatus.value))
const form = reactive(createEmptyInnForm())
const innTouched = ref(false)
const innFieldError = computed(() => getInnFieldError(form.inn, innTouched.value))
const helpOpen = ref(false)
const cameraOpen = ref(false)
const captureSource = ref('camera')
const captureSeedFile = ref(null)
const previewUrl = ref('')
const fileInputRef = ref(null)
const initialLoaded = ref(false)

let photoPreviewObjectUrl = null

function applyInnPhotoMeta(meta) {
  return applyPhotoMetaToForm({
    meta,
    getDocumentUrl,
    localFile: form.photoFile,
    currentPreviewUrl: form.photoPreviewUrl,
    setServerPath: (code) => {
      form.photoServerPath = code
    },
    setPreviewUrl: (url) => {
      form.photoPreviewUrl = url
    },
    clearLocalFile: () => {
      form.photoFile = null
      if (photoPreviewObjectUrl) {
        URL.revokeObjectURL(photoPreviewObjectUrl)
        photoPreviewObjectUrl = null
      }
    },
  })
}

seedPhotoSlot({
  kind: 'inn',
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
  clearLocalFile: () => {
    form.photoFile = null
  },
})

const findWays = [
  {
    num: '1',
    title: 'Бумажное свидетельство',
    desc: 'Жёлтый лист А4 с печатью налоговой. Выдают при первом получении ИНН.',
  },
  {
    num: '2',
    title: 'Скачать в nalog.ru',
    desc: 'Профиль → Документы → Скачать свидетельство ИНН',
  },
  {
    num: '3',
    title: 'В приложении Госуслуги',
    desc: 'Документы → Налоги → Свидетельство ИНН',
  },
]

const canContinueInn = computed(() => isInnValid(form))
const canSubmit = computed(() => isInnReadyToSubmit(form))

const showStepRejection = computed(
  () => step.value === INN_WIZARD_TOTAL && !!stepRejection.value,
)

const shellTitle = computed(() => {
  if (viewOnly.value) return reviewShellTitle(stepStatus.value)
  if (step.value === 1) return 'Загрузите документ ИНН'
  if (step.value === 2) return 'Введите номер ИНН'
  return reviewShellTitle(stepStatus.value)
})

const shellSubtitle = computed(() => {
  if (viewOnly.value) return 'Изменение недоступно'
  if (step.value === 1) {
    if (!initialLoaded.value && !isInnPhotoValid(form)) return ''
    return isInnPhotoValid(form)
      ? 'Фото готово. Нажмите на него, чтобы заменить.'
      : 'Или скриншот из личного кабинета на nalog.ru'
  }
  if (step.value === 2) return '12 цифр из свидетельства'
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
  if (viewOnly.value && parseInnWizardStep(n) !== INN_WIZARD_TOTAL) return
  formError.value = ''
  const next = parseInnWizardStep(n)
  if (next === step.value) return
  void navigateTo(innWizardPath(next), replace ? { replace: true } : undefined)
}

function onBack() {
  if (busy.value) return
  if (viewOnly.value || isRejectedSection.value || step.value <= 1) {
    void navigateTo(readActivationReturnPath(), { replace: true })
    return
  }
  void navigateTo(innWizardPath(step.value - 1), { replace: true })
}

function syncActivationGate(userRes, activationRes) {
  applyWizardActivationGate(userRes, activationRes, 'inn', {
    stepStatus,
    viewOnly,
    stepRejection,
  })
  redirectViewOnlyToReviewStep({
    viewOnly: viewOnly.value,
    currentStep: step.value,
    reviewStep: INN_WIZARD_TOTAL,
    navigateTo,
    pathForStep: innWizardPath,
  })
}

function onInnInput(event) {
  if (viewOnly.value) return
  form.inn = maskInn(event.target.value)
}

function openPreview(url) {
  if (viewOnly.value && !url) return
  previewUrl.value = url || EMPTY_PHOTO_PREVIEW_TOKEN
}

function openFilePicker() {
  fileInputRef.value?.click()
}

function closeCapture({ force = false } = {}) {
  // Во время upload busy=true — без force камера не закрывалась после «Сохранить».
  if (busy.value && !force) return
  cameraOpen.value = false
  captureSeedFile.value = null
  captureSource.value = 'camera'
}

function openCameraCapture() {
  formError.value = ''
  captureSource.value = 'camera'
  captureSeedFile.value = null
  cameraOpen.value = true
}

function onReplaceFromPreview() {
  previewUrl.value = ''
  openCameraCapture()
}

function onReuploadFromPreview() {
  previewUrl.value = ''
  openFilePicker()
}

function onCaptureReplace() {
  formError.value = ''
  openFilePicker()
}

async function uploadInnFile(file) {
  const localUrl = URL.createObjectURL(file)
  if (photoPreviewObjectUrl) URL.revokeObjectURL(photoPreviewObjectUrl)
  photoPreviewObjectUrl = localUrl
  form.photoFile = file
  form.photoPreviewUrl = localUrl
  const res = await uploadProfilePhoto('inn', file)
  const code = res?.data?.code
  if (!code) throw new Error('Сервер не вернул код файла')
  form.photoServerPath = code
  rememberProfilePhotoKind('inn', res?.data || { kind: 'inn', code, url: '' })
  return code
}

function clearInnOcrFields() {
  form.inn = ''
  innTouched.value = false
  ocrUserHint.value = ''
}

async function startInnOcr(photoCode, generation) {
  try {
    const res = await recognizeProfileDocument({
      photo_kind: 'inn',
      photo_code: photoCode,
    })
    if (generation !== innOcrGeneration) return null
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

function applyOcrSuggestions(suggestions, generation = innOcrGeneration) {
  if (generation !== innOcrGeneration) return
  if (!suggestions || typeof suggestions !== 'object') return
  applyInnMapped(form, pickMappedForKind('inn', suggestions))
}

function beginInnOcr(photoCode) {
  innOcrGeneration += 1
  const generation = innOcrGeneration
  clearInnOcrFields()
  innOcrPromise = startInnOcr(photoCode, generation)
  return generation
}

async function enterFormWithOcr() {
  goToStep(2)
  const generation = innOcrGeneration
  const pending = innOcrPromise
  if (!pending) return

  ocrChecking.value = true
  try {
    const raced = await Promise.race([
      pending.then((s) => ({ kind: 'ok', suggestions: s })),
      new Promise((resolve) =>
        setTimeout(() => resolve({ kind: 'timeout', suggestions: null }), OCR_LOCAL_SOFT_DEADLINE_MS),
      ),
    ])
    if (generation !== innOcrGeneration) return
    if (raced.kind === 'ok' && raced.suggestions) {
      applyOcrSuggestions(raced.suggestions, generation)
    } else if (raced.kind === 'timeout' && !ocrUserHint.value) {
      ocrUserHint.value = OCR_SOFT_TIMEOUT_HINT
    }
    // Soft timeout / empty OCR: manual entry only — no late background fill.
  } finally {
    if (generation === innOcrGeneration) ocrChecking.value = false
  }
}

async function onContinueFromPhoto() {
  if (busy.value || ocrChecking.value || viewOnly.value) return
  if (!isInnPhotoValid(form)) return
  if (!innOcrPromise && form.photoServerPath) {
    beginInnOcr(form.photoServerPath)
  }
  await enterFormWithOcr()
}

async function onCameraSave({ file }) {
  if (!file || busy.value) return
  formError.value = ''
  busy.value = true
  try {
    const code = await uploadInnFile(file)
    closeCapture({ force: true })
    beginInnOcr(code)
    if (!viewOnly.value) {
      await enterFormWithOcr()
    }
  } catch (err) {
    formError.value = apiError(err, 'Не удалось загрузить фото ИНН')
  } finally {
    busy.value = false
  }
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

  // Digital FNS PDF — upload as-is (text layer parsed on OCR side). Photos still
  // go through the camera/crop sheet.
  if (isPdfFile(file)) {
    busy.value = true
    try {
      const code = await uploadInnFile(file)
      beginInnOcr(code)
      if (!viewOnly.value) {
        await enterFormWithOcr()
      }
    } catch (err) {
      formError.value = apiError(err, 'Не удалось загрузить PDF ИНН')
    } finally {
      busy.value = false
    }
    return
  }

  captureSource.value = 'file'
  captureSeedFile.value = file
  cameraOpen.value = true
}

function buildPayload() {
  // Only INN — do not resend birthday/passport. OCR dates on the certificate
  // are «постановка на учёт», not birth, and PersonalDatesValidator rejects them.
  return {
    inn: innDigits(form.inn),
  }
}

async function submitInnStep() {
  if (!canContinueInn.value || busy.value) return
  formError.value = ''
  busy.value = true
  try {
    await SubmitPassportData(buildPayload())
    goToStep(3)
  } catch (err) {
    formError.value = apiError(err, 'Не удалось сохранить номер ИНН')
  } finally {
    busy.value = false
  }
}

async function submitForReview() {
  if (!canSubmit.value || busy.value) return
  formError.value = ''
  if (!isInnPhotoValid(form)) {
    formError.value = 'Загрузите фото свидетельства ИНН'
    return
  }
  if (!isInnValid(form)) {
    formError.value = 'Укажите 12 цифр ИНН'
    return
  }
  busy.value = true
  try {
    await SubmitPassportData({
      ...buildPayload(),
      submit_for_review: true,
      confirm_step: 'inn',
    })
    markActivationStep('inn', 'review')
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
    const serverInn = maskInn(row.inn || '')
    if (serverInn) form.inn = serverInn
    if (row.passport) form.passport = row.passport
    if (row.passport_issued) form.passportIssued = row.passport_issued
    if (row.passport_date) form.passportDate = row.passport_date
    if (row.passport_code) form.passportCode = row.passport_code
    if (row.birthday) form.birthday = row.birthday
    if (row.birthday_place) form.birthdayPlace = row.birthday_place
    if (row.registration_address) form.registrationAddress = row.registration_address
    if (row.bank_account) form.bankAccount = row.bank_account
    if (row.bank_bik) form.bankBik = row.bank_bik
    if (row.bank_name) form.bankName = row.bank_name

    const innPhoto = photosRes?.data?.inn
    rememberPhotosFromResponse(photosRes)
    applyInnPhotoMeta(innPhoto)

    syncActivationGate(userRes, activationRes)
  } catch (err) {
    formError.value = apiError(err, 'Не удалось загрузить данные ИНН')
    console.error('[inn-wizard] load failed', err)
  } finally {
    initialLoaded.value = true
  }
}

function softResetUi() {
  formError.value = ''
  helpOpen.value = false
  busy.value = false
  closeCapture({ force: true })
  previewUrl.value = ''
}

function resetLocalState() {
  softResetUi()
  form.dataConfirmed = false
  if (photoPreviewObjectUrl) {
    URL.revokeObjectURL(photoPreviewObjectUrl)
    photoPreviewObjectUrl = null
  }
  Object.assign(form, createEmptyInnForm())
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
  closeCapture({ force: true })
})

onBeforeUnmount(() => {
  busy.value = false
  closeCapture({ force: true })
  if (photoPreviewObjectUrl) URL.revokeObjectURL(photoPreviewObjectUrl)
})
</script>

<style scoped>
.profile-inn-wizard,
.profile-inn-wizard *,
.profile-inn-wizard *::before,
.profile-inn-wizard *::after {
  box-sizing: border-box;
}

.profile-inn-wizard {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  flex: 1 1 0;
  overflow: hidden;
}

.profile-inn-wizard :deep(.profile-step-shell__footer) {
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

.piw-hero__img {
  display: block;
  width: 100%;
  max-width: 160px;
  height: auto;
  border-radius: var(--rr-radius-m);
  object-fit: contain;
  box-shadow: 0 var(--rr-spacing-padding-m) var(--rr-spacing-padding-3-xl) var(--rr-fx-shadow-major);
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
  justify-content: flex-start;
  gap: var(--rr-spacing-padding-m);
  align-self: flex-start;
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
  align-items: flex-start;
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

.piw-way__desc {
  font-size: var(--rr-font-size-font-size-xs);
  font-weight: 400;
  line-height: var(--rr-line-height-line-height-xs);
  letter-spacing: var(--rr-tracking-tracking-s);
  color: var(--rr-labels-neutral-secondary);
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
