<template>
  <div class="profile-rr-gender">
    <p v-if="label" class="profile-rr-gender__label">{{ label }}</p>
    <div class="profile-rr-gender__control" role="group" :aria-label="label || 'Пол'">
      <button
        type="button"
        class="profile-rr-gender__option"
        :class="{ 'profile-rr-gender__option--active': modelValue === 'm' }"
        :disabled="disabled"
        @click="emit('update:modelValue', 'm')"
      >
        М
      </button>
      <button
        type="button"
        class="profile-rr-gender__option"
        :class="{ 'profile-rr-gender__option--active': modelValue === 'f' }"
        :disabled="disabled"
        @click="emit('update:modelValue', 'f')"
      >
        Ж
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: null },
  label: { type: String, default: 'Пол' },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])
</script>

<style scoped>
.profile-rr-gender,
.profile-rr-gender *,
.profile-rr-gender *::before,
.profile-rr-gender *::after {
  box-sizing: border-box;
}

.profile-rr-gender {
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-m);
  min-width: 0;
}

.profile-rr-gender__label {
  margin: 0;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 400;
  font-style: normal;
  font-size: var(--rr-font-size-font-size-s);
  line-height: 140%;
  letter-spacing: 0;
  vertical-align: middle;
  color: #000000;
}

.profile-rr-gender__control {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--rr-spacing-padding-s);
  width: max-content;
  height: var(--rr-size-4-xl, 48px);
  min-height: var(--rr-size-4-xl, 48px);
  max-height: var(--rr-size-4-xl, 48px);
  padding: var(--rr-spacing-padding-s);
  border-radius: var(--rr-radius-m);
  background: var(--rr-input-background-default, var(--rr-backgrounds-quaternary));
}

.profile-rr-gender__option {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  height: 100%;
  border: none;
  border-radius: var(--rr-radius-s);
  background: transparent;
  color: var(--rr-labels-neutral-secondary);
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 400;
  font-style: normal;
  font-size: var(--rr-font-size-font-size-m, 16px);
  line-height: 1;
  letter-spacing: 0;
  vertical-align: middle;
  padding: 0 14px;
  cursor: pointer;
}

.profile-rr-gender__option--active {
  background: var(--rr-backgrounds-primary);
  color: var(--rr-labels-neutral-primary);
  box-shadow: 0 var(--rr-px-1, 1px) var(--rr-px-2, 2px) var(--rr-fx-shadow-penumbra);
}

.profile-rr-gender__option:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}
</style>
