<template>
  <BaseModal
    v-model="modalVisible"
    :closable="false"
    :closeOnOverlayClick="false"
    :closeOnEscape="false"
    max-width="600px"
    width="90vw"
    @hide="onHide"
  >
    <template #header>
      <div class="upload-modal-header">
        <h3 class="upload-modal-title">{{ title }}</h3>
        <button class="upload-close-btn" @click="closeModal">
          <i class="pi pi-times"></i>
        </button>
      </div>
    </template>
    <div class="upload-content">
      <div class="modal-body">
        <div class="upload-section">
          <p class="upload-description">
            {{ description }}
          </p>

          <div v-if="!props.isHandler5Or6Mode" class="file-upload-area" @click="triggerFileInput"
            @dragover.prevent="handleDragOver" @dragenter.prevent="handleDragEnter" @dragleave.prevent="handleDragLeave"
            @drop.prevent="handleDrop" :class="{ 'drag-over': isDragOver }">
            <input ref="fileInput" type="file" multiple accept="image/*" @change="handleFileSelect"
              style="display: none;">
            <div class="upload-icon">
              <i class="pi pi-cloud-upload"></i>
            </div>
            <p class="upload-text">
              Нажмите для выбора файлов или перетащите сюда
            </p>
            <p class="upload-hint">
              Поддерживаются форматы: JPG, PNG, WEBP
            </p>
          </div>

          <div v-if="props.isHandler5Or6Mode">
            <div class="card-input-section">
              <label class="card-input-label">Номер карты:</label>
              <input v-model="cardNumber" type="text" class="card-input"
                placeholder="Введите номер карты (цифры и буквы)" maxlength="24" @input="formatCardNumber" />
            </div>

            <div v-if="props.handlerType === 'handler6'" class="mobile-app-checkbox">
              <Checkbox v-model="mobileAppIssued" :binary="true" inputId="mobile-app-issued" />
              <label for="mobile-app-issued" class="mobile-app-checkbox-label">
                Уже выдал приложение «Магнит»
              </label>
            </div>
          </div>

          <div v-if="!props.isHandler5Or6Mode && selectedFiles.length > 0" class="selected-files">
            <h4>Выбранные файлы ({{ selectedFiles.length }}{{ maxFiles ? `/${maxFiles}` : '' }}):</h4>
            <div class="file-list">
              <div v-for="(file, index) in selectedFiles" :key="index" class="file-item">
                <div class="file-info">
                  <i class="pi pi-image file-icon"></i>
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-size">({{ formatFileSize(file.size) }})</span>
                </div>
                <button class="remove-file-btn" @click="removeFile(index)">
                  <i class="pi pi-times"></i>
                </button>
              </div>
            </div>
          </div>


          <div class="upload-actions">
            <Button v-if="!props.uploadSuccess" :label="uploadButtonLabel" class="upload-btn" :loading="isUploading"
              :disabled="isUploadDisabled" @click="handleUpload" />
            <Button label="Отмена" class="cancel-btn" severity="secondary" @click="closeModal" />
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Button, BaseModal, Checkbox } from '@/shared/ui';

defineOptions({
  inheritAttrs: false
});

interface Props {
  visible: boolean;
  title?: string;
  description?: string;
  uploadButtonText?: string;
  maxFiles?: number;
  maxFileSize?: number;
  isHandler5Or6Mode?: boolean;
  handlerType?: 'handler5' | 'handler6';
  uploadSuccess?: boolean;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'upload', files: File[]): void;
  (e: 'uploadHandler5Or6', data: { cardNumber: string; mobileAppIssued?: boolean }): void;
  (e: 'subscribe', data?: any): void;
  (e: 'close'): void;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Загрузка документов',
  description: 'Загрузите фотографию',
  uploadButtonText: 'Загрузить документы',
  maxFiles: 5,
  maxFileSize: 1,
  isHandler5Or6Mode: false,
  handlerType: 'handler5',
  uploadSuccess: false
});

const emit = defineEmits<Emits>();

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFiles = ref<File[]>([]);
const isUploading = ref(false);
const isDragOver = ref(false);

const cardNumber = ref<string>('');
const mobileAppIssued = ref(false);
const uploadSuccess = ref(false);

// Computed для совместимости между visible/update:visible и v-model
const modalVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
});

const uploadButtonLabel = computed(() => props.isHandler5Or6Mode ? 'Отправить данные' : props.uploadButtonText);

const isUploadDisabled = computed(() => {
  if (isUploading.value) return true;

  if (props.isHandler5Or6Mode) {
    return !cardNumber.value.trim();
  }

  return selectedFiles.value.length === 0 || (props.maxFiles ? selectedFiles.value.length > props.maxFiles : false);
});

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = Array.from(target.files || []);
  addFiles(files);
};

const addFiles = (files: File[]) => {
  const validFiles: File[] = [];

  for (const file of files) {
    if (props.maxFileSize && file.size > props.maxFileSize * 1024 * 1024) {
      console.warn(`Файл ${file.name} слишком большой. Максимальный размер: ${props.maxFileSize}MB`);
      continue;
    }

    if (!file.type.startsWith('image/')) {
      console.warn(`Файл ${file.name} не является изображением`);
      continue;
    }

    validFiles.push(file);
  }

  if (props.maxFiles) {
    const availableSlots = Math.max(props.maxFiles - selectedFiles.value.length, 0);
    if (availableSlots === 0) {
      return;
    }
    selectedFiles.value = [...selectedFiles.value, ...validFiles.slice(0, availableSlots)];
  } else {
    selectedFiles.value = [...selectedFiles.value, ...validFiles];
  }
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = true;
};

const handleDragEnter = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = true;
};

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = false;
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = false;
  const files = Array.from(event.dataTransfer?.files || []);
  addFiles(files);
};

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1);
};

const formatCardNumber = (event: Event) => {
  const target = event.target as HTMLInputElement;
  let value = target.value.toUpperCase();
  value = value.replace(/[^A-Z0-9]/g, '');
  cardNumber.value = value;
};

const handleUpload = () => {
  if (props.isHandler5Or6Mode) {
    if (!cardNumber.value.trim()) return;

    isUploading.value = true;
    emit('uploadHandler5Or6', {
      cardNumber: cardNumber.value.trim(),
      mobileAppIssued: mobileAppIssued.value
    });
  } else {
    if (selectedFiles.value.length === 0) return;

    isUploading.value = true;
    emit('upload', selectedFiles.value);
  }
};

const closeModal = () => {
  modalVisible.value = false;
  emit('close');
};

const onHide = () => {
  selectedFiles.value = [];
  isDragOver.value = false;
  isUploading.value = false;
  if (fileInput.value) {
    fileInput.value.value = '';
  }

  cardNumber.value = '';
  mobileAppIssued.value = false;
  uploadSuccess.value = false;
};

watch(() => props.visible, (newValue) => {
  if (!newValue) {
    onHide();
  } else {
    cardNumber.value = '';
    mobileAppIssued.value = false;
    uploadSuccess.value = false;
    isUploading.value = false;
  }
});

watch(() => props.uploadSuccess, (newValue, oldValue) => {
  if (!newValue && oldValue) {
    uploadSuccess.value = false;
  }
});
</script>

<style scoped>
.upload-content {
  background: white;
  overflow: hidden;
  padding: 0;
}

.upload-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0;
  margin: 0;
}

.upload-modal-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--russ-text-primary);
  margin: 0;
}

.upload-close-btn {
  background: none;
  border: none;
  color: var(--russ-text-tertiary);
  font-size: 18px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.upload-close-btn:hover {
  background: var(--russ-bg-tertiary);
  color: var(--russ-text-secondary);
}

.upload-section {
  text-align: center;
  max-width: 100%;
  margin-top: 10px;
}

.upload-description {
  display: none;
}

.file-upload-area {
  border: 2px dashed var(--russ-border-light);
  border-radius: 12px;
  padding: 24px 16px;
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--russ-bg-secondary);
}

.file-upload-area:hover,
.file-upload-area.drag-over {
  border-color: var(--russ-accent-dark);
  background: var(--russ-bg-blue-light);
}

.upload-icon {
  color: var(--russ-accent-dark);
  margin-bottom: 8px;
}

.upload-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--russ-text-primary);
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 14px;
  color: var(--russ-text-tertiary);
  margin: 0;
}

.selected-files {
  margin-bottom: 30px;
  text-align: left;
}

.selected-files h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--russ-text-primary);
  margin-bottom: 16px;
  text-align: center;
}

.file-list {
  overflow-y: auto;
  max-height: 200px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--russ-bg-secondary);
  border: 1px solid var(--russ-border-light);
  border-radius: 8px;
  margin-bottom: 8px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.file-icon {
  color: var(--russ-accent-dark);
  font-size: 20px;
}

.file-name {
  font-weight: 500;
  color: var(--russ-text-primary);
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  color: var(--russ-text-tertiary);
  font-size: 14px;
}

.remove-file-btn {
  background: var(--russ-error-light);
  color: var(--russ-error);
  border: none;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.remove-file-btn:hover {
  background: var(--russ-error-light);
  color: var(--russ-error-dark);
  transform: scale(1.05);
}

.upload-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.upload-btn {
  background: var(--russ-accent-dark);
  border: 1px solid var(--russ-accent-dark);
  color: var(--russ-text-inverse);
  padding: 12px 32px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-btn:hover:not(:disabled) {
  background: var(--russ-accent-dark);
  border-color: var(--russ-accent-dark);
  box-shadow: 0 4px 12px var(--russ-shadow-accent);
}

.upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-btn {
  padding: 12px 32px;
  border-radius: 8px;
  font-weight: 600;
  background: var(--russ-bg-secondary);
  border: 1px solid var(--russ-border-light);
  color: var(--russ-text-tertiary);
}

.cancel-btn:hover {
  background: var(--russ-bg-tertiary);
  border-color: var(--russ-border-light);
  color: var(--russ-text-secondary);
}

/* Handler 6 specific styles */
.card-input-section {
  margin-bottom: 20px;
  text-align: left;
}

.card-input-label {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: var(--russ-text-primary);
  margin-bottom: 8px;
}

.card-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--russ-border-light);
  border-radius: 8px;
  font-size: 16px;
  font-family: var(--russ-font-family-mono);
  letter-spacing: 1px;
  transition: all 0.2s ease;
}

.card-input:focus {
  outline: none;
  border-color: var(--russ-input-border-focus);
  box-shadow: 0 0 0 3px var(--russ-shadow-accent-light);
}

.mobile-app-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.mobile-app-checkbox-label {
  font-size: 14px;
  color: var(--russ-text-primary);
}

/* Success section styles */
.success-section {
  margin-bottom: 20px;
  text-align: center;
}

.success-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: var(--russ-info-light);
  border: 2px solid var(--russ-info);
  border-radius: 8px;
}

.success-icon {
  color: var(--russ-info);
  font-size: 24px;
}

.success-message p {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--russ-info-dark);
}
</style>
