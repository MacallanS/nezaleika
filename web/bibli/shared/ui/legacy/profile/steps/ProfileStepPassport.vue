<template>
  <div class="step-panel">
    <section class="form-section">
      <h3 class="form-block-title">Паспортные данные</h3>
      <InputPassport :value="form.passport" @update:value="updateField('passport', $event)"
        placeholder="Номер паспорта *" class="form-input" :class="{ 'error': errors.passport }" />
      <div v-if="errors.passport" class="error-message">{{ errors.passport }}</div>
      <InputCode :value="form.passport_code" @update:value="updateField('passport_code', $event)"
        placeholder="Код подразделения *" class="form-input" :class="{ 'error': errors.passport_code }" />
      <div v-if="errors.passport_code" class="error-message">{{ errors.passport_code }}</div>
      <div class="passport-issued-options">
        <label class="passport-issued-label" for="passport_issued">Кем выдан *</label>
        <BaseSelect
          v-if="!isCustomPassportIssued"
          id="passport_issued"
          class="passport-issued-control"
          :model-value="form.passport_issued"
          :options="passportIssuedOptions"
          :placeholder="passportIssuedOptions.length ? 'Выберите вариант' : 'Сначала введите код подразделения'"
          :searchable="false"
          :disabled="!passportIssuedOptions.length"
          @update:modelValue="updateField('passport_issued', $event)"
        />
        <InputText
          v-else
          :model-value="form.passport_issued"
          name="passport_issued"
          placeholder="Введите кем выдан"
          variant="off"
          class="passport-issued-control"
          :class="{ error: errors.passport_issued }"
          @update:model-value="updateField('passport_issued', $event)"
        />
        <label class="passport-issued-checkbox">
          <input
            type="checkbox"
            :checked="isCustomPassportIssued"
            @change="handleCustomPassportIssuedChange"
          />
          <span>Свой вариант</span>
        </label>
      </div>
      <div v-if="errors.passport_issued" class="error-message">{{ errors.passport_issued }}</div>
      <InputDate :model-value="form.passport_date" @update:model-value="updateField('passport_date', $event)"
        placeholder="Дата выдачи *" name="passport_date" :error="!!errors.passport_date" />
      <div v-if="errors.passport_date" class="error-message">{{ errors.passport_date }}</div>
    </section>

    <section class="form-section user-data-block">
      <h3 class="form-block-title">Личные и банковские данные</h3>
      <InputDate :model-value="form.birthday" @update:model-value="updateField('birthday', $event)"
        placeholder="Дата рождения *" name="birthday" :error="!!errors.birthday" />
      <div v-if="errors.birthday" class="error-message">{{ errors.birthday }}</div>
      <InputText :model-value="form.birthday_place" @update:model-value="updateField('birthday_place', $event)" placeholder="Место рождения *" class="form-input"
        :class="{ 'error': errors.birthday_place }" />
      <div v-if="errors.birthday_place" class="error-message">{{ errors.birthday_place }}</div>
      <InputText :model-value="form.registration_address" @update:model-value="updateField('registration_address', $event)" placeholder="Адрес регистрации *" class="form-input"
        :class="{ 'error': errors.registration_address }" />
      <div v-if="errors.registration_address" class="error-message">{{ errors.registration_address }}</div>
      <InputText :model-value="form.inn" @update:model-value="updateField('inn', $event)" placeholder="ИНН *" class="form-input"
        :class="{ 'error': errors.inn }" />
      <div v-if="errors.inn" class="error-message">{{ errors.inn }}</div>
      <InputText :model-value="form.bank_account" @update:model-value="updateField('bank_account', $event)" placeholder="Расчётный счёт *" class="form-input"
        :class="{ 'error': errors.bank_account }" />
      <div v-if="errors.bank_account" class="error-message">{{ errors.bank_account }}</div>
      <InputText :model-value="form.bank_bik" @update:model-value="updateField('bank_bik', $event)" placeholder="БИК банка *" class="form-input"
        :class="{ 'error': errors.bank_bik }" />
      <div v-if="errors.bank_bik" class="error-message">{{ errors.bank_bik }}</div>
      <InputText :model-value="form.bank_name" @update:model-value="updateField('bank_name', $event)" placeholder="Название банка *" class="form-input"
        :class="{ 'error': errors.bank_name }" />
      <div v-if="errors.bank_name" class="error-message">{{ errors.bank_name }}</div>
    </section>
    <div class="button-row spaced">
      <Button label="Назад" class="p-button-secondary" @click="$emit('back')" />
      <Button label="Продолжить" @click="$emit('continue')"
        :loading="isSubmitting" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { InputPassport, InputCode, InputText, InputDate, Button, BaseSelect } from '@/shared/ui';

interface FormData {
  passport: string;
  passport_issued: string;
  passport_date: string;
  passport_code: string;
  birthday: string;
  birthday_place: string;
  registration_address: string;
  inn: string;
  bank_account: string;
  bank_bik: string;
  bank_name: string;
}

interface Props {
  form: FormData;
  passportIssuedOptions?: string[];
  errors: {
    passport: string;
    passport_issued: string;
    passport_date: string;
    passport_code: string;
    birthday: string;
    birthday_place: string;
    registration_address: string;
    inn: string;
    bank_account: string;
    bank_bik: string;
    bank_name: string;
  };
  isSubmitting: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:form', value: Partial<FormData>): void;
  (e: 'continue'): void;
  (e: 'back'): void;
}>();

const isCustomPassportIssued = ref(false);

const updateField = (field: keyof FormData, value: any) => {
  emit('update:form', { [field]: value });
};

const passportIssuedOptions = computed(() => props.passportIssuedOptions || []);

const handleCustomPassportIssuedChange = (event: Event) => {
  const checked = (event.target as HTMLInputElement).checked;
  isCustomPassportIssued.value = checked;

  if (!checked) {
    const current = (props.form.passport_issued || '').trim();
    if (current && !passportIssuedOptions.value.includes(current)) {
      updateField('passport_issued', '');
    }
  }
};

watch(
  [() => props.form.passport_issued, passportIssuedOptions],
  ([issued, options]) => {
    const current = (issued || '').trim();
    if (!current || !options.length) return;
    if (!options.includes(current)) {
      isCustomPassportIssued.value = true;
    }
  },
  { immediate: true },
);

</script>

<style scoped>
.step-panel {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-section {
  background: var(--russ-bg-secondary);
  border: 1px solid var(--russ-border);
  border-radius: 12px;
  box-shadow: 0 2px 8px var(--russ-shadow-color);
  padding: 1.25rem;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.user-data-block {
  background: var(--russ-bg-blue-light);
  border: 1px solid var(--russ-info-border);
  box-shadow: 0 1px 4px var(--russ-shadow-color);
}

.form-block-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--russ-text-primary);
  margin-bottom: 0.25rem;
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

.passport-issued-options {
  margin-top: -0.5rem;
  margin-bottom: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  overflow: visible;
}

.passport-issued-label {
  font-size: clamp(12px, calc(12px + (14 - 12) * ((100vw - 320px) / (1920 - 320))), 14px);
  color: var(--russ-input-text);
  font-weight: 500;
  margin-bottom: 2px;
}

.passport-issued-control {
  width: 100%;
  margin-bottom: 0.5rem;
}

.passport-issued-control :deep(.base-select-combo),
.passport-issued-control :deep(.custom-input) {
  font-family: var(--filter-control-font-family, var(--russ-font-family));
  font-size: var(--filter-control-font-size, var(--filter-control-font-size-md, 14px));
  font-weight: var(--filter-control-font-weight, 500);
  line-height: var(--filter-control-line-height, 1.2);
  color: var(--russ-text-primary);
  background: var(--base-select-bg, var(--russ-bg-quaternary));
  border: var(--base-select-border, 1.5px solid var(--russ-border));
  border-radius: var(--base-select-radius, var(--filter-control-radius, 10px));
  box-shadow: 0 1px 4px var(--russ-shadow-accent-light);
  min-height: var(--base-select-height, var(--ui-control-height, var(--filter-control-height, 40px)));
  height: var(--base-select-height, var(--ui-control-height, var(--filter-control-height, 40px)));
  padding: var(--base-select-padding, 0 14px);
  box-sizing: border-box;
}

.passport-issued-control :deep(.custom-input::placeholder) {
  color: var(--russ-text-quaternary, #999);
  font-family: inherit;
  font-size: inherit;
  font-weight: 400;
  line-height: inherit;
  opacity: 1;
}

.passport-issued-control :deep(.custom-input:focus) {
  border-color: var(--base-select-focus-border, var(--russ-input-border-focus));
  box-shadow: var(--base-select-focus-shadow, inset 0 0 0 1.5px var(--russ-shadow-accent-light));
  background: var(--base-select-focus-bg, var(--russ-input-bg));
}

.passport-issued-control :deep(.base-select-text),
.passport-issued-control :deep(.base-select-placeholder) {
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  line-height: inherit;
}

.passport-issued-control :deep(.base-select-placeholder) {
  font-weight: 400;
  color: var(--russ-text-quaternary, #999);
}

.passport-issued-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--russ-text-secondary);
  user-select: none;
}

.passport-issued-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--russ-checkbox-accent);
}

.passport-issued-checkbox span {
  font-weight: 500;
}

.button-row {
  margin: 1.5rem 0;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-right: 20px;
}

.button-row.spaced {
  justify-content: space-between;
}
</style>
