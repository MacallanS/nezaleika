<template>
  <div class="input-wrapper">
    <input
      :id="name"
      v-model="localValue"
      :name="name"
      :placeholder="variant === 'on' ? '' : placeholder"
      :class="['custom-input', { 'input-error': error }]"
      :autocomplete="autocomplete"
      :inputmode="inputmode"
      :type="type"
      :disabled="disabled"
      :readonly="readonly"
      :maxlength="maxlength"
      @focus="onFocusNative"
      @blur="isFocused = false"
    />
    <label v-if="variant === 'on' && placeholder" :for="name" :class="['input-label', { 'label-active': localValue || isFocused }]">
      {{ placeholder }}
    </label>
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
    default: "Текст",
  },
  name: {
    type: String,
    default: "name",
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
    default: undefined,
  },
  inputmode: {
    type: String,
    default: undefined,
  },
  type: {
    type: String,
    default: 'text',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  maxlength: {
    type: [String, Number],
    default: undefined,
  },
});

const emit = defineEmits(["update:modelValue", "focus"]);

const isFocused = ref(false);

function onFocusNative(e) {
  isFocused.value = true;
  emit("focus", e);
}

const localValue = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});
</script>

<style scoped>
/* Обёртка: не вылезает из родителя; overflow: visible чтобы плавающий лейбл не обрезался */
.input-wrapper {
  position: relative;
  display: block;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  overflow: visible;
}

/* Само поле: всегда по ширине обёртки, не растягивает блок */
.custom-input {
  display: block;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  min-height: var(--ui-control-height, var(--filter-control-height, var(--filter-control-height-md, 40px)));
  height: var(--ui-control-height, var(--filter-control-height, var(--filter-control-height-md, 40px)));
  padding: 0 var(--filter-control-padding-x, 0.75rem);
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

.custom-input:focus {
  outline: none;
  border-color: var(--russ-input-border-focus);
}

.custom-input:disabled {
  background-color: var(--russ-input-bg-disabled);
  cursor: not-allowed;
  opacity: 0.6;
}

.custom-input[readonly] {
  background-color: var(--russ-input-bg-disabled, var(--russ-bg-quaternary));
  color: var(--russ-text-quaternary);
  cursor: pointer;
  opacity: 0.85;
}

.input-error {
  border: 1px solid var(--russ-input-border-error) !important;
  /* Внутренняя обводка, чтобы ring не выходил за границы поля */
  box-shadow: inset 0 0 0 2px var(--russ-input-error-bg);
}

.input-label {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  right: 0.75rem;
  z-index: 2;
  max-width: calc(100% - 1.5rem);
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.custom-input:focus ~ .input-label,
.label-active {
  top: -0.625rem;
  left: 0.5rem;
  right: auto;
  transform: none;
  max-width: calc(100% - 1rem);
  font-size: clamp(
    10px,
    calc(10px + (12 - 10) * ((100vw - 320px) / (1920 - 320))),
    12px
  );
  color: var(--russ-input-border-focus);
  border-radius: 5px 5px 0 0;
}

.custom-input:disabled ~ .input-label,
.custom-input[readonly] ~ .input-label {
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
