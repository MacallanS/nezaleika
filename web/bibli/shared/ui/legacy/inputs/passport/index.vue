<template>
  <div class="input-wrapper">
    <input
      :id="name"
      :value="displayValue"
      @input="handleInput"
      @focus="isFocused = true"
      @blur="onBlur"
      :name="name"
      :placeholder="variant === 'on' ? '' : placeholder"
      :class="['custom-input', { 'input-error': touched && error }]"
      type="text"
      inputmode="numeric"
      maxlength="12"
    />
    <label v-if="variant === 'on' && placeholder" :for="name" :class="['input-label', { 'label-active': displayValue || isFocused }]">
      {{ placeholder }}
    </label>
    <!-- <small v-if="touched && error" class="error-text">{{ error }}</small> -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";

const props = defineProps({
  value: { type: String, required: true },
  placeholder: { type: String, default: "Номер паспорта" },
  name: { type: String, default: "passport" },
  variant: { type: String, default: "on" },
});

const emit = defineEmits(["update:value"]);

const localValue = ref(props.value);
const error = ref("");
const touched = ref(false);
const isFocused = ref(false);

const displayValue = computed(() => localValue.value);

function formatPassport(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4)}`;
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const formatted = formatPassport(target.value);
  target.value = formatted;
  localValue.value = formatted;
  emit("update:value", formatted);
}

const onBlur = () => {
  touched.value = true;
  isFocused.value = false;
};

watch(() => props.value, (newValue) => {
  localValue.value = newValue;
});
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

.custom-input {
  display: block;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  min-height: var(--filter-control-height, var(--filter-control-height-md, 40px));
  height: var(--filter-control-height, var(--filter-control-height-md, 40px));
  padding: 0 var(--filter-control-padding-x, 12px);
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

.input-error {
  border: 1px solid var(--russ-input-error) !important;
  /* Внутренняя обводка, чтобы ring не выходил за границы поля */
  box-shadow: inset 0 0 0 2px var(--russ-input-error-bg);
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

.custom-input:focus ~ .input-label,
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

.custom-input:disabled ~ .input-label,
.custom-input[readonly] ~ .input-label {
  background: var(--russ-input-bg-disabled);
  opacity: 0.6;
}

.error-text {
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
