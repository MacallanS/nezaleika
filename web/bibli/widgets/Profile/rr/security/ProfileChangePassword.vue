<template>
  <ProfileSecurityShell title="Изменить пароль" back-to="/profile/security" variant="plain">
    <form class="profile-password-form" @submit.prevent="onSubmit">
      <template v-if="factorMode === 'password'">
        <AuthRRInputPassword
          v-model="currentPassword"
          name="old_password"
          label=""
          placeholder="Текущий пароль"
          autocomplete="current-password"
          :error="currentError"
        />
        <button
          v-if="canUseBiometric || canUseSms"
          type="button"
          class="profile-password-form__alt"
          @click="onNoPassword"
        >
          Забыли пароль
        </button>
      </template>

      <template v-else-if="factorMode === 'biometric'">
        <p class="profile-password-form__hint">
          Подтвердите смену пароля через Face ID или Touch ID на этом устройстве
        </p>
        <button
          v-if="canUseSms"
          type="button"
          class="profile-password-form__alt"
          @click="startSmsFactor"
        >
          Подтвердить по SMS
        </button>
        <button
          v-if="hasPassword"
          type="button"
          class="profile-password-form__alt"
          @click="factorMode = 'password'"
        >
          Ввести текущий пароль
        </button>
      </template>

      <template v-else>
        <p class="profile-password-form__hint">
          Код отправлен на {{ phoneMasked || 'ваш номер' }}
        </p>
        <AuthRROtpInput v-model="smsCode" :invalid="Boolean(currentError)" />
        <button
          type="button"
          class="profile-password-form__alt"
          :disabled="otpBusy || otpCooldown > 0"
          @click="startSmsFactor"
        >
          {{ otpCooldown > 0 ? `Отправить снова через ${otpCooldown} с` : 'Отправить код ещё раз' }}
        </button>
        <button
          v-if="hasPassword"
          type="button"
          class="profile-password-form__alt"
          @click="factorMode = 'password'"
        >
          Ввести текущий пароль
        </button>
      </template>

      <AuthRRInputPassword
        v-model="newPassword"
        name="new_password"
        label=""
        placeholder="Новый пароль"
        autocomplete="new-password"
        :error="newError"
      />

      <AuthRRPasswordRules :password="newPassword" />

      <AuthRRInputPassword
        v-model="confirmPassword"
        name="new_password_confirmation"
        label=""
        placeholder="Повторите новый пароль"
        autocomplete="new-password"
        :error="confirmDisplayError"
      />

      <p v-if="formError" class="profile-password-form__error" role="alert">{{ formError }}</p>
    </form>

    <template #footer>
      <AuthRRButton
        v-if="factorMode === 'biometric'"
        type="button"
        label="Подтвердить биометрию и сохранить"
        :disabled="!canSubmitNew"
        :loading="saving"
        @click="onSubmitWithBiometric"
      />
      <AuthRRButton
        v-else
        type="button"
        label="Сохранить"
        :disabled="!canSubmit"
        :loading="saving"
        @click="onSubmit"
      />
    </template>
  </ProfileSecurityShell>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  AuthRRButton,
  AuthRRInputPassword,
  AuthRROtpInput,
  AuthRRPasswordRules,
} from 'bibli/shared/ui/rr'
import { isPasswordRulesValid } from 'bibli/shared/ui/rr/composables/usePasswordRules.js'
import { useProfileNavigate } from '../../composables/useProfileServices'
import { canAssertBiometricLogin, isBiometricLoginBound } from '../lib/biometricLogin'
import {
  changeUserPassword,
  fetchPasswordChangeOptions,
  sendPasswordChangeOtp,
  type PasswordChangeFactor,
} from '../lib/changePasswordApi'
import { serializeCredentialForPassword } from '../lib/changePasswordWebauthn'
import {
  clientWebAuthnRpId,
  fetchBiometricAssertionOptions,
  fetchDeviceUnlockStatus,
} from '../lib/deviceUnlockApi'
import { isStandalonePwaClient } from '../lib/pwaClient'
import { DEVICE_UNLOCK_UI_ENABLED } from '../lib/deviceUnlockSession'
import ProfileSecurityShell from './ProfileSecurityShell.vue'
import '../profile-security.css'

const navigateTo = useProfileNavigate()

type FactorMode = 'password' | 'biometric' | 'sms'

const factorMode = ref<FactorMode>('password')

const hasPassword = ref(true)
const canUseBiometric = ref(false)
const canUseSms = ref(false)
const phoneMasked = ref<string | null>(null)

const currentPassword = ref('')
const smsCode = ref('')

const newPassword = ref('')
const confirmPassword = ref('')
const saving = ref(false)
const otpBusy = ref(false)
const otpCooldown = ref(0)
let otpTimer: ReturnType<typeof setInterval> | null = null

const formError = ref('')
const currentError = ref('')
const newError = ref('')
const confirmError = ref('')

const passwordsMatch = computed(
  () => Boolean(confirmPassword.value) && newPassword.value === confirmPassword.value,
)

const canSubmitNew = computed(() => {
  if (saving.value) return false
  if (!isPasswordRulesValid(newPassword.value)) return false
  return passwordsMatch.value
})

const canSubmit = computed(() => {
  if (!canSubmitNew.value) return false
  if (factorMode.value === 'password') return Boolean(currentPassword.value.trim())
  if (factorMode.value === 'sms') return smsCode.value.replace(/\D/g, '').length >= 6
  return false
})

const confirmDisplayError = computed(() => {
  if (confirmError.value) return confirmError.value
  if (confirmPassword.value && !passwordsMatch.value) return 'Пароли не совпадают'
  return ''
})

watch([currentPassword, newPassword, confirmPassword, smsCode], () => {
  formError.value = ''
  currentError.value = ''
  newError.value = ''
  confirmError.value = ''
})

onMounted(() => {
  void loadOptions()
})

onUnmounted(() => {
  if (otpTimer) clearInterval(otpTimer)
})

async function loadOptions(): Promise<void> {
  const [options, unlock] = await Promise.all([
    fetchPasswordChangeOptions(),
    fetchDeviceUnlockStatus(),
  ])

  hasPassword.value = options?.has_password ?? true
  canUseSms.value = Boolean(options?.has_phone)
  phoneMasked.value = options?.phone_masked ?? null
  canUseBiometric.value =
    DEVICE_UNLOCK_UI_ENABLED &&
    isStandalonePwaClient() &&
    (canAssertBiometricLogin(unlock) || isBiometricLoginBound(unlock))

  if (hasPassword.value) {
    factorMode.value = 'password'
  } else if (canUseBiometric.value) {
    factorMode.value = 'biometric'
  } else if (canUseSms.value) {
    void startSmsFactor()
  } else {
    formError.value = 'Нет способа подтвердить смену пароля'
  }
}

function onNoPassword(): void {
  if (canUseBiometric.value) {
    factorMode.value = 'biometric'
    formError.value = ''
    return
  }
  if (canUseSms.value) {
    void startSmsFactor()
    return
  }
  formError.value = 'Нет биометрии и телефона для подтверждения'
}

async function startSmsFactor(): Promise<void> {
  factorMode.value = 'sms'
  formError.value = ''
  otpBusy.value = true
  try {
    const result = await sendPasswordChangeOtp()
    if (!result.ok) {
      formError.value = result.message
      return
    }
    if (result.phoneMasked) phoneMasked.value = result.phoneMasked
    startOtpCooldown()
  } finally {
    otpBusy.value = false
  }
}

function startOtpCooldown(): void {
  otpCooldown.value = 60
  if (otpTimer) clearInterval(otpTimer)
  otpTimer = setInterval(() => {
    otpCooldown.value -= 1
    if (otpCooldown.value <= 0 && otpTimer) {
      clearInterval(otpTimer)
      otpTimer = null
    }
  }, 1000)
}

async function onSubmit(): Promise<void> {
  if (factorMode.value === 'biometric') {
    await onSubmitWithBiometric()
    return
  }
  if (!canSubmit.value || saving.value) return

  if (factorMode.value === 'password' && !currentPassword.value.trim()) {
    currentError.value = 'Введите текущий пароль'
    return
  }
  if (factorMode.value === 'sms' && smsCode.value.replace(/\D/g, '').length < 6) {
    currentError.value = 'Введите код из SMS'
    return
  }

  await submitPassword({
    factor: factorMode.value,
    oldPassword: factorMode.value === 'password' ? currentPassword.value : undefined,
    code: factorMode.value === 'sms' ? smsCode.value.replace(/\D/g, '') : undefined,
  })
}

async function onSubmitWithBiometric(): Promise<void> {
  if (!canSubmitNew.value || saving.value) return

  formError.value = ''
  saving.value = true
  try {
    const options = await fetchBiometricAssertionOptions()
    if (!options.data) {
      formError.value = options.error || 'Не удалось запросить биометрию'
      return
    }

    const assertion = (await navigator.credentials.get({
      publicKey: decodeRequestOptionsLocal(options.data),
    })) as PublicKeyCredential | null

    if (!assertion) {
      formError.value = 'Биометрия не подтверждена'
      return
    }

    await submitPassword({
      factor: 'biometric',
      credential: serializeCredentialForPassword(assertion),
    }, { alreadySaving: true })
  } catch {
    formError.value = 'Не удалось подтвердить биометрию'
  } finally {
    saving.value = false
  }
}

async function submitPassword(
  payload: {
    factor: PasswordChangeFactor
    oldPassword?: string
    credential?: Record<string, unknown>
    code?: string
  },
  opts?: { alreadySaving?: boolean },
): Promise<void> {
  formError.value = ''
  newError.value = ''
  confirmError.value = ''
  currentError.value = ''
  if (!opts?.alreadySaving) saving.value = true

  try {
    const result = await changeUserPassword({
      factor: payload.factor,
      oldPassword: payload.oldPassword,
      credential: payload.credential,
      code: payload.code,
      newPassword: newPassword.value,
      newPasswordConfirmation: confirmPassword.value,
      rpId: clientWebAuthnRpId(),
    })

    if (!result.ok) {
      const msg = result.message
      if (/старый|текущ/i.test(msg)) {
        factorMode.value = 'password'
        currentError.value = msg
      } else if (/Face ID|биометр|challenge|Challenge/i.test(msg)) {
        factorMode.value = 'biometric'
        formError.value = 'Подтвердите Face ID / Touch ID ещё раз'
      } else if (/код|SMS|смс/i.test(msg)) {
        factorMode.value = 'sms'
        currentError.value = msg
      } else if (/совпад/i.test(msg)) {
        confirmError.value = msg
      } else if (/надеж|требован|символ|правил/i.test(msg)) {
        newError.value = msg
      } else {
        formError.value = msg
      }
      return
    }

    void navigateTo('/profile/security')
  } finally {
    if (!opts?.alreadySaving) saving.value = false
  }
}

function b64ToArrayBuffer(value: string): ArrayBuffer {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

function decodeRequestOptionsLocal(
  options: Record<string, unknown>,
): PublicKeyCredentialRequestOptions {
  return {
    ...(options as PublicKeyCredentialRequestOptions),
    challenge: b64ToArrayBuffer(String(options.challenge)),
    allowCredentials: Array.isArray(options.allowCredentials)
      ? (options.allowCredentials as PublicKeyCredentialDescriptor[]).map((descriptor) => ({
          ...descriptor,
          id: b64ToArrayBuffer(String(descriptor.id)),
        }))
      : [],
  }
}
</script>
