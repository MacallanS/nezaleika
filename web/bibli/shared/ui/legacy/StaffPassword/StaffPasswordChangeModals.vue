<template>
  <BaseModal
    v-model="visible"
    title="Смена пароля"
    size="sm"
    @hide="resetForm"
  >
    <div class="pwd">
      <p v-if="userLabel" class="pwd__user">
        <span class="pwd__user-label">Пользователь</span>
        <span class="pwd__user-name">{{ userLabel }}</span>
      </p>

      <AuthRRInputPassword
        v-model="form.newPassword"
        name="new-password"
        label="Новый пароль"
        autocomplete="new-password"
        :error="passwordError"
      />

      <AuthRRPasswordRules :password="form.newPassword" />

      <AuthRRInputPassword
        v-model="form.newPasswordConfirmation"
        name="new-password-confirm"
        label="Повторите пароль"
        autocomplete="new-password"
        :error="confirmDisplayError"
      />

      <div v-if="error" class="pwd__error" role="alert">
        {{ error }}
      </div>
    </div>

    <template #footer>
      <div class="pwd__footer">
        <button type="button" class="btn-ghost" :disabled="loading" @click="close">
          Отмена
        </button>
        <button
          type="button"
          class="btn-primary"
          :disabled="loading || !canSubmit"
          @click="submit"
        >
          <span v-if="loading" class="loader-inline" aria-hidden="true"></span>
          {{ loading ? 'Сохранение…' : 'Сменить пароль' }}
        </button>
      </div>
    </template>
  </BaseModal>

  <StaffCredentialsRevealModal
    v-model:visible="showResult"
    title="Пароль изменён"
    lead="Новый пароль установлен. Сохраните его — повторно он не отобразится."
    :password="establishedPassword"
    hint="Передайте пароль сотруднику по защищённому каналу."
  />
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { AuthRRInputPassword, AuthRRPasswordRules } from 'bibli/shared/ui/rr'
import { BaseModal } from '../BaseModal'
import { useToast } from '../Toast'
import StaffCredentialsRevealModal from './StaffCredentialsRevealModal.vue'
import {
  canSubmitStaffPasswordForm,
  setUserPasswordErrorMessage,
  validateStaffPasswordForm,
  type StaffSetPasswordFn,
} from './password'

const visible = defineModel<boolean>('visible', { default: false })

const props = defineProps<{
  userId: string | number | null | undefined
  userLabel?: string | null
  setPassword: StaffSetPasswordFn
}>()

const emit = defineEmits<{
  success: []
}>()

const toast = useToast()
const loading = ref(false)
const error = ref('')
const passwordError = ref('')
const confirmError = ref('')
const showResult = ref(false)
const establishedPassword = ref('')
const form = reactive({
  newPassword: '',
  newPasswordConfirmation: '',
})

const passwordsMatch = computed(
  () =>
    Boolean(form.newPasswordConfirmation) &&
    form.newPassword === form.newPasswordConfirmation,
)

const canSubmit = computed(() =>
  canSubmitStaffPasswordForm(form.newPassword, form.newPasswordConfirmation),
)

const confirmDisplayError = computed(() => {
  if (confirmError.value) return confirmError.value
  if (form.newPasswordConfirmation && !passwordsMatch.value) {
    return 'Пароли не совпадают'
  }
  return ''
})

watch(visible, (open) => {
  if (open) {
    resetForm()
  }
})

watch(
  () => [form.newPassword, form.newPasswordConfirmation] as const,
  () => {
    error.value = ''
    passwordError.value = ''
    confirmError.value = ''
  },
)

function resetForm() {
  form.newPassword = ''
  form.newPasswordConfirmation = ''
  error.value = ''
  passwordError.value = ''
  confirmError.value = ''
  loading.value = false
}

function close() {
  visible.value = false
  resetForm()
}

async function submit() {
  if (props.userId == null || props.userId === '') {
    error.value = 'Пользователь не выбран'
    return
  }

  const fieldErrors = validateStaffPasswordForm(
    form.newPassword,
    form.newPasswordConfirmation,
  )
  passwordError.value = fieldErrors.passwordError
  confirmError.value = fieldErrors.confirmError
  if (fieldErrors.passwordError || fieldErrors.confirmError) {
    return
  }

  loading.value = true
  error.value = ''

  try {
    await props.setPassword({
      userId: props.userId,
      newPassword: form.newPassword,
      newPasswordConfirmation: form.newPasswordConfirmation,
    })
    establishedPassword.value = form.newPassword
    visible.value = false
    resetForm()
    showResult.value = true
    emit('success')
  } catch (err) {
    error.value = setUserPasswordErrorMessage(err)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: error.value,
      life: 4000,
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.pwd {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 2px 0 4px;
}

.pwd__user {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
}

.pwd__user-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--russ-text-tertiary);
}

.pwd__user-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--russ-text-primary);
  word-break: break-word;
}

.pwd__error {
  color: var(--russ-error);
  font-size: 13px;
  line-height: 1.4;
}

.pwd__footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  width: 100%;
}

.btn-ghost,
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-ghost {
  background: transparent;
  border: 1px solid var(--russ-border);
  color: var(--russ-text-secondary);
}

.btn-ghost:hover:not(:disabled) {
  background: var(--russ-bg-hover, rgba(0, 0, 0, 0.03));
  color: var(--russ-text-primary);
}

.btn-primary {
  background: var(--russ-accent-dark, var(--russ-accent));
  border: 1px solid var(--russ-accent-dark, var(--russ-accent));
  color: var(--russ-text-inverse, #fff);
}

.btn-primary:disabled,
.btn-ghost:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.loader-inline {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid color-mix(in srgb, #fff 35%, transparent);
  border-top-color: #fff;
  border-radius: 50%;
  animation: pwd-spin 0.7s linear infinite;
}

@keyframes pwd-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
