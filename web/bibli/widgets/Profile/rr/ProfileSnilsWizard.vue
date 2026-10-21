<template>
  <div class="profile-snils-wizard">
    <ProfileStepShell
      :class="{ 'profile-step-shell--review-muted': step === SNILS_WIZARD_TOTAL }"
      :current="step"
      :total="SNILS_WIZARD_TOTAL"
      :title="shellTitle"
      :subtitle="shellSubtitle"
      :rejection="showStepRejection ? stepRejection : null"
      :hide-progress="viewOnly || isRejectedSection"
      @back="onBack"
    >
      <!-- Step 1: upload document -->
      <div v-if="step === 1" class="piw-stack">
        <template v-if="hasUploadedPhoto">
          <ProfileDocThumb
            :src="reviewPhotoUrl"
            alt="Фото СНИЛС"
            :allow-pdf-fallback="false"
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
              class="piw-hero__img piw-hero__img--snils"
              :src="exampleSnils"
              alt="Пример документа СНИЛС"
            />
          </div>

          <p class="piw-reqs">
            ФИО и номер СНИЛС должны хорошо читаться. Документ должен быть полностью в кадре, без бликов и теней
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
            Где найти СНИЛС
          </button>
        </template>
      </div>

      <!-- Step 2: SNILS number -->
      <div v-else-if="step === 2" class="piw-stack">
        <AuthRRField label="Номер СНИЛС" :error="snilsFieldError">
          <input
            class="auth-rr-input__control auth-rr-input__control--align-left"
            :class="{ 'auth-rr-input__control--error': !!snilsFieldError }"
            type="text"
            inputmode="numeric"
            placeholder="12345678900"
            maxlength="11"
            :value="form.snils"
            :readonly="viewOnly"
            :aria-invalid="!!snilsFieldError"
            @input="onSnilsInput"
            @blur="snilsTouched = true"
          />
        </AuthRRField>
        <p v-if="ocrUserHint" class="piw-ocr-hint" role="status">{{ ocrUserHint }}</p>
      </div>

      <!-- Step 3: review -->
      <div v-else class="piw-review">
        <ProfileDocThumb
          :src="reviewPhotoUrl"
          alt="Фото СНИЛС"
          :allow-pdf-fallback="false"
          @click="openPreview(reviewPhotoUrl)"
        />

        <AuthRRField label="Номер СНИЛС" :error="snilsFieldError">
          <input
            class="auth-rr-input__control auth-rr-input__control--align-left"
            :class="{ 'auth-rr-input__control--error': !!snilsFieldError }"
            type="text"
            inputmode="numeric"
            maxlength="11"
            :value="form.snils"
            :readonly="viewOnly"
            :aria-invalid="!!snilsFieldError"
            @input="onSnilsInput"
            @blur="snilsTouched = true"
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
          <template v-else-if="initialLoaded">
            <AuthRRButton
              label="Сфотографироваться"
              :loading="busy"
              @click="openCameraCapture"
            />
            <AuthRRButton
              variant="brand-secondary"
              label="Загрузить фото"
              :disabled="busy"
              @click="openFilePicker"
            />
          </template>
        </template>
        <AuthRRButton
          v-else-if="!viewOnly && step === 2"
          label="Продолжить"
          :disabled="!canContinueSnils"
          :loading="busy"
          @click="submitSnilsStep"
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
      :accept="ACCEPT_IMAGE"
      @change="onFilePicked"
    />

    <PassportCameraCapture
      v-if="cameraOpen"
      variant="snils"
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
      title="Где найти СНИЛС"
      subtitle="Проверьте, хорошо ли все видно"
      title-id="psw-sheet-title"
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
  SNILS_WIZARD_TOTAL,
  createEmptySnilsForm,
  getSnilsFieldError,
  snilsDigits,
  snilsWizardPath,
  isSnilsPhotoValid,
  isSnilsReadyToSubmit,
  isSnilsValid,
  maskSnils,
  parseSnilsWizardStep,
} from './lib/snilsWizard'
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
  ACCEPT_IMAGE,
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
  applySnilsMapped,
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
import exampleSnils from './assets/activation/snils-examples/example-snils.webp'
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

const step = computed(() => parseSnilsWizardStep(props.step))
const busy = ref(false)
const ocrChecking = ref(false)
const formError = ref('')
/** In-flight SNILS OCR after photo upload. */
let snilsOcrPromise = null
/** Bumped on every photo replace so a late OCR from an old file cannot refill inputs. */
let snilsOcrGeneration = 0
const ocrUserHint = ref('')
const viewOnly = ref(false)
const stepStatus = ref('')
const stepRejection = ref(null)
seedWizardActivationGate('snils', { stepStatus, viewOnly })
redirectViewOnlyToReviewStep({
  viewOnly: viewOnly.value,
  currentStep: step.value,
  reviewStep: SNILS_WIZARD_TOTAL,
  navigateTo,
  pathForStep: snilsWizardPath,
})
const isRejectedSection = computed(() => isActivationSectionRejected(stepStatus.value))
const form = reactive(createEmptySnilsForm())
const snilsTouched = ref(false)
const snilsFieldError = computed(() => getSnilsFieldError(form.snils, snilsTouched.value))
const helpOpen = ref(false)
const cameraOpen = ref(false)
const captureSource = ref('camera')
const captureSeedFile = ref(null)
const previewUrl = ref('')
const fileInputRef = ref(null)
const initialLoaded = ref(false)

let photoPreviewObjectUrl = null

seedPhotoSlot({
  kind: 'snils',
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
    title: 'Зелёная карточка СНИЛС',
    desc: 'Если она сохранилась, сделайте фото лицевой стороны целиком',
  },
  {
    num: '2',
    title: 'Скачать на сайте СФР',
    desc: 'Личный кабинет →\u00A0Получить дубликат СНИЛС →\u00A0Скачать уведомление АДИ-РЕГ',
  },
  {
    num: '3',
    title: 'В приложении Госуслуги',
    desc: 'Профиль →\u00A0Документы →\u00A0Личные документы →\u00A0СНИЛС',
  },
]

const canContinueSnils = computed(() => isSnilsValid(form))
const canSubmit = computed(() => isSnilsReadyToSubmit(form))
const hasUploadedPhoto = computed(() => isSnilsPhotoValid(form))

const showStepRejection = computed(
  () => step.value === SNILS_WIZARD_TOTAL && !!stepRejection.value,
)

const shellTitle = computed(() => {
  if (viewOnly.value) return reviewShellTitle(stepStatus.value)
  if (step.value === 1) return 'Загрузите документ СНИЛС'
  if (step.value === 2) return 'Введите номер СНИЛС'
  return reviewShellTitle(stepStatus.value)
})

const shellSubtitle = computed(() => {
  if (viewOnly.value) return 'Изменение недоступно'
  if (step.value === 1) {
    if (!initialLoaded.value && !hasUploadedPhoto.value) return ''
    return hasUploadedPhoto.value
      ? 'Фото готово. Нажмите на него, чтобы заменить.'
      : 'Сфотографируйте или загрузите фото документа'
  }
  if (step.value === 2) return '11 цифр из свидетельства'
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
  if (viewOnly.value && parseSnilsWizardStep(n) !== SNILS_WIZARD_TOTAL) return
  formError.value = ''
  const next = parseSnilsWizardStep(n)
  if (next === step.value) return
  void navigateTo(snilsWizardPath(next), replace ? { replace: true } : undefined)
}

function onBack() {
  if (busy.value) return
  if (viewOnly.value || isRejectedSection.value || step.value <= 1) {
    void navigateTo(readActivationReturnPath(), { replace: true })
    return
  }
  void navigateTo(snilsWizardPath(step.value - 1), { replace: true })
}

function syncActivationGate(userRes, activationRes) {
  applyWizardActivationGate(userRes, activationRes, 'snils', {
    stepStatus,
    viewOnly,
    stepRejection,
  })
  redirectViewOnlyToReviewStep({
    viewOnly: viewOnly.value,
    currentStep: step.value,
    reviewStep: SNILS_WIZARD_TOTAL,
    navigateTo,
    pathForStep: snilsWizardPath,
  })
}

function onSnilsInput(event) {
  if (viewOnly.value) return
  form.snils = maskSnils(event.target.value)
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

async function uploadSnilsFile(file) {
  const localUrl = URL.createObjectURL(file)
  if (photoPreviewObjectUrl) URL.revokeObjectURL(photoPreviewObjectUrl)
  photoPreviewObjectUrl = localUrl
  form.photoFile = file
  form.photoPreviewUrl = localUrl
  const res = await uploadProfilePhoto('snils', file)
  const code = res?.data?.code
  if (!code) throw new Error('Сервер не вернул код файла')
  form.photoServerPath = code
  rememberProfilePhotoKind('snils', res?.data || { kind: 'snils', code, url: '' })
  return code
}

function clearSnilsOcrFields() {
  form.snils = ''
  snilsTouched.value = false
  ocrUserHint.value = ''
}

async function startSnilsOcr(photoCode, generation) {
  try {
    const res = await recognizeProfileDocument({
      photo_kind: 'snils',
      photo_code: photoCode,
    })
    if (generation !== snilsOcrGeneration) return null
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

function applyOcrSuggestions(suggestions, generation = snilsOcrGeneration) {
  if (generation !== snilsOcrGeneration) return
  if (!suggestions || typeof suggestions !== 'object') return
  applySnilsMapped(form, pickMappedForKind('snils', suggestions))
}

function beginSnilsOcr(photoCode) {
  snilsOcrGeneration += 1
  const generation = snilsOcrGeneration
  clearSnilsOcrFields()
  snilsOcrPromise = startSnilsOcr(photoCode, generation)
  return generation
}

async function enterFormWithOcr() {
  goToStep(2)
  const generation = snilsOcrGeneration
  const pending = snilsOcrPromise
  if (!pending) return

  ocrChecking.value = true
  try {
    const raced = await Promise.race([
      pending.then((s) => ({ kind: 'ok', suggestions: s })),
      new Promise((resolve) =>
        setTimeout(() => resolve({ kind: 'timeout', suggestions: null }), OCR_LOCAL_SOFT_DEADLINE_MS),
      ),
    ])
    if (generation !== snilsOcrGeneration) return
    if (raced.kind === 'ok' && raced.suggestions) {
      applyOcrSuggestions(raced.suggestions, generation)
    } else if (raced.kind === 'timeout' && !ocrUserHint.value) {
      ocrUserHint.value = OCR_SOFT_TIMEOUT_HINT
    }
    // Soft timeout / empty OCR: manual entry only — no late background fill.
  } finally {
    if (generation === snilsOcrGeneration) ocrChecking.value = false
  }
}

async function onContinueFromPhoto() {
  if (busy.value || ocrChecking.value || viewOnly.value) return
  if (!isSnilsPhotoValid(form)) return
  if (!snilsOcrPromise && form.photoServerPath) {
    beginSnilsOcr(form.photoServerPath)
  }
  await enterFormWithOcr()
}

async function onCameraSave({ file }) {
  if (!file || busy.value) return
  formError.value = ''
  busy.value = true
  try {
    const code = await uploadSnilsFile(file)
    closeCapture({ force: true })
    beginSnilsOcr(code)
    if (!viewOnly.value) {
      await enterFormWithOcr()
    }
  } catch (err) {
    formError.value = apiError(err, 'Не удалось загрузить фото СНИЛС')
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
  // iOS «Обзор» может отдать PDF даже при accept=image — режем явно
  if (isPdfFile(file) || !isAllowedUploadFile(file, 'image')) {
    formError.value = uploadRejectMessage('image')
    return
  }
  captureSource.value = 'file'
  captureSeedFile.value = file
  cameraOpen.value = true
}

function buildPayload() {
  // Only SNILS — do not resend birthday/passport. OCR extras on the certificate
  // must not overwrite personal data or trip PersonalDatesValidator.
  return {
    snils: snilsDigits(form.snils),
  }
}

async function submitSnilsStep() {
  if (!canContinueSnils.value || busy.value) return
  formError.value = ''
  busy.value = true
  try {
    await SubmitPassportData(buildPayload())
    goToStep(3)
  } catch (err) {
    formError.value = apiError(err, 'Не удалось сохранить номер СНИЛС')
  } finally {
    busy.value = false
  }
}

async function submitForReview() {
  if (!canSubmit.value || busy.value) return
  formError.value = ''
  if (!isSnilsPhotoValid(form)) {
    formError.value = 'Загрузите фото документа СНИЛС'
    return
  }
  if (!isSnilsValid(form)) {
    formError.value = 'Укажите 11 цифр СНИЛС'
    return
  }
  busy.value = true
  try {
    await SubmitPassportData({
      ...buildPayload(),
      submit_for_review: true,
      confirm_step: 'snils',
    })
    markActivationStep('snils', 'review')
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
    const serverSnils = maskSnils(row.snils || '')
    if (serverSnils) form.snils = serverSnils
    if (row.passport) form.passport = row.passport
    if (row.passport_issued) form.passportIssued = row.passport_issued
    if (row.passport_date) form.passportDate = row.passport_date
    if (row.passport_code) form.passportCode = row.passport_code
    if (row.birthday) form.birthday = row.birthday
    if (row.birthday_place) form.birthdayPlace = row.birthday_place
    if (row.registration_address) form.registrationAddress = row.registration_address
    if (row.inn) form.inn = row.inn
    if (row.bank_account) form.bankAccount = row.bank_account
    if (row.bank_bik) form.bankBik = row.bank_bik
    if (row.bank_name) form.bankName = row.bank_name

    const snilsPhoto = photosRes?.data?.snils
    rememberPhotosFromResponse(photosRes)
    applyPhotoMetaToForm({
      meta: snilsPhoto,
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

    syncActivationGate(userRes, activationRes)
  } catch (err) {
    formError.value = apiError(err, 'Не удалось загрузить данные СНИЛС')
    console.error('[snils-wizard] load failed', err)
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
  Object.assign(form, createEmptySnilsForm())
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
.profile-snils-wizard,
.profile-snils-wizard *,
.profile-snils-wizard *::before,
.profile-snils-wizard *::after {
  box-sizing: border-box;
}

.profile-snils-wizard {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  flex: 1 1 0;
  overflow: hidden;
}

.profile-snils-wizard :deep(.profile-step-shell__footer) {
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

.piw-hero__img--snils {
  max-width: 100%;
  box-shadow: none;
  border-radius: 0;
}

.piw-reqs {
  margin: 0;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 400;
  font-style: normal;
  font-size: var(--rr-font-size-font-size-m, 16px);
  line-height: var(--rr-line-height-line-height-m, 24px);
  letter-spacing: var(--rr-tracking-tracking-m, 0);
  color: var(--rr-labels-neutral-primary, #101012);
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
