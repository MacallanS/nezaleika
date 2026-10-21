<template>
  <AuthRRField :label="label" :error="error" :field-id="fieldId">
    <template v-if="forgotPasswordLabel" #label-aside>
      <button
        type="button"
        class="auth-rr-field__label-link"
        @click="emit('forgot-password')"
      >
        {{ forgotPasswordLabel }}
      </button>
    </template>
    <div class="auth-rr-input-password">
      <input
        :id="fieldId"
        v-model="localValue"
        :name="name"
        :type="inputType"
        class="auth-rr-input__control auth-rr-input__control--align-left"
        :class="{
          'auth-rr-input__control--error': !!error,
        }"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :disabled="disabled"
        :readonly="readonly"
        autocapitalize="off"
        autocorrect="off"
        spellcheck="false"
        enterkeyhint="go"
        @animationstart="onAutofillAnimation"
      />
      <button
        v-if="toggleMask"
        type="button"
        class="auth-rr-input-password__toggle"
        tabindex="-1"
        :aria-label="showPassword ? 'Скрыть пароль' : 'Показать пароль'"
        @click="showPassword = !showPassword"
      >
        <img
          :src="showPassword ? authRrIcons.eyeOpen : authRrIcons.eyeOff"
          width="24"
          height="24"
          alt=""
        />
      </button>
    </div>
  </AuthRRField>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import AuthRRField from './AuthRRField.vue';
import { authRrIcons } from 'bibli/shared/assets/auth/rr';
import './auth-rr-input.css';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    label?: string;
    placeholder?: string;
    name?: string;
    error?: string;
    autocomplete?: string;
    disabled?: boolean;
    readonly?: boolean;
    toggleMask?: boolean;
    fieldId?: string;
    forgotPasswordLabel?: string;
  }>(),
  {
    modelValue: '',
    label: 'Пароль',
    placeholder: '',
    name: 'password',
    error: '',
    autocomplete: 'current-password',
    disabled: false,
    readonly: false,
    toggleMask: true,
    fieldId: '',
    forgotPasswordLabel: '',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'forgot-password': [];
}>();

const autoId = useId();
const fieldId = computed(() => props.fieldId || `auth-rr-password-${autoId}`);
const showPassword = ref(false);

/** Всегда native password — иначе Chrome/Яндекс не подставляют пару username+password. */
const inputType = computed(() => (showPassword.value ? 'text' : 'password'));

const localValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
});

function neutralizeAutofillPaint(input: HTMLInputElement) {
  const value = input.value;
  const start = input.selectionStart ?? value.length;
  const end = input.selectionEnd ?? value.length;
  const ac = input.getAttribute('autocomplete');
  input.setAttribute('autocomplete', 'off');
  input.value = '';
  input.value = value;
  if (ac == null) {
    input.removeAttribute('autocomplete');
  } else {
    input.setAttribute('autocomplete', ac);
  }
  try {
    input.setSelectionRange(start, end);
  } catch {
    // ignore
  }
}

function onAutofillAnimation(event: AnimationEvent) {
  if (event.animationName !== 'auth-rr-autofill-start') {
    return;
  }
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) {
    return;
  }
  requestAnimationFrame(() => {
    neutralizeAutofillPaint(input);
    requestAnimationFrame(() => neutralizeAutofillPaint(input));
  });
}
</script>
