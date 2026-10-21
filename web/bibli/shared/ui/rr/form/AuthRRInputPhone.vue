<template>
  <AuthRRField :label="label" :error="displayError" :field-id="fieldId">
    <div
      class="auth-rr-input-phone"
      data-auth-rr-phone="v19-stable-autofill"
      :class="{
        'auth-rr-input-phone--error': !!displayError,
        'auth-rr-input-phone--clearable': clearable && !readonly,
        'auth-rr-input-phone--filled': hasLocalDigits,
      }"
    >
      <span class="auth-rr-input-phone__flag" aria-hidden="true">
        <img :src="authRrFlags.ru" width="24" height="24" alt="" />
      </span>
      <div class="auth-rr-input-phone__editor" @mousedown="onEditorPointer">
        <!--
          Один визуальный ряд: +7 ( и цифры/маска одним шрифтом и baseline.
          input поверх прозрачный — только caret + value для password manager.
        -->
        <div class="auth-rr-input-phone__value">
          <span class="auth-rr-input-phone__prefix" aria-hidden="true">
            <span class="auth-rr-input-phone__cc">{{ visualCc }}</span>
            <span
              class="auth-rr-input-phone__paren"
              :class="{ 'auth-rr-input-phone__paren--filled': hasLocalDigits }"
            >{{ visualOpen }}</span>
          </span>
          <span class="auth-rr-input-phone__local">
            <span class="auth-rr-input-phone__display" aria-hidden="true"
              ><span class="auth-rr-input-phone__typed"
                ><template v-if="typedParts.selected"
                  ><span class="auth-rr-input-phone__typed-plain">{{ typedParts.before }}</span
                  ><span class="auth-rr-input-phone__typed-sel">{{ typedParts.selected }}</span
                  ><span class="auth-rr-input-phone__typed-plain">{{ typedParts.after }}</span></template
                ><template v-else>{{ localValue }}</template></span
              ><span class="auth-rr-input-phone__mask">{{ maskTail }}</span></span
            >
            <input
              :id="fieldId"
              ref="inputRef"
              :type="resolvedInputType"
              inputmode="tel"
              :name="name"
              :autocomplete="resolvedAutocomplete"
              autocapitalize="off"
              autocorrect="off"
              spellcheck="false"
              :enterkeyhint="resolvedEnterKeyHint"
              :maxlength="inputMaxLength"
              class="auth-rr-input-phone__input"
              :readonly="readonly"
              aria-label="Номер телефона"
              @beforeinput="handleBeforeInput"
              @input="handleInput"
              @focus="handleFocus"
              @blur="handleBlur"
              @select="handleSelect"
              @paste="handlePaste"
              @keydown="handleKeydown"
              @change="syncFromInputElement"
              @animationstart="onAutofillAnimation"
              @animationend="onAutofillAnimation"
            />
          </span>
        </div>
      </div>
      <span class="auth-rr-input-phone__probe" data-auth-rr-phone-probe aria-hidden="true"></span>
      <button
        v-if="clearable && !readonly"
        type="button"
        class="auth-rr-input-phone__clear"
        :class="{ 'auth-rr-input-phone__clear--hidden': !showClear }"
        tabindex="-1"
        aria-label="Очистить номер"
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
import { authRrFlags, authRrIcons } from 'bibli/shared/assets/auth/rr';
import {
  extractUserDigits,
  localMaskGhost,
  splitLocalByDigitSelection,
  useRuPhoneMask,
  RU_PHONE_PREFIX,
} from './composables/useRuPhoneMask.js';
import './auth-rr-input.css';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    label?: string;
    name?: string;
    readonly?: boolean;
    error?: string;
    fieldId?: string;
    clearable?: boolean;
    /** username — логин (PM); tel — регистрация / контакты */
    credentialAutocomplete?: string;
  }>(),
  {
    modelValue: '',
    label: 'Номер телефона',
    name: 'phone',
    readonly: false,
    error: '',
    fieldId: '',
    clearable: false,
    credentialAutocomplete: 'tel',
  },
);

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const autoId = useId();
const fieldId = computed(() => props.fieldId || `auth-rr-phone-${autoId}`);

/**
 * Логин: username — Chrome/Яндекс/Safari склеивают с current-password.
 * Контакт: tel. Не смешивать токены — ломает выбор источника autofill.
 */
const resolvedAutocomplete = computed(() => props.credentialAutocomplete || 'tel');

/** Логин: text+username — iOS Keychain не путает с password; tel оставляем для регистрации. */
const resolvedInputType = computed(() =>
  resolvedAutocomplete.value === 'username' ? 'text' : 'tel',
);

const resolvedEnterKeyHint = computed(() =>
  resolvedAutocomplete.value === 'username' ? 'next' : 'done',
);

const {
  inputRef,
  localValue,
  selectionHighlight,
  errorMessage,
  handleFocus,
  handleBlur,
  handleSelect,
  handleInput,
  handleBeforeInput,
  handlePaste,
  handleKeydown,
  clear,
  syncFromInputElement,
  scheduleAutofillSync,
} = useRuPhoneMask(props, emit);

const digitCount = computed(() => extractUserDigits(localValue.value).length);
const hasLocalDigits = computed(() => digitCount.value > 0);
const maskTail = computed(() => localMaskGhost(extractUserDigits(localValue.value)));

const typedParts = computed(() => {
  const range = selectionHighlight.value;
  if (!range) {
    return { before: localValue.value, selected: '', after: '' };
  }
  return splitLocalByDigitSelection(localValue.value, range.fromDigit, range.toDigit);
});

const visualCc = computed(() => RU_PHONE_PREFIX.slice(0, Math.max(0, RU_PHONE_PREFIX.lastIndexOf('('))));
const visualOpen = computed(() => (RU_PHONE_PREFIX.endsWith('(') ? '(' : ''));
const inputMaxLength = computed(() => 32);

const showClear = computed(() => hasLocalDigits.value);

const displayError = computed(() => props.error || errorMessage.value);

function onAutofillAnimation(event: AnimationEvent) {
  if (event.animationName === 'auth-rr-autofill-start') {
    // Реальный autofill браузера — поллинг нужен даже если до этого набирали руками.
    scheduleAutofillSync({ force: true });
  }
}

function onEditorPointer(event: MouseEvent) {
  const target = event.target;
  if (target instanceof Element && target.closest('.auth-rr-input-phone__clear')) {
    return;
  }
  const input = inputRef.value;
  if (!input || props.readonly || target === input) {
    return;
  }
  event.preventDefault();
  input.focus();
  const digits = extractUserDigits(input.value || localValue.value);
  const caret =
    digits.length > 0
      ? RU_PHONE_PREFIX.length + localValue.value.length
      : RU_PHONE_PREFIX.length;
  input.setSelectionRange(caret, caret);
}
</script>
