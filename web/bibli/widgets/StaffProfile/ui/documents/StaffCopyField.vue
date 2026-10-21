<template>
  <div class="staff-copy-field">
    <span v-if="showLabel" class="staff-copy-field__label">{{ label }}</span>
    <div
      class="staff-copy-field__control"
      :class="{ 'staff-copy-field__control--error': Boolean(error) }"
    >
      <input
        v-if="editable && !addressSuggest"
        class="staff-copy-field__value staff-copy-field__input"
        :value="inputValue"
        :aria-label="label"
        :aria-invalid="Boolean(error)"
        @input="onInput"
      />
      <ProfileAddressSuggest
        v-else-if="editable && addressSuggest"
        class="staff-copy-field__address"
        :model-value="inputValue"
        :mode="addressSuggest"
        :placeholder="label"
        :error="Boolean(error)"
        :autocomplete="addressSuggest === 'address' ? 'street-address' : 'off'"
        @update:model-value="emit('update:value', $event)"
      />
      <span v-else class="staff-copy-field__value">{{ displayValue }}</span>
      <button
        v-if="editable"
        type="button"
        class="staff-copy-field__btn"
        aria-label="Очистить"
        @click="emit('update:value', '')"
      >
        <svg class="staff-copy-field__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7 7l10 10M17 7L7 17"
            stroke="#93939C"
            stroke-width="1.3"
            stroke-linecap="round"
          />
        </svg>
      </button>
      <button
        v-else-if="canCopy"
        type="button"
        class="staff-copy-field__btn"
        aria-label="Скопировать"
        @click="emit('copy', value)"
      >
        <img class="staff-copy-field__icon" :src="iconCopy" alt="" width="24" height="24" />
      </button>
      <span v-else class="staff-copy-field__btn" aria-hidden="true"></span>
    </div>
    <span v-if="error" class="staff-copy-field__error">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ProfileAddressSuggest from 'bibli/widgets/Profile/rr/personal/ProfileAddressSuggest.vue'
import iconCopy from '../../assets/icons/copy.svg'

const props = withDefaults(
  defineProps<{
    label: string
    value: string
    editable?: boolean
    error?: string
    showLabel?: boolean
    addressSuggest?: 'city' | 'address'
  }>(),
  {
    value: '—',
    editable: false,
    error: '',
    showLabel: true,
    addressSuggest: undefined,
  },
)

const emit = defineEmits<{
  copy: [value: string]
  'update:value': [value: string]
}>()

const displayValue = computed(() => props.value?.trim() || '—')
const canCopy = computed(() => displayValue.value !== '—')
const inputValue = computed(() => (displayValue.value === '—' ? '' : props.value))

function onInput(event: Event) {
  const target = event.target as HTMLInputElement | null
  emit('update:value', target?.value ?? '')
}
</script>

<style scoped>
.staff-copy-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  min-width: 0;
}

.staff-copy-field__label {
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-size: var(--rr-font-size-font-size-xs, 12px);
  line-height: var(--rr-line-height-line-height-xs, 16px);
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
}

.staff-copy-field__control {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
  min-height: 48px;
  padding: 0 14px 0 16px;
  border: none;
  border-radius: 14px;
  background: var(--rr-backgrounds-quaternary, #f2f3f7);
}

.staff-copy-field__value {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-size: var(--rr-font-size-font-size-m, 16px);
  line-height: var(--rr-line-height-line-height-m, 24px);
  text-align: left;
  color: var(--rr-labels-neutral-primary, #101012);
}

.staff-copy-field__control--error {
  box-shadow: inset 0 0 0 1px var(--rr-labels-danger-primary, #ef4444);
}

.staff-copy-field__error {
  min-height: 16px;
  font-size: var(--rr-font-size-font-size-xs, 12px);
  line-height: var(--rr-line-height-line-height-xs, 16px);
  color: var(--rr-labels-danger-primary, #ef4444);
}

.staff-copy-field__input {
  height: 24px;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  outline: none;
}

.staff-copy-field__address {
  flex: 1 1 auto;
  min-width: 0;
}

.staff-copy-field__address :deep(.auth-rr-input__control) {
  height: 24px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  outline: none;
  text-align: left;
}

.staff-copy-field__address :deep(.auth-rr-input__control:hover),
.staff-copy-field__address :deep(.auth-rr-input__control:focus),
.staff-copy-field__address :deep(.auth-rr-input__control:focus-visible) {
  border: none;
  background: transparent;
  box-shadow: none;
  outline: none;
}

.staff-copy-field__address :deep(.auth-rr-input__control::placeholder) {
  text-align: left;
  color: var(--rr-labels-neutral-tertiary, rgba(60, 60, 67, 0.45));
}

.staff-copy-field__btn {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
  cursor: pointer;
}

.staff-copy-field__icon {
  display: block;
  width: 24px;
  height: 24px;
}

.staff-copy-field__btn:hover {
  opacity: 0.82;
}

.staff-copy-field__btn:focus-visible {
  outline: 2px solid var(--rr-input-border-active, #1c4ae5);
  outline-offset: 2px;
}
</style>
