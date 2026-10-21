<template>
  <div class="profile-passport-wizard">
    <ProfileStepShell
      :class="{ 'profile-step-shell--review-muted': step === PASSPORT_WIZARD_TOTAL }"
      :current="step"
      :total="PASSPORT_WIZARD_TOTAL"
      :title="shellTitle"
      :subtitle="shellSubtitle"
      :rejection="showStepRejection ? stepRejection : null"
      :step-text="step === 4 ? '4 из 4' : ''"
      :hide-progress="viewOnly || isRejectedSection"
      @back="onBack"
    >
      <!-- Step 1: main passport photo -->
      <div v-if="step === 1" class="ppw-stack">
        <template v-if="isMainPhotoValid(form)">
          <ProfileDocThumb
            :src="reviewDocs[0].url"
            alt="Главная страница паспорта"
            :allow-pdf-fallback="false"
            broken-text="Фото недоступно"
            @click="openPreview(reviewDocs[0])"
          />
        </template>
        <template v-else-if="!initialLoaded">
          <div class="ppw-photo-pending" aria-busy="true" aria-label="Загрузка документа" />
        </template>
        <template v-else>
          <div class="ppass-hero">
            <img
              class="ppass-hero__img"
              :src="exampleMain"
              alt="Пример фото главной страницы паспорта"
            />
          </div>
          <div class="ppass-tips">
            <h2 class="ppass-tips__title">Советы</h2>
            <div class="ppass-tips__grid">
              <div v-for="tip in photoTips" :key="tip.label" class="ppass-tip">
                <span class="ppass-tip__icon" aria-hidden="true">
                  <img :src="tip.icon" alt="" width="16" height="16" />
                </span>
                <span class="ppass-tip__text">{{ tip.label }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Step 2: registration page photo -->
      <div v-else-if="step === 2" class="ppw-stack">
        <template v-if="isRegPhotoValid(form)">
          <ProfileDocThumb
            :src="reviewDocs[1].url"
            alt="Страница регистрации"
            :allow-pdf-fallback="false"
            broken-text="Фото недоступно"
            @click="openPreview(reviewDocs[1])"
          />
        </template>
        <template v-else-if="!initialLoaded">
          <div class="ppw-photo-pending" aria-busy="true" aria-label="Загрузка документа" />
        </template>
        <template v-else>
          <div class="ppass-hero">
            <img
              class="ppass-hero__img ppass-hero__img--reg"
              :src="exampleReg"
              alt="Пример фото страницы регистрации"
            />
          </div>
          <div class="ppass-tips">
            <h2 class="ppass-tips__title">Советы</h2>
            <div class="ppass-tips__grid">
              <div v-for="tip in regTips" :key="tip.label" class="ppass-tip">
                <span class="ppass-tip__icon" aria-hidden="true">
                  <img :src="tip.icon" alt="" width="16" height="16" />
                </span>
                <span class="ppass-tip__text">{{ tip.label }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Step 3: form -->
      <div v-else-if="step === 3" class="ppw-stack ppass-form">
        <p v-if="ocrUserHint" class="ppass-ocr-hint" role="status">{{ ocrUserHint }}</p>
        <AuthRRField label="Серия и номер" :error="passportNumberFieldError">
          <input
            class="auth-rr-input__control auth-rr-input__control--align-left"
            :class="{ 'auth-rr-input__control--error': !!passportNumberFieldError }"
            type="text"
            inputmode="numeric"
            placeholder="0000 000000"
            maxlength="11"
            :value="form.passport"
            :aria-invalid="!!passportNumberFieldError"
            @input="onPassportInput"
            @blur="passportNumberTouched = true"
          />
        </AuthRRField>

        <div class="ppass-row">
          <AuthRRField label="Дата выдачи" :error="passportDateFieldError">
            <input
              class="auth-rr-input__control auth-rr-input__control--align-left"
              :class="{ 'auth-rr-input__control--error': !!passportDateFieldError }"
              type="text"
              inputmode="numeric"
              placeholder="ДД.ММ.ГГГГ"
              maxlength="10"
              :value="form.passportDate"
              :aria-invalid="!!passportDateFieldError"
              @input="onPassportDateInput"
              @blur="passportDateTouched = true"
            />
          </AuthRRField>
          <AuthRRField label="Код подразделения" :error="passportCodeFieldError">
            <input
              class="auth-rr-input__control auth-rr-input__control--align-left"
              :class="{ 'auth-rr-input__control--error': !!passportCodeFieldError }"
              type="text"
              inputmode="numeric"
              placeholder="000-000"
              maxlength="7"
              :value="form.passportCode"
              :aria-invalid="!!passportCodeFieldError"
              @input="onPassportCodeInput"
              @blur="passportCodeTouched = true"
            />
          </AuthRRField>
        </div>

        <AuthRRField label="Кем выдан" :error="passportIssuedFieldError">
          <div class="ppass-issued">
            <select
              v-if="!form.issuedManual && !isCompact"
              v-model="form.passportIssued"
              class="auth-rr-input__control auth-rr-input__control--align-left ppass-select"
              :class="{ 'auth-rr-input__control--error': !!passportIssuedFieldError }"
              :aria-invalid="!!passportIssuedFieldError"
              @blur="passportIssuedTouched = true"
            >
              <option disabled value="">Выберите вариант</option>
              <option v-for="name in issuedOptions" :key="name" :value="name">
                {{ name }}
              </option>
            </select>
            <button
              v-else-if="!form.issuedManual"
              type="button"
              class="auth-rr-input__control auth-rr-input__control--align-left ppass-select ppass-select-trigger"
              :class="{
                'auth-rr-input__control--error': !!passportIssuedFieldError,
                'ppass-select-trigger--placeholder': !form.passportIssued,
              }"
              :aria-invalid="!!passportIssuedFieldError"
              :aria-expanded="issuedSheetOpen ? 'true' : 'false'"
              @click="issuedSheetOpen = true"
            >
              {{ form.passportIssued || 'Выберите вариант' }}
            </button>
            <input
              v-else
              v-model="form.passportIssued"
              class="auth-rr-input__control auth-rr-input__control--align-left"
              :class="{ 'auth-rr-input__control--error': !!passportIssuedFieldError }"
              type="text"
              placeholder="Кем выдан"
              autocomplete="off"
              :aria-invalid="!!passportIssuedFieldError"
              @blur="passportIssuedTouched = true"
            />
          </div>
        </AuthRRField>

        <ProfileRrCheckbox v-model="form.issuedManual" label="Моего варианта нет" />

        <AuthRRField label="Место рождения" :error="birthdayPlaceFieldError">
          <ProfileAddressSuggest
            v-model="form.birthdayPlace"
            mode="city"
            placeholder="Место рождения"
            sheet-title="Место рождения"
            search-placeholder="Поиск города"
            autocomplete="off"
            :error="!!birthdayPlaceFieldError"
            @blur="birthdayPlaceTouched = true"
          />
        </AuthRRField>

        <AuthRRField label="Адрес регистрации" :error="registrationFieldError">
          <ProfileAddressSuggest
            v-model="form.registrationAddress"
            mode="address"
            placeholder="Адрес регистрации"
            sheet-title="Адрес регистрации"
            search-placeholder="Поиск адреса"
            autocomplete="street-address"
            :error="!!registrationFieldError"
            @blur="registrationTouched = true"
          />
        </AuthRRField>

        <ProfileRrCheckbox
          v-model="form.sameAsResidence"
          label="Адрес регистрации совпадает с проживанием"
        />

        <AuthRRField
          v-if="!form.sameAsResidence"
          label="Адрес фактического проживания"
          :error="residenceFieldError"
        >
          <ProfileAddressSuggest
            v-model="form.residenceAddress"
            mode="address"
            placeholder="Адрес фактического проживания"
            sheet-title="Адрес проживания"
            search-placeholder="Поиск адреса"
            autocomplete="street-address"
            :error="!!residenceFieldError"
            @blur="residenceTouched = true"
          />
        </AuthRRField>
      </div>

      <!-- Step 4: review -->
      <div v-else class="ppass-review">
        <section class="ppass-card">
          <header class="ppass-card__head">
            <h2>Фото документов</h2>
          </header>
          <div class="ppass-docs">
            <ProfileDocThumb
              v-for="doc in reviewDocs"
              :key="doc.key"
              fill
              :src="doc.url"
              :alt="doc.label"
              empty-text="Добавить фото"
              :allow-pdf-fallback="false"
              @click="openPreview(doc)"
            />
          </div>
        </section>

        <section class="ppass-card">
          <header class="ppass-card__head">
            <h2>Паспорт РФ</h2>
            <button
              v-if="!viewOnly"
              type="button"
              class="ppass-link"
              @click="goToStep(3)"
            >
              Изменить
            </button>
          </header>
          <div class="ppw-stack">
            <AuthRRField label="Серия и номер">
              <input class="auth-rr-input__control auth-rr-input__control--align-left" :value="form.passport" readonly />
            </AuthRRField>
            <div class="ppass-row">
              <AuthRRField label="Дата выдачи">
                <input class="auth-rr-input__control auth-rr-input__control--align-left" :value="form.passportDate" readonly />
              </AuthRRField>
              <AuthRRField label="Код подразделения">
                <input class="auth-rr-input__control auth-rr-input__control--align-left" :value="form.passportCode" readonly />
              </AuthRRField>
            </div>
            <AuthRRField label="Кем выдан">
              <input class="auth-rr-input__control auth-rr-input__control--align-left" :value="form.passportIssued" readonly />
            </AuthRRField>
            <AuthRRField label="Место рождения">
              <input class="auth-rr-input__control auth-rr-input__control--align-left" :value="form.birthdayPlace" readonly />
            </AuthRRField>
            <AuthRRField label="Адрес регистрации">
              <input class="auth-rr-input__control auth-rr-input__control--align-left" :value="form.registrationAddress" readonly />
            </AuthRRField>
            <AuthRRField v-if="!form.sameAsResidence" label="Адрес фактического проживания">
              <input class="auth-rr-input__control auth-rr-input__control--align-left" :value="form.residenceAddress" readonly />
            </AuthRRField>
          </div>
        </section>
      </div>

      <template #footer>
        <template v-if="viewOnly">
          <AuthRRButton label="Назад к профилю" @click="navigateTo('/profile', { replace: true })" />
        </template>
        <template v-else>
          <template v-if="step === 1">
            <AuthRRButton
              v-if="isMainPhotoValid(form)"
              label="Продолжить"
              :loading="busy"
              @click="onContinueFromMainStep"
            />
            <template v-else-if="initialLoaded">
              <AuthRRButton
                label="Сделать фото"
                :loading="busy"
                @click="openMainCamera"
              />
              <AuthRRButton
                variant="brand-secondary"
                label="Загрузить файл"
                :disabled="busy"
                @click="openFilePicker('main')"
              />
            </template>
          </template>
          <template v-else-if="step === 2">
            <AuthRRButton
              v-if="isRegPhotoValid(form)"
              label="Продолжить"
              :loading="busy || ocrChecking"
              @click="onContinueFromRegStep"
            />
            <template v-else-if="initialLoaded">
              <AuthRRButton
                label="Сделать фото"
                :loading="busy"
                @click="openRegCamera"
              />
              <AuthRRButton
                variant="brand-secondary"
                label="Загрузить файл"
                :disabled="busy"
                @click="openFilePicker('registration')"
              />
            </template>
          </template>
          <template v-else-if="step === 3">
            <AuthRRButton
              label="Продолжить"
              :loading="busy"
              @click="submitFormStep"
            />
          </template>
          <template v-else>
            <ProfileRrCheckbox
              v-model="form.dataConfirmed"
              label="Данные верны"
            />
            <AuthRRButton
              label="Отправить на проверку"
              :disabled="!canSubmitReview"
              :loading="busy"
              @click="submitForReview"
            />
          </template>
        </template>
        <p v-if="formError" class="ppass-error" role="alert">{{ formError }}</p>
      </template>
    </ProfileStepShell>

    <input
      ref="fileInputRef"
      class="ppass-file-input"
      type="file"
      :accept="ACCEPT_IMAGE"
      @change="onFilePicked"
    />

    <PassportCameraCapture
      v-if="cameraOpen"
      :variant="cameraVariant"
      :source="captureSource"
      :seed-file="captureSeedFile"
      :saving="busy"
      @close="closeCapture"
      @save="onCameraSave"
      @replace="onCaptureReplace"
    />

    <ProfilePhotoReviewOverlay
      v-if="previewUrl"
      :src="previewUrl === EMPTY_PHOTO_PREVIEW_TOKEN ? '' : previewUrl"
      alt="Просмотр фото"
      aria-label="Просмотр фото"
      :show-secondary="!viewOnly"
      :secondary-label="previewIsEmpty ? 'Сделать фото' : 'Переснять'"
      :show-file-action="!viewOnly"
      file-action-label="Загрузить"
      primary-label="Готово"
      @close="closePreview"
      @primary="closePreview"
      @secondary="onReplaceFromPreview"
      @file="onReuploadFromPreview"
    />

    <div
      v-if="ocrChecking"
      class="ppass-ocr-overlay"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div class="ppass-ocr-overlay__card">
        <div class="ppass-ocr-overlay__spinner" aria-hidden="true" />
        <p class="ppass-ocr-overlay__text">Проверяем правильность фотографии…</p>
      </div>
    </div>

    <RrSelectSheet
      v-if="isCompact && !form.issuedManual"
      v-model="form.passportIssued"
      v-model:open="issuedSheetOpen"
      title="Кем выдан"
      :options="issuedOptions"
      :searchable="true"
      apply-label="Применить"
      @apply="passportIssuedTouched = true"
    />
  </div>
</template>

<script setup>
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, reactive, ref, watch } from 'vue'
import { useProfileApi, useProfileNavigate } from '../composables/useProfileServices'
import { AuthRRButton, AuthRRField, RrSelectSheet } from 'bibli/shared/ui/rr'
import { parseApiErrorDetail } from 'bibli/widgets/Profile/lib/parseApiError'
import {
  PASSPORT_WIZARD_TOTAL,
  birthdayFromApi,
  birthdayToApi,
  createEmptyPassportForm,
  getPassportBirthdayPlaceFieldError,
  getPassportCodeFieldError,
  getPassportDateFieldError,
  getPassportIssuedFieldError,
  getPassportNumberFieldError,
  getPassportRegistrationFieldError,
  getPassportResidenceFieldError,
  isMainPhotoValid,
  isBirthdayAgeAllowed,
  isPassportFormValid,
  isPassportReadyToSubmit,
  isRegPhotoValid,
  maskBirthdayInput,
  maskPassportCode,
  findFmsIssuedName,
  maskPassportNumber,
  parsePassportWizardStep,
  passportCodeDigits,
  passportDigits,
  passportWizardPath,
  repairSwappedPassportDates,
} from './lib/passportWizard'
import { applyPhotoMetaToForm, EMPTY_PHOTO_PREVIEW_TOKEN } from './lib/profilePhotos'
import {
  rememberPhotosFromResponse,
  seedPhotoSlot,
} from './lib/seedWizardPhotos'
import { clearRememberedProfilePhotos, rememberProfilePhotoKind } from './lib/profilePhotosSnapshot'
import {
  ACCEPT_IMAGE,
  isAllowedUploadFile,
  isPdfFile,
  uploadRejectMessage,
} from './lib/documentMedia'
import { reviewShellTitle } from './lib/activationSteps'
import {
  applyWizardActivationGate,
  isActivationSectionRejected,
  redirectViewOnlyToReviewStep,
  seedWizardActivationGate,
} from './lib/wizardActivationContext'
import { activationSubmitExitPath, readActivationReturnPath } from './lib/activationReturnPath'
import { markActivationStep } from './lib/activationStatusSync'
import { useCompactViewport } from 'bibli/shared/utils'
import {
  applyPassportMapped,
  formatOcrUserHint,
  mergePersonalOcrDraft,
  OCR_PASSPORT_SOFT_DEADLINE_MS,
  OCR_SOFT_TIMEOUT_HINT,
  pickMappedForKind,
  readPersonalOcrDraft,
} from 'bibli/shared/ocr'
import ProfileStepShell from './personal/ProfileStepShell.vue'
import ProfileRrCheckbox from './personal/ProfileRrCheckbox.vue'
import ProfileDocThumb from './personal/ProfileDocThumb.vue'
import ProfilePhotoReviewOverlay from './personal/ProfilePhotoReviewOverlay.vue'
import ProfileAddressSuggest from './personal/ProfileAddressSuggest.vue'
import PassportCameraCapture from './passport/PassportCameraCapture.vue'
import exampleMain from './assets/activation/passport-examples/example-main.png'
import exampleReg from './assets/activation/passport-examples/example-3.png'
import tipEye from './assets/activation/passport-tips/tip-eye.svg'
import tipFlash from './assets/activation/passport-tips/tip-flash.svg'

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
  getFmsUnitNamesByCode,
} = api


const props = defineProps({
  step: { type: Number, default: 1 },
})

const step = computed(() => parsePassportWizardStep(props.step))
const busy = ref(false)
const ocrChecking = ref(false)
/** Saved birthday (API) — passport OCR / submit must not overwrite manual personal data. */
const savedBirthdayApi = ref('')
const formError = ref('')
/** In-flight / resolved passport OCR promise started after main photo upload. */
let passportOcrPromise = null
/** Bumped on main photo replace so late OCR cannot overwrite newer results. */
let passportOcrGeneration = 0
const ocrUserHint = ref('')
const viewOnly = ref(false)
const stepStatus = ref('')
const stepRejection = ref(null)
seedWizardActivationGate('passport', { stepStatus, viewOnly })
redirectViewOnlyToReviewStep({
  viewOnly: viewOnly.value,
  currentStep: step.value,
  reviewStep: PASSPORT_WIZARD_TOTAL,
  navigateTo,
  pathForStep: passportWizardPath,
})
const isRejectedSection = computed(() => isActivationSectionRejected(stepStatus.value))
const form = reactive(createEmptyPassportForm())
seedPhotoSlot({
  kind: 'passport_main',
  peekHost: peekProfilePhotos,
  getDocumentUrl,
  localFile: form.mainPhotoFile,
  currentPreviewUrl: form.mainPhotoPreviewUrl,
  setServerPath: (code) => {
    form.mainPhotoServerPath = code
  },
  setPreviewUrl: (url) => {
    form.mainPhotoPreviewUrl = url
  },
  clearLocalFile: () => {
    form.mainPhotoFile = null
  },
})
seedPhotoSlot({
  kind: 'passport_registration',
  peekHost: peekProfilePhotos,
  getDocumentUrl,
  localFile: form.regPhotoFile,
  currentPreviewUrl: form.regPhotoPreviewUrl,
  setServerPath: (code) => {
    form.regPhotoServerPath = code
  },
  setPreviewUrl: (url) => {
    form.regPhotoPreviewUrl = url
  },
  clearLocalFile: () => {
    form.regPhotoFile = null
  },
})
const passportNumberTouched = ref(false)
const passportDateTouched = ref(false)
const passportCodeTouched = ref(false)
const passportIssuedTouched = ref(false)
const birthdayPlaceTouched = ref(false)
const registrationTouched = ref(false)
const residenceTouched = ref(false)

const passportNumberFieldError = computed(() =>
  getPassportNumberFieldError(form.passport, passportNumberTouched.value),
)
const passportDateFieldError = computed(() =>
  getPassportDateFieldError(form.passportDate, passportDateTouched.value, form.birthday),
)
const passportCodeFieldError = computed(() =>
  getPassportCodeFieldError(form.passportCode, passportCodeTouched.value),
)
const passportIssuedFieldError = computed(() =>
  getPassportIssuedFieldError(form.passportIssued, passportIssuedTouched.value),
)
const birthdayPlaceFieldError = computed(() =>
  getPassportBirthdayPlaceFieldError(form.birthdayPlace, birthdayPlaceTouched.value),
)
const registrationFieldError = computed(() =>
  getPassportRegistrationFieldError(form.registrationAddress, registrationTouched.value),
)
const residenceFieldError = computed(() =>
  getPassportResidenceFieldError(
    form.residenceAddress,
    form.sameAsResidence,
    residenceTouched.value,
  ),
)

const issuedOptions = ref([])
const issuedSheetOpen = ref(false)
const isCompact = useCompactViewport()
const previewUrl = ref('')
const previewDocKey = ref('')
const cameraOpen = ref(false)
const cameraVariant = ref('main')
const captureSource = ref('camera')
const captureSeedFile = ref(null)
const fileInputRef = ref(null)

let mainPreviewObjectUrl = null
let regPreviewObjectUrl = null

const photoTips = [
  { label: 'Убедитесь, что в кадре виден весь разворот и всё хорошо видно', icon: tipEye },
  { label: 'Кадр без бликов от вспышки, теней и пальцев на тексте', icon: tipFlash },
]

const regTips = [
  { label: 'Штамп полностью в кадре, адрес читается целиком', icon: tipEye },
  { label: 'Кадр без бликов от вспышки, теней и пальцев на тексте', icon: tipFlash },
]

const canContinueForm = computed(() => isPassportFormValid(form))
const canSubmitReview = computed(
  () =>
    isPassportReadyToSubmit(form) &&
    isMainPhotoValid(form) &&
    isRegPhotoValid(form),
)
const initialLoaded = ref(false)

const showStepRejection = computed(
  () => step.value === PASSPORT_WIZARD_TOTAL && !!stepRejection.value,
)

const shellTitle = computed(() => {
  if (viewOnly.value) return reviewShellTitle(stepStatus.value)
  if (step.value === 1) return 'Сделайте фото паспорта'
  if (step.value === 2) return 'Сделайте фото страницы с штампом регистрации'
  if (step.value === 3) return 'Заполните данные'
  return reviewShellTitle(stepStatus.value)
})

const shellSubtitle = computed(() => {
  if (viewOnly.value) return 'Изменение недоступно'
  if (step.value === 1) {
    if (!initialLoaded.value && !isMainPhotoValid(form)) return ''
    return isMainPhotoValid(form)
      ? 'Фото готово. Нажмите на него, чтобы заменить.'
      : 'Главная страница с фотографией — снимок или готовый файл'
  }
  if (step.value === 2) {
    if (!initialLoaded.value && !isRegPhotoValid(form)) return ''
    return isRegPhotoValid(form)
      ? 'Фото готово. Нажмите на него, чтобы заменить.'
      : 'Если нет регистрации всё равно загрузите 5-ю страницу'
  }
  if (step.value === 3) return 'Перепишите с разворота паспорта'
  return ''
})

const reviewDocs = computed(() => [
  {
    key: 'main',
    label: 'Главная страница',
    url: form.mainPhotoPreviewUrl || (form.mainPhotoServerPath ? getDocumentUrl(form.mainPhotoServerPath) : ''),
  },
  {
    key: 'reg',
    label: 'Регистрация',
    url: form.regPhotoPreviewUrl || (form.regPhotoServerPath ? getDocumentUrl(form.regPhotoServerPath) : ''),
  },
])

const previewIsEmpty = computed(
  () => !previewUrl.value || previewUrl.value === EMPTY_PHOTO_PREVIEW_TOKEN,
)

const restoringPassport = ref(false)

async function syncIssuedOptions({ preserveCustom = false } = {}) {
  if (form.issuedManual && !preserveCustom) {
    issuedOptions.value = []
    return
  }

  const digits = passportCodeDigits(form.passportCode)
  if (digits.length !== 6) {
    issuedOptions.value = []
    if (preserveCustom && form.passportIssued.trim()) {
      form.issuedManual = true
    }
    return
  }

  try {
    const names = await getFmsUnitNamesByCode(digits)
    issuedOptions.value = names
    const issued = form.passportIssued.trim()
    if (!issued) return

    if (names.includes(issued)) {
      if (preserveCustom) form.issuedManual = false
      return
    }

    if (preserveCustom) {
      form.issuedManual = true
      return
    }

    const official = findFmsIssuedName(names, issued)
    if (official) {
      form.passportIssued = official
      return
    }

    form.passportIssued = ''
  } catch (err) {
    console.error('[passport-wizard] fms lookup failed', err)
    issuedOptions.value = []
    if (preserveCustom && form.passportIssued.trim()) {
      form.issuedManual = true
    }
  }
}

watch(
  () => form.passportCode,
  () => {
    if (form.issuedManual || restoringPassport.value) return
    void syncIssuedOptions()
  },
)

watch(
  () => form.issuedManual,
  (manual) => {
    if (restoringPassport.value) return
    if (manual) {
      issuedOptions.value = []
      return
    }
    void syncIssuedOptions()
  },
)

function apiError(err, fallback) {
  return parseApiErrorDetail(err, fallback) || fallback
}

function goToStep(n, { replace = true } = {}) {
  if (viewOnly.value && parsePassportWizardStep(n) !== PASSPORT_WIZARD_TOTAL) return
  formError.value = ''
  passportNumberTouched.value = false
  passportDateTouched.value = false
  passportCodeTouched.value = false
  passportIssuedTouched.value = false
  birthdayPlaceTouched.value = false
  registrationTouched.value = false
  residenceTouched.value = false
  const next = parsePassportWizardStep(n)
  if (next === step.value) return
  void navigateTo(passportWizardPath(next), replace ? { replace: true } : undefined)
}

function onBack() {
  if (busy.value) return
  if (viewOnly.value || isRejectedSection.value || step.value <= 1) {
    void navigateTo(readActivationReturnPath(), { replace: true })
    return
  }
  void navigateTo(passportWizardPath(step.value - 1), { replace: true })
}

function syncActivationGate(userRes, activationRes) {
  applyWizardActivationGate(userRes, activationRes, 'passport', {
    stepStatus,
    viewOnly,
    stepRejection,
  })
  redirectViewOnlyToReviewStep({
    viewOnly: viewOnly.value,
    currentStep: step.value,
    reviewStep: PASSPORT_WIZARD_TOTAL,
    navigateTo,
    pathForStep: passportWizardPath,
  })
}

function markInvalidLoadedFieldsTouched() {
  if (getPassportNumberFieldError(form.passport, true)) passportNumberTouched.value = true
  if (getPassportDateFieldError(form.passportDate, true, form.birthday)) {
    passportDateTouched.value = true
  }
  if (getPassportCodeFieldError(form.passportCode, true)) passportCodeTouched.value = true
  if (getPassportIssuedFieldError(form.passportIssued, true)) passportIssuedTouched.value = true
  if (getPassportBirthdayPlaceFieldError(form.birthdayPlace, true)) {
    birthdayPlaceTouched.value = true
  }
  if (getPassportRegistrationFieldError(form.registrationAddress, true)) {
    registrationTouched.value = true
  }
  if (getPassportResidenceFieldError(form.residenceAddress, form.sameAsResidence, true)) {
    residenceTouched.value = true
  }
}

function onPassportInput(event) {
  form.passport = maskPassportNumber(event.target.value)
}

function onPassportDateInput(event) {
  form.passportDate = maskBirthdayInput(event.target.value)
}

function onPassportCodeInput(event) {
  form.passportCode = maskPassportCode(event.target.value)
}

function openPreview(doc) {
  if (viewOnly.value && !doc?.url) return
  previewDocKey.value = doc?.key || ''
  previewUrl.value = doc?.url || EMPTY_PHOTO_PREVIEW_TOKEN
}

function closePreview() {
  previewUrl.value = ''
  previewDocKey.value = ''
}

function closeCapture({ force = false } = {}) {
  if (busy.value && !force) return
  cameraOpen.value = false
  captureSeedFile.value = null
  captureSource.value = 'camera'
}

function openMainCamera() {
  formError.value = ''
  cameraVariant.value = 'main'
  captureSource.value = 'camera'
  captureSeedFile.value = null
  cameraOpen.value = true
}

function openRegCamera() {
  formError.value = ''
  cameraVariant.value = 'registration'
  captureSource.value = 'camera'
  captureSeedFile.value = null
  cameraOpen.value = true
}

function openFilePicker(variant) {
  formError.value = ''
  if (variant === 'main' || variant === 'registration') {
    cameraVariant.value = variant
  } else if (step.value === 2) {
    cameraVariant.value = 'registration'
  } else {
    cameraVariant.value = 'main'
  }
  fileInputRef.value?.click()
}

function onReplaceFromPreview() {
  if (busy.value || viewOnly.value) return
  const key = previewDocKey.value
  closePreview()
  if (key === 'reg') openRegCamera()
  else openMainCamera()
}

function onReuploadFromPreview() {
  if (busy.value || viewOnly.value) return
  const key = previewDocKey.value
  closePreview()
  openFilePicker(key === 'reg' ? 'registration' : 'main')
}

function onCaptureReplace() {
  formError.value = ''
  openFilePicker(cameraVariant.value)
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

async function onCameraSave({ file }) {
  if (!file || busy.value) return
  formError.value = ''
  busy.value = true
  const variant = cameraVariant.value
  try {
    const localUrl = URL.createObjectURL(file)
    if (variant === 'main') {
      if (mainPreviewObjectUrl) URL.revokeObjectURL(mainPreviewObjectUrl)
      mainPreviewObjectUrl = localUrl
      form.mainPhotoFile = file
      form.mainPhotoPreviewUrl = localUrl
      const uploadRes = await uploadProfilePhoto('passport_main', file)
      const code = uploadRes?.data?.code
      if (!code) throw new Error('Сервер не вернул код файла')
      form.mainPhotoServerPath = code
      rememberProfilePhotoKind(
        'passport_main',
        uploadRes?.data || { kind: 'passport_main', code, url: '' },
      )
      closeCapture({ force: true })
      beginPassportOcr(code)
      if (!viewOnly.value) {
        goToStep(2)
      }
    } else {
      if (regPreviewObjectUrl) URL.revokeObjectURL(regPreviewObjectUrl)
      regPreviewObjectUrl = localUrl
      form.regPhotoFile = file
      form.regPhotoPreviewUrl = localUrl
      const uploadRes = await uploadProfilePhoto('passport_registration', file)
      const code = uploadRes?.data?.code
      if (!code) throw new Error('Сервер не вернул код файла')
      form.regPhotoServerPath = code
      rememberProfilePhotoKind(
        'passport_registration',
        uploadRes?.data || { kind: 'passport_registration', code, url: '' },
      )
      closeCapture({ force: true })
      if (!viewOnly.value) {
        await enterFormWithOcr()
      }
    }
  } catch (err) {
    formError.value = apiError(
      err,
      variant === 'main'
        ? 'Не удалось загрузить фото паспорта'
        : 'Не удалось загрузить фото регистрации',
    )
  } finally {
    busy.value = false
  }
}

function clearPassportMainOcrFields() {
  ocrUserHint.value = ''
  form.passport = ''
  form.passportDate = ''
  form.passportCode = ''
  form.passportIssued = ''
  form.issuedManual = false
  form.birthdayPlace = ''
  passportNumberTouched.value = false
  passportDateTouched.value = false
  passportCodeTouched.value = false
  passportIssuedTouched.value = false
  birthdayPlaceTouched.value = false
}

function beginPassportOcr(photoCode) {
  passportOcrGeneration += 1
  const generation = passportOcrGeneration
  clearPassportMainOcrFields()
  passportOcrPromise = startPassportOcr(photoCode, generation)
  return generation
}

async function startPassportOcr(photoCode, generation) {
  try {
    const res = await recognizeProfileDocument({
      photo_kind: 'passport_main',
      photo_code: photoCode,
    })
    if (generation !== passportOcrGeneration) return null
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

function applyOcrSuggestions(suggestions, generation = passportOcrGeneration) {
  if (generation !== passportOcrGeneration) return false
  if (!suggestions || typeof suggestions !== 'object') return false
  // Seed birthday from personal draft / saved API before OCR so setIfEmpty locks it.
  if (!String(form.birthday || '').trim()) {
    const draft = readPersonalOcrDraft()
    const fromDraft = birthdayFromApi(draft?.birthday) || String(draft?.birthday || '').trim()
    if (fromDraft) form.birthday = fromDraft
    else if (savedBirthdayApi.value) {
      form.birthday = birthdayFromApi(savedBirthdayApi.value) || savedBirthdayApi.value
    }
  }
  const scoped = pickMappedForKind('passport', suggestions)
  const patch = applyPassportMapped(form, scoped)
  if (savedBirthdayApi.value) {
    const locked = birthdayFromApi(savedBirthdayApi.value) || savedBirthdayApi.value
    if (locked) form.birthday = locked
  }
  mergePersonalOcrDraft(patch)
  return Object.keys(scoped).length > 0
}

async function enterFormWithOcr() {
  goToStep(3)
  const passportGen = passportOcrGeneration
  const pending = passportOcrPromise

  if (!pending) return

  ocrChecking.value = true
  try {
    const raced = await Promise.race([
      pending.then((s) => ({ kind: 'ok', suggestions: s })),
      new Promise((resolve) =>
        setTimeout(() => resolve({ kind: 'timeout', suggestions: null }), OCR_PASSPORT_SOFT_DEADLINE_MS),
      ),
    ])
    if (passportGen !== passportOcrGeneration) return
    if (raced.kind === 'ok' && raced.suggestions) {
      applyOcrSuggestions(raced.suggestions, passportGen)
    } else if (raced.kind === 'timeout' && !ocrUserHint.value) {
      ocrUserHint.value = OCR_SOFT_TIMEOUT_HINT
    }
    // Soft timeout / empty OCR: leave the form for manual entry; do not
    // apply late results (looks buggy when fields pop in after unlock).
  } finally {
    if (passportGen === passportOcrGeneration) {
      ocrChecking.value = false
    }
  }
}

async function onContinueFromMainStep() {
  if (busy.value || viewOnly.value) return
  if (!isMainPhotoValid(form)) return
  if (!passportOcrPromise && form.mainPhotoServerPath) {
    beginPassportOcr(form.mainPhotoServerPath)
  }
  goToStep(2)
}

async function onContinueFromRegStep() {
  if (busy.value || ocrChecking.value || viewOnly.value) return
  if (!isRegPhotoValid(form)) return
  if (!passportOcrPromise && form.mainPhotoServerPath) {
    beginPassportOcr(form.mainPhotoServerPath)
  }
  await enterFormWithOcr()
}

function markAllFormFieldsTouched() {
  passportNumberTouched.value = true
  passportDateTouched.value = true
  passportCodeTouched.value = true
  passportIssuedTouched.value = true
  birthdayPlaceTouched.value = true
  registrationTouched.value = true
  residenceTouched.value = true
}

async function submitFormStep() {
  if (busy.value) return
  markAllFormFieldsTouched()
  if (!canContinueForm.value) return
  formError.value = ''
  if (!isBirthdayAgeAllowed(form.birthday)) {
    formError.value = 'Сначала укажите корректную дату рождения в блоке «Личные данные»'
    return
  }
  busy.value = true
  try {
    await SubmitPassportData(buildPayload())
    goToStep(4)
  } catch (err) {
    formError.value = apiError(err, 'Не удалось сохранить данные паспорта')
  } finally {
    busy.value = false
  }
}

async function submitForReview() {
  if (busy.value || !canSubmitReview.value) return
  formError.value = ''
  if (!form.dataConfirmed) {
    formError.value = 'Подтвердите, что данные верны'
    return
  }
  if (!isMainPhotoValid(form) || !isRegPhotoValid(form)) {
    formError.value = 'Загрузите фото главной страницы и страницы регистрации'
    return
  }
  if (!isPassportFormValid(form)) {
    formError.value = 'Заполните все поля паспорта'
    return
  }
  if (!isBirthdayAgeAllowed(form.birthday)) {
    formError.value = 'Сначала укажите корректную дату рождения в блоке «Личные данные»'
    return
  }
  busy.value = true
  try {
    await SubmitPassportData({
      ...buildPayload(),
      submit_for_review: true,
      confirm_step: 'passport',
    })
    markActivationStep('passport', 'review')
    await navigateTo(activationSubmitExitPath(), { replace: true })
  } catch (err) {
    formError.value = apiError(err, 'Не удалось отправить данные')
  } finally {
    busy.value = false
  }
}

function buildPayload() {
  // Prefer already-saved birthday — passport step is not the place to change it.
  const birthdayApi =
    savedBirthdayApi.value ||
    birthdayToApi(form.birthday)
  const payload = {
    passport: passportDigits(form.passport),
    passport_issued: form.passportIssued.trim(),
    passport_date: birthdayToApi(form.passportDate),
    passport_code: passportCodeDigits(form.passportCode),
    birthday: birthdayApi,
    birthday_place: form.birthdayPlace.trim(),
    registration_address: form.registrationAddress.trim(),
    residence_address: form.sameAsResidence
      ? form.registrationAddress.trim()
      : form.residenceAddress.trim(),
  }
  if (form.inn) payload.inn = form.inn
  if (form.bankAccount) payload.bank_account = form.bankAccount
  if (form.bankBik) payload.bank_bik = form.bankBik
  if (form.bankName) payload.bank_name = form.bankName
  return payload
}

async function loadInitial() {
  restoringPassport.value = true
  try {
    const [data, photosRes, userRes, activationRes] = await Promise.all([
      getPassportData(),
      getProfilePhotos(),
      getUserData(),
      getActivationStatusFresh(),
    ])
    const row = data?.data || data || {}
    const serverPassport = maskPassportNumber(row.passport || '')
    const serverPassportDate = birthdayFromApi(row.passport_date)
    const serverPassportCode = maskPassportCode(row.passport_code || '')
    const serverPassportIssued = row.passport_issued || ''
    const serverBirthday = birthdayFromApi(row.birthday)
    const serverBirthdayPlace = row.birthday_place || ''
    const serverReg = row.registration_address || ''
    const serverResidence = row.residence_address || ''

    // Empty API must not wipe fields already filled by OCR / user input.
    if (serverPassport) form.passport = serverPassport
    if (serverPassportDate) form.passportDate = serverPassportDate
    if (serverPassportCode) form.passportCode = serverPassportCode
    if (serverPassportIssued) {
      form.passportIssued = serverPassportIssued
      form.issuedManual = false
    }
    if (serverBirthday) form.birthday = serverBirthday
    if (!form.birthday) {
      const user = userRes?.data ?? userRes ?? {}
      const fromUser = birthdayFromApi(
        user?.data?.birthday || user?.birthday || user?.personal?.birthday,
      )
      if (fromUser) form.birthday = fromUser
    }
    savedBirthdayApi.value = birthdayToApi(form.birthday) || ''
    if (serverBirthdayPlace) form.birthdayPlace = serverBirthdayPlace
    if (serverReg) form.registrationAddress = serverReg
    if (serverResidence) form.residenceAddress = serverResidence
    form.sameAsResidence =
      !form.residenceAddress ||
      form.residenceAddress.trim() === form.registrationAddress.trim()
    if (row.inn) form.inn = row.inn
    if (row.bank_account) form.bankAccount = row.bank_account
    if (row.bank_bik) form.bankBik = row.bank_bik
    if (row.bank_name) form.bankName = row.bank_name
    form.dataConfirmed = false

    repairSwappedPassportDates(form)
    // Manual / saved birthday wins over OCR date-swap heuristics on hydrate.
    if (savedBirthdayApi.value) {
      const locked = birthdayFromApi(savedBirthdayApi.value) || savedBirthdayApi.value
      if (locked) form.birthday = locked
    }

    rememberPhotosFromResponse(photosRes)
    applyPhotoMetaToForm({
      meta: photosRes?.data?.passport_main,
      getDocumentUrl,
      localFile: form.mainPhotoFile,
      currentPreviewUrl: form.mainPhotoPreviewUrl,
      setServerPath: (code) => {
        form.mainPhotoServerPath = code
      },
      setPreviewUrl: (url) => {
        form.mainPhotoPreviewUrl = url
      },
      clearLocalFile: () => {
        form.mainPhotoFile = null
        if (mainPreviewObjectUrl) {
          URL.revokeObjectURL(mainPreviewObjectUrl)
          mainPreviewObjectUrl = null
        }
      },
    })
    applyPhotoMetaToForm({
      meta: photosRes?.data?.passport_registration,
      getDocumentUrl,
      localFile: form.regPhotoFile,
      currentPreviewUrl: form.regPhotoPreviewUrl,
      setServerPath: (code) => {
        form.regPhotoServerPath = code
      },
      setPreviewUrl: (url) => {
        form.regPhotoPreviewUrl = url
      },
      clearLocalFile: () => {
        form.regPhotoFile = null
        if (regPreviewObjectUrl) {
          URL.revokeObjectURL(regPreviewObjectUrl)
          regPreviewObjectUrl = null
        }
      },
    })

    await syncIssuedOptions({ preserveCustom: true })

    syncActivationGate(userRes, activationRes)
    markInvalidLoadedFieldsTouched()
  } catch (err) {
    formError.value = apiError(err, 'Не удалось загрузить данные паспорта')
    console.error('[passport-wizard] load failed', err)
  } finally {
    restoringPassport.value = false
    initialLoaded.value = true
  }
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
  formError.value = ''
  if (forceReload) {
    form.mainPhotoFile = null
    form.mainPhotoPreviewUrl = null
    form.mainPhotoServerPath = null
    form.regPhotoFile = null
    form.regPhotoPreviewUrl = null
    form.regPhotoServerPath = null
    if (mainPreviewObjectUrl) {
      URL.revokeObjectURL(mainPreviewObjectUrl)
      mainPreviewObjectUrl = null
    }
    if (regPreviewObjectUrl) {
      URL.revokeObjectURL(regPreviewObjectUrl)
      regPreviewObjectUrl = null
    }
    clearRememberedProfilePhotos()
  }
  initialLoaded.value = false
  void loadInitial()
})

onDeactivated(() => {
  busy.value = false
  closeCapture({ force: true })
})

onBeforeUnmount(() => {
  busy.value = false
  closeCapture({ force: true })
  if (mainPreviewObjectUrl) URL.revokeObjectURL(mainPreviewObjectUrl)
  if (regPreviewObjectUrl) URL.revokeObjectURL(regPreviewObjectUrl)
})
</script>

<style scoped>
.profile-passport-wizard,
.profile-passport-wizard *,
.profile-passport-wizard *::before,
.profile-passport-wizard *::after {
  box-sizing: border-box;
}

.profile-passport-wizard {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  flex: 1 1 0;
  overflow: hidden;
}

.ppw-stack {
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-xl);
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.ppass-hero {
  display: grid;
  place-items: center;
  padding: var(--rr-spacing-padding-xl);
  border-radius: var(--rr-radius-xl);
  background: var(--rr-backgrounds-brand-secondary-default);
  overflow: hidden;
}

.ppw-photo-pending {
  min-height: 220px;
  border-radius: var(--rr-radius-xl);
  background: var(--rr-backgrounds-secondary);
}

.ppass-hero__img {
  display: block;
  width: 100%;
  max-width: 130px;
  height: auto;
  border-radius: var(--rr-radius-m);
  object-fit: contain;
}

.ppass-hero__img--reg {
  max-width: 280px;
}

.ppass-tips__title {
  margin: 0 0 var(--rr-spacing-padding-m);
  font-size: var(--rr-font-size-font-size-m);
  font-weight: 600;
  text-align: center;
}

.ppass-tips__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--rr-spacing-padding-m);
}

.ppass-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--rr-spacing-padding-m);
  padding: var(--rr-spacing-padding-l);
  border-radius: var(--rr-radius-l);
  background: var(--rr-backgrounds-quaternary);
  font-size: var(--rr-font-size-font-size-xs);
  line-height: 18px;
}

.ppass-tip__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--rr-spacing-padding-4-xl);
  height: var(--rr-spacing-padding-4-xl);
  border-radius: var(--rr-radius-m);
  background: var(--rr-backgrounds-primary);
}

.ppass-tip__icon img {
  display: block;
  width: var(--rr-spacing-padding-xl);
  height: var(--rr-spacing-padding-xl);
  object-fit: contain;
}

.ppass-tip__text {
  color: var(--rr-labels-neutral-primary);
  text-align: center;
}

.ppass-form :deep(.auth-rr-field__label) {
  color: var(--rr-labels-neutral-secondary);
}

.ppass-form {
  min-width: 0;
}

.ppass-form :deep(.auth-rr-field) {
  min-width: 0;
  max-width: 100%;
}

.ppass-issued {
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.ppass-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--rr-spacing-padding-l);
  min-width: 0;
}

@media (max-width: 419px) {
  .ppass-row {
    grid-template-columns: 1fr;
  }
}

.ppass-select {
  appearance: none;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23787880' stroke-width='1.4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right var(--rr-spacing-padding-l) center;
  background-size: 12px 8px;
  padding-right: 36px;
}

.ppass-select-trigger {
  display: block;
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.ppass-select-trigger--placeholder {
  color: var(--rr-input-text-default);
}

.ppass-review {
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-xl);
}

.ppass-card {
  padding: var(--rr-spacing-padding-l) 0;
  border-radius: var(--rr-radius-xl);
  background: var(--rr-backgrounds-primary);
}

.ppass-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--rr-spacing-padding-l);
}

.ppass-card__head h2 {
  margin: 0;
  font-size: var(--rr-font-size-font-size-m);
  font-weight: 600;
}

.ppass-docs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--rr-spacing-padding-m);
}


.ppass-link {
  display: inline;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 0;
  background: none;
  color: var(--rr-labels-brand-primary, #1c4ae5);
  font-family: inherit;
  font-weight: 400;
  font-size: inherit;
  line-height: inherit;
  letter-spacing: inherit;
  text-align: inherit;
  cursor: pointer;
}

.ppass-link:hover,
.ppass-link:active {
  background: none;
  opacity: 0.85;
}

.ppass-link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ppass-file-input {
  display: none;
}

.ppass-error {
  margin: var(--rr-spacing-padding-m) 0 0;
  color: var(--rr-labels-danger-primary);
  font-size: var(--rr-font-size-font-size-s);
  line-height: var(--rr-line-height-line-height-s);
  text-align: center;
}

.ppass-ocr-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.45);
  padding: 24px;
}

.ppass-ocr-overlay__card {
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

.ppass-ocr-overlay__spinner {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 3px solid rgba(15, 23, 42, 0.12);
  border-top-color: var(--rr-labels-neutral-primary, #111);
  animation: ppass-ocr-spin 0.8s linear infinite;
}

.ppass-ocr-overlay__text {
  margin: 0;
  text-align: center;
  font-size: 15px;
  line-height: 1.4;
  color: var(--rr-labels-neutral-primary, #111);
}

.ppass-ocr-hint {
  margin: 0 0 var(--rr-spacing-padding-m);
  color: var(--rr-labels-secondary);
  font-size: var(--rr-font-size-font-size-s);
  line-height: var(--rr-line-height-line-height-s);
  text-align: center;
}

@keyframes ppass-ocr-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
