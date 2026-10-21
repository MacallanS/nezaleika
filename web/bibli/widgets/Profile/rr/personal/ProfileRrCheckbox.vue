<template>
  <label class="profile-rr-checkbox" :class="{ 'profile-rr-checkbox--checked': modelValue }">
    <input
      class="profile-rr-checkbox__input"
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      @change="onChange"
    />
    <span class="profile-rr-checkbox__box" aria-hidden="true">
      <svg
        class="profile-rr-checkbox__check"
        width="12"
        height="10"
        viewBox="0 0 12 10"
        fill="none"
      >
        <path
          d="M1 5l3.2 3.2L11 1.5"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>
    <span class="profile-rr-checkbox__label">{{ label }}</span>
  </label>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  label: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

function onChange(event) {
  emit('update:modelValue', event.target.checked)
}
</script>

<style scoped>
.profile-rr-checkbox,
.profile-rr-checkbox *,
.profile-rr-checkbox *::before,
.profile-rr-checkbox *::after {
  box-sizing: border-box;
}

.profile-rr-checkbox {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--rr-spacing-padding-m);
  cursor: pointer;
  user-select: none;
  color: var(--rr-labels-neutral-primary);
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-size: var(--rr-font-size-font-size-xs);
  font-weight: 400;
  font-style: normal;
  line-height: var(--rr-line-height-line-height-xs);
  letter-spacing: var(--rr-tracking-tracking-s);
}

.profile-rr-checkbox__input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  opacity: 0;
  cursor: pointer;
  z-index: 1;
}

.profile-rr-checkbox__box {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 var(--rr-size-l);
  width: var(--rr-size-l);
  height: var(--rr-size-l);
  min-width: var(--rr-size-l);
  min-height: var(--rr-size-l);
  border-radius: var(--rr-radius-xs);
  border: 1px solid var(--rr-border-neutral-base);
  background: transparent;
  color: var(--rr-labels-neutral-inverted-primary);
  overflow: hidden;
  pointer-events: none;
}

.profile-rr-checkbox--checked .profile-rr-checkbox__box {
  border: 1px solid var(--rr-labels-brand-primary);
  background: var(--rr-labels-brand-primary);
}

.profile-rr-checkbox__check {
  display: block;
  flex: 0 0 auto;
  width: 12px;
  height: 10px;
  opacity: 0;
  color: var(--rr-labels-neutral-inverted-primary);
}

.profile-rr-checkbox--checked .profile-rr-checkbox__check {
  opacity: 1;
}

.profile-rr-checkbox__label {
  flex: 0 1 auto;
  min-width: 0;
  pointer-events: none;
}
</style>
