<template>
  <div class="input-wrapper">
    <div class="password-input-container">
      <input
        :id="name"
        v-model="localValue"
        :name="name"
        :type="showPassword ? 'text' : 'password'"
        :placeholder="variant === 'on' ? '' : placeholder"
        :class="['custom-input', 'password-input', { 'input-error': error }]"
        :autocomplete="autocomplete"
        :disabled="disabled"
        :readonly="readonly"
        @focus="isFocused = true"
        @blur="isFocused = false"
      />
      <button
        v-if="toggleMask"
        type="button"
        :class="['password-toggle-btn', { 'password-toggle-btn-active': showPassword }]"
        @click="togglePassword"
        tabindex="-1"
        aria-label="Показать/скрыть пароль"
      >
        <svg
          v-if="showPassword"
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          class="password-toggle-icon"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M0.0535499 7.25213C0.208567 7.59162 2.40413 12.4 7 12.4C11.5959 12.4 13.7914 7.59162 13.9465 7.25213C13.9487 7.2471 13.9506 7.24304 13.952 7.24001C13.9837 7.16396 14 7.08239 14 7.00001C14 6.91762 13.9837 6.83605 13.952 6.76001C13.9506 6.75697 13.9487 6.75292 13.9465 6.74788C13.7914 6.4084 11.5959 1.60001 7 1.60001C2.40413 1.60001 0.208567 6.40839 0.0535499 6.74788C0.0512519 6.75292 0.0494023 6.75697 0.048 6.76001C0.0163137 6.83605 0 6.91762 0 7.00001C0 7.08239 0.0163137 7.16396 0.048 7.24001C0.0494023 7.24304 0.0512519 7.2471 0.0535499 7.25213ZM7 11.2C3.664 11.2 1.736 7.92001 1.264 7.00001C1.736 6.08001 3.664 2.80001 7 2.80001C10.336 2.80001 12.264 6.08001 12.736 7.00001C12.264 7.92001 10.336 11.2 7 11.2ZM5.55551 9.16182C5.98308 9.44751 6.48576 9.6 7 9.6C7.68891 9.59789 8.349 9.32328 8.83614 8.83614C9.32328 8.349 9.59789 7.68891 9.59999 7C9.59999 6.48576 9.44751 5.98308 9.16182 5.55551C8.87612 5.12794 8.47006 4.7947 7.99497 4.59791C7.51988 4.40112 6.99711 4.34963 6.49276 4.44995C5.98841 4.55027 5.52513 4.7979 5.16152 5.16152C4.7979 5.52513 4.55027 5.98841 4.44995 6.49276C4.34963 6.99711 4.40112 7.51988 4.59791 7.99497C4.7947 8.47006 5.12794 8.87612 5.55551 9.16182ZM6.2222 5.83594C6.45243 5.6821 6.7231 5.6 7 5.6C7.37065 5.6021 7.72553 5.75027 7.98762 6.01237C8.24972 6.27446 8.39789 6.62934 8.4 7C8.4 7.27689 8.31789 7.54756 8.16405 7.77779C8.01022 8.00802 7.79157 8.18746 7.53575 8.29343C7.27994 8.39939 6.99844 8.42711 6.72687 8.37309C6.4553 8.31908 6.20584 8.18574 6.01005 7.98994C5.81425 7.79415 5.68091 7.54469 5.6269 7.27312C5.57288 7.00155 5.6006 6.72006 5.70656 6.46424C5.81253 6.20842 5.99197 5.98977 6.2222 5.83594Z"
            fill="currentColor"
          />
        </svg>
        <svg
          v-else
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          class="password-toggle-icon"
        >
          <path
            d="M7 2.8C3.664 2.8 1.736 6.08 1.264 7C1.736 7.92 3.664 11.2 7 11.2C10.336 11.2 12.264 7.92 12.736 7C12.264 6.08 10.336 2.8 7 2.8ZM7 9.6C5.233 9.6 3.8 8.167 3.8 6.4C3.8 4.633 5.233 3.2 7 3.2C8.767 3.2 10.2 4.633 10.2 6.4C10.2 8.167 8.767 9.6 7 9.6Z"
            fill="currentColor"
          />
          <path
            d="M7 4.4C5.895 4.4 5 5.295 5 6.4C5 7.505 5.895 8.4 7 8.4C8.105 8.4 9 7.505 9 6.4C9 5.295 8.105 4.4 7 4.4Z"
            fill="currentColor"
          />
          <line
            x1="1"
            y1="1"
            x2="13"
            y2="13"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>
    <label
      v-if="variant === 'on' && placeholder"
      :for="name"
      :class="['input-label', { 'label-active': localValue || isFocused }]"
    >
      {{ placeholder }}
    </label>
    <!-- <span v-if="error" class="text-red-500 text-xs mt-1 block">{{ error }}</span> -->
  </div>
</template>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "Пароль",
  },
  name: {
    type: String,
    default: "password",
  },
  variant: {
    type: String,
    default: "on",
  },
  error: {
    type: String,
    default: "",
  },
  autocomplete: {
    type: String,
    default: "current-password",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  toggleMask: {
    type: Boolean,
    default: true,
  },
  feedback: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

const isFocused = ref(false);
const showPassword = ref(false);

const localValue = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};
</script>

<style scoped>
.input-wrapper {
  position: relative;
  display: block;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  overflow: visible;
}

.password-input-container {
  position: relative;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

.custom-input {
  display: block;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  min-height: var(--filter-control-height, var(--filter-control-height-md, 40px));
  height: var(--filter-control-height, var(--filter-control-height-md, 40px));
  padding: 0 calc(var(--filter-control-padding-x, 12px) * 2 + 14px) 0 var(--filter-control-padding-x, 12px);
  border: 1px solid var(--russ-input-border);
  border-radius: var(--filter-control-radius, 10px);
  font-size: var(--filter-control-font-size, var(--filter-control-font-size-md, 14px));
  font-family: var(--filter-control-font-family, var(--russ-font-family));
  font-weight: var(--filter-control-font-weight, 500);
  line-height: var(--filter-control-line-height, 1.2);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  background: var(--russ-input-bg);
  color: var(--russ-input-text);
}

.password-input {
  padding-right: calc(var(--filter-control-padding-x, 12px) * 2 + 14px);
}

.custom-input:focus {
  outline: none;
  border-color: var(--russ-input-border-focus);
}

.custom-input:disabled,
.custom-input[readonly] {
  background-color: var(--russ-input-bg-disabled);
  cursor: not-allowed;
  opacity: 0.6;
}

.input-error {
  border: 1px solid var(--russ-input-border-error) !important;
  /* Внутренняя обводка, чтобы ring не выходил за границы поля */
  box-shadow: inset 0 0 0 2px var(--russ-input-error-bg);
}

.password-toggle-btn {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  padding: 0.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--russ-input-placeholder);
  transition: color 0.2s ease;
  z-index: 1;
}

.password-toggle-btn:hover {
  color: var(--russ-input-text);
}

.password-toggle-btn:focus {
  outline: none;
  color: var(--russ-input-border-focus);
}

.password-toggle-btn:active {
  transform: translateY(-50%) scale(0.95);
}

.password-toggle-icon {
  width: 14px;
  height: 14px;
  display: block;
}

.input-label {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  z-index: 2;
  font-size: clamp(
    12px,
    calc(12px + (14 - 12) * ((100vw - 320px) / (1920 - 320))),
    14px
  );
  color: var(--russ-input-placeholder);
  pointer-events: none;
  transition: all 0.2s ease;
  background: var(--russ-input-bg);
  padding: 0 0.25rem;
  line-height: 1.2;
  transform: translateY(-50%);
}

.input-wrapper:focus-within .input-label,
.label-active {
  top: -0.625rem;
  left: 0.5rem;
  transform: none;
  font-size: clamp(
    10px,
    calc(10px + (12 - 10) * ((100vw - 320px) / (1920 - 320))),
    12px
  );
  color: var(--russ-input-border-focus);
  border-radius: 5px 5px 0 0;
}

.input-wrapper:has(.custom-input:disabled) .input-label,
.input-wrapper:has(.custom-input[readonly]) .input-label {
  background: var(--russ-input-bg-disabled);
  opacity: 0.6;
}

.text-red-500 {
  color: var(--russ-input-error);
  font-size: clamp(
    10px,
    calc(10px + (12 - 10) * ((100vw - 320px) / (1920 - 320))),
    12px
  );
  margin-top: 0.25rem;
  display: block;
}
</style>
