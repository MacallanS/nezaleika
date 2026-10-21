<template>
  <button
    :type="type"
    :class="['custom-button', props.class, { 'custom-button-loading': loading, 'custom-button-disabled': disabled }]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="custom-button-loading-icon">
      <i class="pi pi-spin pi-spinner"></i>
    </span>
    <span v-else-if="icon && !iconRight" class="custom-button-icon">
      <i :class="icon"></i>
    </span>
    <span class="custom-button-label">
      <slot>{{ label }}</slot>
    </span>
    <span v-if="icon && iconRight" class="custom-button-icon custom-button-icon-right">
      <i :class="icon"></i>
    </span>
  </button>
</template>

<script setup>
const props = defineProps({
  type: {
    type: String,
    default: 'button',
    validator: (value) => ['button', 'submit', 'reset'].includes(value)
  },
  class: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: 'Далее'
  },
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  icon: {
    type: String,
    default: ''
  },
  iconRight: {
    type: Boolean,
    default: false
  },
  onclick: {
    type: Function,
    default: () => {}
  }
})

const emit = defineEmits(['click'])

const handleClick = (event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
    if (props.onclick) {
      props.onclick(event)
    }
  }
}
</script>

<style scoped>
.custom-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: var(--ui-control-height, var(--filter-control-height, var(--filter-control-height-md, 40px)));
  padding: 0 0.75rem;
  font-family: var(--russ-font-family);
  font-size: clamp(
    14px,
    calc(14px + (18 - 14) * ((100vw - 320px) / (1920 - 320))),
    18px
  );
  font-weight: 500;
  line-height: 1;
  text-align: center;
  text-decoration: none;
  white-space: nowrap;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  background-color: var(--russ-primary);
  color: var(--russ-text-inverse);
}

.custom-button:hover:not(:disabled):not(.custom-button-disabled) {
  background-color: var(--russ-primary-hover);
  border-color: var(--russ-primary-hover);
}

.custom-button:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--russ-focus-ring);
}

.custom-button:active:not(:disabled):not(.custom-button-disabled) {
  background-color: var(--russ-primary-active);
  border-color: var(--russ-primary-active);
}

.custom-button:disabled,
.custom-button-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.custom-button-loading {
  cursor: wait;
}

.custom-button-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-button-icon {
  display: inline-flex;
  align-items: center;
  font-size: 1rem;
}

.custom-button-icon-right {
  order: 2;
}

.custom-button-loading-icon {
  display: inline-flex;
  align-items: center;
  font-size: 1rem;
}

/* Варианты кнопок */
.custom-button.custom-button-secondary {
  background-color: var(--russ-bg);
  color: var(--russ-primary);
  border-color: var(--russ-primary);
}

.custom-button.custom-button-secondary:hover:not(:disabled):not(.custom-button-disabled) {
  background-color: var(--russ-primary);
  color: var(--russ-text-inverse);
  border-color: var(--russ-primary);
}

.custom-button.custom-button-success {
  background-color: var(--russ-success);
  color: var(--russ-text-inverse);
  border-color: var(--russ-success);
}

.custom-button.custom-button-success:hover:not(:disabled):not(.custom-button-disabled) {
  background-color: var(--russ-success-dark);
  border-color: var(--russ-success-dark);
}

.custom-button.custom-button-danger {
  background-color: var(--russ-error);
  color: var(--russ-text-inverse);
  border-color: var(--russ-error);
}

.custom-button.custom-button-danger:hover:not(:disabled):not(.custom-button-disabled) {
  background-color: var(--russ-error-dark);
  border-color: var(--russ-error-dark);
}

.custom-button.custom-button-text {
  background-color: transparent;
  color: var(--russ-primary);
  border-color: transparent;
  padding: 0.5rem;
}

.custom-button.custom-button-text:hover:not(:disabled):not(.custom-button-disabled) {
  background-color: var(--russ-bg-secondary);
}
</style>