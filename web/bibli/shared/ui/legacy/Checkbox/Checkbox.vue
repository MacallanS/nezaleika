<template>
  <div :class="['checkbox-wrapper', { 'checkbox-disabled': disabled }, props.class]">
    <input
      :id="inputId"
      ref="inputRef"
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      :value="value"
      class="checkbox-input"
      @change="handleChange"
      @focus="isFocused = true"
      @blur="isFocused = false"
    />
    <span
      :class="['checkbox-custom', { 'checkbox-checked': modelValue, 'checkbox-focused': isFocused, 'checkbox-disabled': disabled }]"
      @click="handleClick"
    >
      <svg
        v-if="modelValue"
        class="checkbox-checkmark"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10 3L4.5 8.5L2 6"
          stroke="var(--russ-text-inverse)"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>
    <label
      v-if="$slots.default"
      :for="inputId"
      class="checkbox-label"
      @click="handleLabelClick"
    >
      <slot />
    </label>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  modelValue?: boolean | string[] | number[]
  binary?: boolean
  value?: string | number
  inputId?: string
  disabled?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  binary: false,
  value: undefined,
  inputId: undefined,
  disabled: false,
  class: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean | string[] | number[]]
  change: [event: Event]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const isFocused = ref(false)

// Генерируем уникальный ID если не передан
const inputId = props.inputId || `checkbox-${Math.random().toString(36).substr(2, 9)}`

const handleChange = (event: Event) => {
  if (props.disabled) return

  const target = event.target as HTMLInputElement
  
  if (props.binary) {
    // Бинарный режим: просто true/false
    emit('update:modelValue', target.checked)
  } else {
    // Режим массива: добавляем/удаляем значение из массива
    const currentValue = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    
    if (target.checked) {
      if (props.value !== undefined && !currentValue.includes(props.value)) {
        currentValue.push(props.value)
      }
    } else {
      if (props.value !== undefined) {
        const index = currentValue.indexOf(props.value)
        if (index > -1) {
          currentValue.splice(index, 1)
        }
      }
    }
    
    emit('update:modelValue', currentValue)
  }
  
  emit('change', event)
}

const handleClick = (event: MouseEvent) => {
  if (props.disabled) {
    event.preventDefault()
    return
  }
  
  // Если клик по кастомному чекбоксу, триггерим реальный input
  if (inputRef.value && event.target !== inputRef.value) {
    inputRef.value.click()
  }
}

const handleLabelClick = (event: MouseEvent) => {
  // Предотвращаем двойной клик, если label кликается вместе с input
  if (event.target === inputRef.value) {
    return
  }
}

// Следим за изменениями modelValue извне
watch(() => props.modelValue, (newValue) => {
  if (inputRef.value) {
    if (props.binary) {
      inputRef.value.checked = Boolean(newValue)
    } else {
      const currentValue = Array.isArray(props.modelValue) ? props.modelValue : []
      inputRef.value.checked = props.value !== undefined && currentValue.includes(props.value)
    }
  }
}, { immediate: true })
</script>

<style scoped>
.checkbox-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
}

.checkbox-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  margin: 0;
  padding: 0;
  pointer-events: none;
}

.checkbox-custom {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  min-width: 20px;
  min-height: 20px;
  border: 2px solid var(--russ-border-dark);
  border-radius: 4px;
  background: var(--russ-bg);
  transition: all 0.2s ease;
  position: relative;
  flex-shrink: 0;
  cursor: pointer;
}

.checkbox-custom:hover:not(.checkbox-disabled) {
  border-color: var(--russ-checkbox-accent);
  background: var(--russ-bg-quaternary);
}

.checkbox-custom.checkbox-focused:not(.checkbox-disabled) {
  outline: none;
  box-shadow: 0 0 0 3px var(--russ-focus-ring);
  border-color: var(--russ-checkbox-accent);
}

.checkbox-custom.checkbox-checked {
  background: var(--russ-checkbox-accent);
  border-color: var(--russ-checkbox-accent);
}

.checkbox-custom.checkbox-checked:hover:not(.checkbox-disabled) {
  background: var(--russ-accent-dark);
  border-color: var(--russ-accent-dark);
}

.checkbox-custom.checkbox-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--russ-bg-disabled);
  border-color: var(--russ-border);
}

.checkbox-checkmark {
  width: 12px;
  height: 12px;
  stroke-width: 2;
  pointer-events: none;
}

.checkbox-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--russ-text-primary);
  cursor: pointer;
  line-height: 1.5;
}

.checkbox-wrapper.checkbox-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.checkbox-wrapper.checkbox-disabled .checkbox-label {
  cursor: not-allowed;
}
</style>
