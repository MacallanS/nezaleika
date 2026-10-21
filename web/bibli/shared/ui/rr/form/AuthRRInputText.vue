<template>
  <AuthRRField :label="label" :error="error" :field-id="fieldId">
    <div
      class="auth-rr-input-text"
      :class="{ 'auth-rr-input-text--clearable': clearable && !readonly && !disabled }"
    >
      <input
        :id="fieldId"
        v-model="localValue"
        :name="name"
        :type="type"
        class="auth-rr-input__control auth-rr-input__control--align-left"
        :class="{ 'auth-rr-input__control--error': !!error }"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :disabled="disabled"
        :readonly="readonly"
        autocapitalize="off"
        autocorrect="off"
        spellcheck="false"
        @blur="emit('blur', $event)"
        @focus="emit('focus', $event)"
      />
      <button
        v-if="clearable && !readonly && !disabled"
        type="button"
        class="auth-rr-input-text__clear"
        :class="{ 'auth-rr-input-text__clear--hidden': !showClear }"
        tabindex="-1"
        aria-label="Очистить"
        :aria-hidden="!showClear"
        @mousedown.prevent
        @click="clear"
      >
        <img :src="authRrIcons.clear" width="24" height="24" alt="" />
      </button>
    </div>
  </AuthRRField>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue';
import AuthRRField from './AuthRRField.vue';
import { authRrIcons } from 'bibli/shared/assets/auth/rr';
import './auth-rr-input.css';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    label?: string;
    placeholder?: string;
    name?: string;
    type?: string;
    error?: string;
    autocomplete?: string;
    inputmode?: string;
    disabled?: boolean;
    readonly?: boolean;
    clearable?: boolean;
    fieldId?: string;
  }>(),
  {
    modelValue: '',
    label: '',
    placeholder: '',
    name: 'text',
    type: 'text',
    error: '',
    autocomplete: 'off',
    inputmode: undefined,
    disabled: false,
    readonly: false,
    clearable: false,
    fieldId: '',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
}>();

const autoId = useId();
const fieldId = computed(() => props.fieldId || `auth-rr-text-${autoId}`);

const localValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
});

const showClear = computed(() => Boolean(String(props.modelValue || '').length));

function clear() {
  emit('update:modelValue', '');
}
</script>
