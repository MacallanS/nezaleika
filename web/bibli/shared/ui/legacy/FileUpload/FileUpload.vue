<template>
  <div :class="['file-upload', { 'file-upload-disabled': disabled }, props.class]">
    <input
      ref="fileInputRef"
      type="file"
      :accept="accept"
      :multiple="multiple"
      :disabled="disabled"
      class="file-upload-input"
      @change="handleFileChange"
    />
    <button
      type="button"
      :class="['file-upload-button', { 'file-upload-button-disabled': disabled }]"
      :disabled="disabled"
      @click="handleButtonClick"
    >
      <span v-if="icon && !iconRight" class="file-upload-icon">
        <i :class="icon"></i>
      </span>
      <span class="file-upload-label">
        {{ chooseLabel }}
      </span>
      <span v-if="icon && iconRight" class="file-upload-icon file-upload-icon-right">
        <i :class="icon"></i>
      </span>
    </button>
    <div v-if="errorMessage" class="file-upload-error">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  mode?: 'basic' | 'advanced'
  accept?: string
  multiple?: boolean
  maxFileSize?: number
  chooseLabel?: string
  disabled?: boolean
  auto?: boolean
  icon?: string
  iconRight?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'basic',
  accept: undefined,
  multiple: false,
  maxFileSize: undefined,
  chooseLabel: 'Выбрать файл',
  disabled: false,
  auto: false,
  icon: undefined,
  iconRight: false,
  class: ''
})

const emit = defineEmits<{
  select: [event: { files: File[]; originalEvent: Event }]
  error: [event: { message: string }]
  clear: []
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const errorMessage = ref<string>('')

const validateFile = (file: File): string | null => {
  if (props.maxFileSize && file.size > props.maxFileSize) {
    const maxSizeMB = (props.maxFileSize / 1024 / 1024).toFixed(2)
    return `Размер файла превышает ${maxSizeMB} MB`
  }
  return null
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files ? Array.from(target.files) : []
  
  if (files.length === 0) {
    return
  }

  errorMessage.value = ''
  const validFiles: File[] = []
  const errors: string[] = []

  for (const file of files) {
    const error = validateFile(file)
    if (error) {
      errors.push(`${file.name}: ${error}`)
    } else {
      validFiles.push(file)
    }
  }

  if (errors.length > 0) {
    errorMessage.value = errors.join('; ')
    emit('error', { message: errorMessage.value })
    // Очищаем input, чтобы можно было выбрать файл снова
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
    return
  }

  if (validFiles.length > 0) {
    emit('select', { files: validFiles, originalEvent: event })
    
    // Если auto=false, не очищаем input (пользователь может выбрать другой файл)
    // Если auto=true, очищаем после выбора
    if (props.auto && fileInputRef.value) {
      // Не очищаем сразу, чтобы файл оставался выбранным
      // Очистка произойдет при следующем выборе или через clear()
    }
  }
}

const handleButtonClick = () => {
  if (!props.disabled && fileInputRef.value) {
    fileInputRef.value.click()
  }
}

const clear = () => {
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
  errorMessage.value = ''
  emit('clear')
}

// Экспортируем метод clear для использования извне
defineExpose({
  clear
})

// Очищаем ошибку при изменении пропсов
watch(() => props.maxFileSize, () => {
  errorMessage.value = ''
})
</script>

<style scoped>
.file-upload {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.file-upload-input {
  display: none;
}

.file-upload-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0.75rem 1.5rem;
  font-family: var(--russ-font-family);
  font-size: clamp(
    14px,
    calc(14px + (18 - 14) * ((100vw - 320px) / (1920 - 320))),
    18px
  );
  font-weight: 500;
  line-height: 1.5;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  border: 1.5px solid var(--russ-border);
  border-radius: 10px;
  transition: all 0.2s ease;
  background: var(--russ-bg-quaternary);
  color: var(--russ-text-primary);
  min-height: 2.5rem;
  box-shadow: 0 1px 4px var(--russ-shadow-accent-light);
}

.file-upload-button:hover:not(:disabled):not(.file-upload-button-disabled) {
  background: var(--russ-bg);
  border-color: var(--russ-border-dark);
  box-shadow: none;
}

.file-upload-button:focus {
  outline: none;
  border-color: var(--russ-secondary);
  box-shadow: 1px 0px 5px 5px var(--russ-shadow-color);
  background: var(--russ-bg);
}

.file-upload-button:active:not(:disabled):not(.file-upload-button-disabled) {
  background: var(--russ-bg-hover);
  border-color: var(--russ-border-dark);
}

.file-upload-button:disabled,
.file-upload-button-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.file-upload-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-upload-icon {
  display: inline-flex;
  align-items: center;
  font-size: 1rem;
}

.file-upload-icon-right {
  order: 2;
}

.file-upload-error {
  color: var(--russ-error);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.file-upload-disabled {
  opacity: 0.6;
  pointer-events: none;
}
</style>
