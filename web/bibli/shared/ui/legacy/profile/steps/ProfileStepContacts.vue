<template>
  <div class="step-panel">
    <section class="form-section">
      <InputText 
        :model-value="form.name" 
        @update:model-value="updateField('name', $event)"
        name="name" 
        placeholder="Имя *" 
        class="form-input"
        :class="{ error: errors.name }"
        :readonly="isYandexHost"
      />
      <div v-if="errors.name" class="error-message">{{ errors.name }}</div>

      <InputText 
        :model-value="form.surname" 
        @update:model-value="updateField('surname', $event)"
        name="surname" 
        placeholder="Фамилия *" 
        class="form-input"
        :class="{ error: errors.surname }"
        :readonly="isYandexHost"
      />
      <div v-if="errors.surname" class="error-message">{{ errors.surname }}</div>

      <div v-if="!isYandexHost" class="patronymic-field-wrapper">
        <InputText 
          :model-value="form.patronymic" 
          @update:model-value="updateField('patronymic', $event)"
          name="patronymic" 
          :placeholder="form.noPatronymic ? 'По паспорту нет отчества' : 'Отчество'"
          class="form-input"
          :class="{ error: errors.patronymic }"
          :disabled="form.noPatronymic"
          @input="handlePatronymicInput"
        />
        <label class="no-patronymic-checkbox">
          <input 
            type="checkbox" 
            :checked="form.noPatronymic"
            @change="handleNoPatronymicChange"
          />
          <span>По паспорту нет отчества</span>
        </label>
      </div>
      <div v-if="errors.patronymic && !isYandexHost" class="error-message">
        {{ errors.patronymic }}
      </div>

      <div v-if="isYandexHost" class="profile-readonly-field">
        <span class="profile-label">Телефон:</span>
        <span class="profile-value">{{ (filledUserData?.phone || User.getPhone()) || '-' }}</span>
      </div>

      <InputText
        v-if="!isYandexHost"
        :model-value="form.telegram_username"
        @update:model-value="updateField('telegram_username', $event)"
        name="telegram_username"
        placeholder="Telegram (например: @username)"
        class="form-input"
        :class="{ error: errors.telegram_username }"
        @input="handleTelegramInput"
      />
      <div v-if="errors.telegram_username && !isYandexHost" class="error-message">{{ errors.telegram_username }}</div>
    </section>
    <div v-if="!isYandexHost" class="button-row">
      <Button label="Продолжить" @click="handleContinue"
        :loading="isSubmitting" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { InputText, Button } from '@/shared/ui';
import { User } from '@/entities';
import { useYandexHost } from '@/shared/composables';

interface FormData {
  name: string;
  surname: string;
  patronymic: string;
  noPatronymic: boolean;
  telegram_username: string;
}

interface Props {
  form: FormData;
  errors: {
    name: string;
    surname: string;
    patronymic: string;
    telegram_username: string;
  };
  isSubmitting: boolean;
  filledUserData?: any;
}

interface Emits {
  (e: 'update:form', value: Partial<FormData>): void;
  (e: 'continue'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { isYandexHost } = useYandexHost();

function stripTelegramUsername(username: string | null | undefined) {
  const noSpaces = username ? username.replace(/\s+/g, '') : '';
  const withoutAt = noSpaces.replace(/^@+/, '');
  const cleaned = withoutAt.replace(/[^A-Za-z0-9_]/g, '').slice(0, 32);
  return cleaned;
}

function normalizeTelegramWithPrefix(username: string | null | undefined) {
  const cleaned = stripTelegramUsername(username);
  return cleaned ? `@${cleaned}` : '@';
}

const updateField = (field: keyof FormData, value: any) => {
  emit('update:form', { [field]: value });
};

const handleTelegramInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const normalized = normalizeTelegramWithPrefix(target.value);
  updateField('telegram_username', normalized);
  target.value = normalized;
};

const handlePatronymicInput = () => {
  if (props.form.patronymic && props.form.patronymic.trim()) {
    updateField('noPatronymic', false);
  }
};

const handleNoPatronymicChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const checked = target.checked;
  updateField('noPatronymic', checked);
  if (checked) {
    updateField('patronymic', '');
  }
};

const handleContinue = () => {
  emit('continue');
};
</script>

<style scoped>
.profile-readonly-field {
  display: flex;
  gap: 18px;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--russ-border);
  margin-bottom: 16px;
}

.profile-readonly-field .profile-label {
  color: var(--russ-label);
  min-width: 120px;
  font-weight: 600;
  font-size: 1.05em;
}

.profile-readonly-field .profile-value {
  color: var(--russ-value);
  font-weight: 500;
  word-break: break-word;
}

.form-section {
  background: var(--russ-bg-secondary);
  border: 1px solid var(--russ-border);
  border-radius: 12px;
  box-shadow: 0 2px 8px var(--russ-shadow-color);
  padding: 1.25rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-input {
  width: 100%;
  font-size: clamp(0.8rem, calc(0.8rem + (0.95 - 0.8) * ((100vw - 320px) / (960 - 320))), 0.95rem);
  margin-bottom: 0.5rem;
}

.form-input.error {
  border-color: var(--russ-error);
}

.error-message {
  color: var(--russ-error);
  font-size: clamp(0.75rem, calc(0.75rem + (0.85 - 0.75) * ((100vw - 320px) / (960 - 320))), 0.85rem);
  margin-top: -0.5rem;
  margin-bottom: 0.5rem;
}

.patronymic-field-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.no-patronymic-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--russ-text-secondary);
  user-select: none;
}

.no-patronymic-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--russ-checkbox-accent);
}

.no-patronymic-checkbox span {
  font-weight: 500;
}

.button-row {
  margin: 1.5rem 0;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-right: 20px;
}
</style>
