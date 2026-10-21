<template>
  <section class="staff-basic" aria-label="Профиль">
    <article class="staff-basic-card">
      <div class="staff-basic-card__head">
        <h2 class="staff-basic-card__title">Профиль</h2>
        <button
          v-if="canEdit"
          type="button"
          class="staff-basic-card__edit"
          :disabled="saving"
          @click="toggleEdit"
        >
          {{ editing ? 'Отмена' : 'Редактировать' }}
        </button>
      </div>

      <form v-if="editing" class="staff-basic-form" @submit.prevent="save">
        <label class="staff-basic-field">
          <span>Фамилия</span>
          <input v-model="form.surname" type="text" required @input="onSurname" />
        </label>
        <label class="staff-basic-field">
          <span>Имя</span>
          <input v-model="form.name" type="text" required @input="onName" />
        </label>
        <label class="staff-basic-field">
          <span>Отчество</span>
          <input
            v-model="form.patronymic"
            type="text"
            :disabled="form.noPatronymic"
            :placeholder="form.noPatronymic ? 'По паспорту нет отчества' : ''"
            @input="onPatronymic"
          />
        </label>
        <label class="staff-basic-check">
          <input v-model="form.noPatronymic" type="checkbox" @change="onNoPatronymic" />
          <span>По паспорту нет отчества</span>
        </label>
        <label class="staff-basic-field">
          <span>Телефон</span>
          <input v-model="form.phone" type="tel" required />
        </label>
        <label class="staff-basic-field">
          <span>Telegram</span>
          <input
            v-model="form.telegram_username"
            type="text"
            placeholder="@username"
            @input="onTelegram"
          />
        </label>
        <label class="staff-basic-field">
          <span>Роль</span>
          <select v-model="form.role_id" required>
            <option value="">— выберите роль —</option>
            <option v-for="role in roleOptions" :key="role.id" :value="String(role.id)">
              {{ role.name }}
            </option>
          </select>
        </label>
        <div class="staff-basic-actions">
          <button type="submit" class="staff-basic-btn staff-basic-btn--primary" :disabled="saving">
            {{ saving ? 'Сохранение…' : 'Сохранить' }}
          </button>
        </div>
      </form>

      <dl v-else class="staff-basic-view">
        <div class="staff-basic-row">
          <dt>ФИО</dt>
          <dd>
            <button
              v-if="profile.fullName"
              type="button"
              class="staff-basic-copy"
              @click="emit('copy', profile.fullName)"
            >
              {{ profile.fullName }}
            </button>
            <span v-else class="staff-basic-empty">Не указано</span>
          </dd>
        </div>
        <div class="staff-basic-row">
          <dt>Телефон</dt>
          <dd>
            <button
              v-if="profile.phone"
              type="button"
              class="staff-basic-copy"
              @click="emit('copy', formatPhonePlus(profile.phone))"
            >
              {{ formatPhonePlus(profile.phone) }}
            </button>
            <span v-else class="staff-basic-empty">Не указан</span>
          </dd>
        </div>
        <div v-if="!hideEmail" class="staff-basic-row">
          <dt>Email</dt>
          <dd>
            <button
              v-if="profile.email"
              type="button"
              class="staff-basic-copy"
              @click="emit('copy', profile.email)"
            >
              {{ profile.email }}
            </button>
            <span v-else class="staff-basic-empty">Не указан</span>
          </dd>
        </div>
        <div class="staff-basic-row">
          <dt>Telegram</dt>
          <dd>
            <a
              v-if="profile.telegram_username"
              class="staff-basic-copy"
              :href="telegramHref"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ profile.telegram_username }}
            </a>
            <span v-else class="staff-basic-empty">Не указан</span>
          </dd>
        </div>
        <div class="staff-basic-row">
          <dt>Роль</dt>
          <dd>{{ roleLabel || 'Не указана' }}</dd>
        </div>
        <div class="staff-basic-row">
          <dt>Дата регистрации</dt>
          <dd>
            <button
              v-if="registrationDate"
              type="button"
              class="staff-basic-copy"
              @click="emit('copy', registrationDate)"
            >
              {{ registrationDate }}
            </button>
            <span v-else class="staff-basic-empty">Не указана</span>
          </dd>
        </div>
      </dl>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useToast } from 'bibli/shared/ui'
import { UpdateStaff, fetchRoles } from '@/pages/agents/api'
import { formatPhonePlus } from '@/shared/utils/russia/phoneDisplay'
import { normalizeTelegramUsername } from '@/shared/lib/telegram'
import {
  sanitizePersonNameInput,
  validateCyrillicName,
} from 'bibli/shared/ui/rr/form/composables/useCyrillicNameValidation.js'
import { useRoles } from '@/shared/composables'
import type { StaffProfileModel } from '../../composables/useStaffProfile'

const props = defineProps<{
  profile: StaffProfileModel
  canEdit?: boolean
  hideEmail?: boolean
}>()

const emit = defineEmits<{
  copy: [value: string]
  reload: []
}>()

const toast = useToast()
const { rolesStore } = useRoles()

const editing = ref(false)
const saving = ref(false)
const roleOptions = ref<Array<{ id: number; name: string }>>([])

const form = reactive({
  surname: '',
  name: '',
  patronymic: '',
  noPatronymic: false,
  phone: '',
  telegram_username: '',
  role_id: '',
})

const staffData = computed(() => props.profile.rawStaffDetails?.data ?? null)

const roleId = computed(() => {
  const raw = staffData.value?.role_id
  return raw != null ? Number(raw) : null
})

const roleLabel = computed(() => {
  if (!roleId.value) return ''
  const fromOptions = roleOptions.value.find((r) => Number(r.id) === roleId.value)
  if (fromOptions) return fromOptions.name
  const roleString = rolesStore.getRoleStringById?.(roleId.value) ?? null
  return rolesStore.getRoleDisplayName?.(roleString) || String(roleId.value)
})

const registrationDate = computed(() => {
  const createdAt = staffData.value?.created_at
  if (!createdAt) return ''
  const date = new Date(String(createdAt))
  if (Number.isNaN(date.getTime())) return String(createdAt)
  return date.toLocaleDateString('ru-RU')
})

const telegramHref = computed(() => {
  const raw = (props.profile.telegram_username || '').replace(/^@/, '')
  return raw ? `https://t.me/${raw}` : '#'
})

function fillForm() {
  const data = staffData.value
  const parts = props.profile.fullName.trim().split(/\s+/)
  form.surname = String(data?.surname || parts[0] || '')
  form.name = String(data?.name || parts[1] || '')
  const patronymic = String(data?.patronymic || parts.slice(2).join(' ') || '')
  form.noPatronymic = !patronymic
  form.patronymic = patronymic
  form.phone = String(props.profile.phone || '')
  form.telegram_username = String(props.profile.telegram_username || '')
  form.role_id = roleId.value ? String(roleId.value) : ''
}

function toggleEdit() {
  if (editing.value) {
    editing.value = false
    fillForm()
    return
  }
  fillForm()
  editing.value = true
}

function onSurname() {
  form.surname = sanitizePersonNameInput(form.surname)
}
function onName() {
  form.name = sanitizePersonNameInput(form.name)
}
function onPatronymic() {
  form.patronymic = sanitizePersonNameInput(form.patronymic)
}
function onNoPatronymic() {
  if (form.noPatronymic) form.patronymic = ''
}
function onTelegram() {
  const raw = form.telegram_username.trim()
  if (!raw) return
  form.telegram_username = normalizeTelegramUsername(raw.startsWith('@') ? raw : `@${raw}`)
}

async function save() {
  form.surname = sanitizePersonNameInput(form.surname)
  form.name = sanitizePersonNameInput(form.name)
  form.patronymic = sanitizePersonNameInput(form.patronymic)

  const surnameError = validateCyrillicName(form.surname, { emptyMessage: 'Фамилия обязательна' })
  const nameError = validateCyrillicName(form.name, { emptyMessage: 'Имя обязательно' })
  if (surnameError || nameError) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка валидации',
      detail: surnameError || nameError,
      life: 4000,
    })
    return
  }
  if (!form.noPatronymic) {
    const patronymicError = validateCyrillicName(form.patronymic, {
      emptyMessage: "Отчество обязательно или отметьте «По паспорту нет отчества»",
    })
    if (patronymicError) {
      toast.add({
        severity: 'error',
        summary: 'Ошибка валидации',
        detail: patronymicError,
        life: 4000,
      })
      return
    }
  }

  saving.value = true
  try {
    await UpdateStaff(
      props.profile.id,
      form.name,
      form.surname,
      form.noPatronymic ? null : form.patronymic || null,
      form.phone,
      form.role_id ? Number(form.role_id) : undefined,
      form.telegram_username?.trim()
        ? normalizeTelegramUsername(form.telegram_username.trim())
        : null,
    )
    toast.add({
      severity: 'success',
      summary: 'Сохранено',
      detail: 'Данные пользователя обновлены',
      life: 3000,
    })
    editing.value = false
    emit('reload')
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось сохранить данные',
      life: 4000,
    })
  } finally {
    saving.value = false
  }
}

watch(
  () => props.profile.id,
  () => {
    editing.value = false
    fillForm()
  },
  { immediate: true },
)

onMounted(async () => {
  try {
    roleOptions.value = await fetchRoles()
  } catch {
    roleOptions.value = []
  }
})
</script>

<style scoped>
.staff-basic {
  width: 100%;
  min-width: 0;
}

.staff-basic-card {
  box-sizing: border-box;
  padding: 20px;
  border-radius: var(--rr-radius-2-xl, 20px);
  background: var(--rr-backgrounds-primary, #fff);
}

.staff-basic-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.staff-basic-card__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #101012;
}

.staff-basic-card__edit {
  border: none;
  background: transparent;
  color: #3d5afe;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 8px;
}

.staff-basic-card__edit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.staff-basic-view {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.staff-basic-row {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.staff-basic-row dt {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: rgba(60, 60, 67, 0.72);
}

.staff-basic-row dd {
  margin: 0;
  font-size: 15px;
  color: #101012;
  word-break: break-word;
}

.staff-basic-copy {
  border: none;
  background: transparent;
  padding: 0;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.staff-basic-empty {
  color: rgba(60, 60, 67, 0.55);
}

.staff-basic-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.staff-basic-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(60, 60, 67, 0.72);
}

.staff-basic-field input,
.staff-basic-field select {
  box-sizing: border-box;
  height: 44px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--rr-input-border-default, #e5e7eb) 100%, transparent);
  background: #fff;
  font-size: 15px;
  font-weight: 500;
  color: #101012;
}

.staff-basic-check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(60, 60, 67, 0.72);
}

.staff-basic-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.staff-basic-btn {
  height: 44px;
  padding: 0 18px;
  border-radius: 12px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.staff-basic-btn--primary {
  background: #3d5afe;
  color: #fff;
}

.staff-basic-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .staff-basic-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
</style>
