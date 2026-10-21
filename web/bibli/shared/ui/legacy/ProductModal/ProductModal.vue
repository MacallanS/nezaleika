<template>
  <BaseModal
    v-model="modalVisible"
    width="95vw"
    max-width="800px"
    max-height="85vh"
    class="product-modal"
    :title="isEditMode ? 'Редактировать продукт' : 'Создать новый продукт'"
    @hide="onHide"
  >
    <div class="product-form">
      <div class="form-grid">
        <div class="form-row form-row-full">
          <label for="product-name" class="form-label">Название продукта</label>
          <InputText
            id="product-name"
            :model-value="productForm.name"
            @update:model-value="updateField('name', $event)"
            variant="off"
            class="w-full"
            placeholder="Введите название продукта"
          />
        </div>

        <div class="form-row">
          <label for="product-handler" class="form-label">Тип продукта (handler_id)</label>
          <InputText
            id="product-handler"
            :model-value="productForm.handler_id"
            @update:model-value="updateField('handler_id', $event)"
            type="number"
            variant="off"
            class="w-full"
            placeholder="Например: 8"
          />
        </div>
      </div>

      <div class="form-row logo-row">
        <label class="form-label">Логотип продукта</label>
        <div class="logo-upload">
          <div class="logo-preview-container">
            <img
              v-if="logoPreview || productForm.logo"
              :src="logoPreview || productForm.logo"
              :alt="logoPreview ? 'Превью загруженного логотипа' : 'Текущий логотип'"
              class="logo-preview"
            />
            <div v-else class="logo-placeholder">
              <i class="pi pi-image"></i>
              <span>Логотип не загружен</span>
            </div>
          </div>
          <div class="logo-controls">
            <FileUpload
              mode="basic"
              :auto="true"
              accept="image/*"
              :maxFileSize="1000000"
              @select="handleLogoSelect"
              chooseLabel="Выбрать файл"
              class="w-full"
            />
            <button
              v-if="logoPreview || productForm.logo"
              type="button"
              class="remove-logo-btn-inline"
              @click="handleRemoveLogo"
              title="Удалить логотип"
            >
              <svg viewBox="0 0 24 24" class="remove-icon">
                <path
                  d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                />
              </svg>
              Удалить
            </button>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <div class="form-actions flex gap-2 mt-4">
        <Button
          v-if="showManageMetrics && isEditMode"
          label="Метрики"
          @click="emit('manage-metrics')"
          class="custom-button-text metrics-btn"
        />
        <Button :label="isEditMode ? 'Сохранить' : 'Создать'" @click="handleSubmit" class="create-btn" />
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { BaseModal, InputText, Button, FileUpload } from '@/shared/ui';

interface ProductForm {
  name?: string;
  handler_id?: string;
  category_id?: string;
  logo?: string;
}

interface Props {
  visible: boolean;
  isEditMode: boolean;
  productForm: ProductForm;
  logoPreview?: string | null;
  showManageMetrics?: boolean;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'update:product-form', value: ProductForm): void;
  (e: 'logo-select', event: { files: File[] }): void;
  (e: 'remove-logo'): void;
  (e: 'submit'): void;
  (e: 'manage-metrics'): void;
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const modalVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
});

const updateField = (field: keyof ProductForm, value: any) => {
  emit('update:product-form', { ...props.productForm, [field]: value });
};

const handleLogoSelect = (event: { files: File[]; originalEvent: Event }) => {
  // FileUpload emits event with files property
  if (event.files && event.files.length > 0) {
    emit('logo-select', { files: event.files });
  }
};

const handleRemoveLogo = () => {
  emit('remove-logo');
};

const handleSubmit = () => {
  emit('submit');
};

const onHide = () => {
  emit('close');
};
</script>

<style scoped>
.product-modal .base-modal-content {
  min-width: 0;
  max-width: 100%;
  overflow-x: hidden;
}

.product-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  padding: 0.25rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
  background: var(--russ-bg-secondary);
  border: 1px solid var(--russ-border);
  border-radius: 14px;
  padding: 0.9rem;
}

.form-row-full {
  grid-column: 1 / -1;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
  max-width: 100%;
}

.product-form .input-wrapper,
.product-form .custom-input {
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

.form-label {
  font-weight: 600;
  color: var(--russ-text-secondary);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.01em;
}

:deep(.product-form .custom-input),
:deep(.product-form .base-select-combo) {
  background: var(--russ-text-inverse) !important;
  border-radius: 10px !important;
  border: 1px solid var(--russ-border) !important;
  box-shadow: none !important;
}

:deep(.product-form .custom-input:focus),
:deep(.product-form .base-select-combo:focus-within) {
  border-color: var(--russ-accent) !important;
}

.logo-upload {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
  max-width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--russ-border);
  border-radius: 14px;
  background: var(--russ-bg-secondary);
}

.product-form .file-upload {
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

.logo-preview-container {
  position: relative;
  width: 124px;
  height: 124px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--russ-border);
  background: var(--russ-text-inverse);
  flex-shrink: 0;
}

.logo-preview {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.logo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  color: var(--russ-text-tertiary);
  font-size: 12px;
  text-align: center;
  padding: 0.75rem;
}

.logo-controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.remove-logo-btn-inline {
  border: 1px solid var(--russ-border);
  background: var(--russ-text-inverse);
  color: var(--russ-error);
  border-radius: 8px;
  padding: 8px 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

.remove-logo-btn-inline:hover {
  border-color: var(--russ-error);
  background: var(--russ-error-light);
}

.remove-icon {
  width: 16px;
  height: 16px;
  fill: var(--russ-error);
}

.product-form .base-select-wrapper {
  min-width: 0;
  max-width: 100%;
  width: 100%;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.25rem;
  width: 100%;
  justify-content: space-between;
  align-items: center;
}

.form-actions .create-btn {
  flex: 0 0 auto;
  min-width: 180px;
  background: var(--russ-accent-dark) !important;
  color: var(--russ-text-inverse) !important;
  border: 1px solid var(--russ-accent-dark) !important;
  border-radius: 8px !important;
  padding: 0.65rem 0.9rem !important;
  font-weight: 600 !important;
  transition: all 0.2s ease !important;
}

.form-actions .create-btn:hover {
  background: var(--russ-accent-dark) !important;
  border-color: var(--russ-accent-dark) !important;
  box-shadow: 0 2px 8px rgba(29, 76, 210, 0.2) !important;
}

.form-actions .metrics-btn {
  flex: 0 0 auto;
  min-width: 110px;
  padding: 0.65rem 0.9rem !important;
  background: var(--russ-text-inverse) !important;
  color: var(--russ-text-secondary) !important;
  border: 1px solid var(--russ-border) !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  transition: border-color 0.2s ease, color 0.2s ease, background-color 0.2s ease !important;
  box-shadow: none !important;
}

.form-actions .metrics-btn:hover {
  background: var(--russ-bg-secondary) !important;
  border-color: var(--russ-accent) !important;
  color: var(--russ-accent-dark) !important;
  box-shadow: none !important;
}

.form-actions .metrics-btn:active,
.form-actions .metrics-btn:focus,
.form-actions .metrics-btn:focus-visible {
  background: var(--russ-bg-secondary) !important;
  border-color: var(--russ-accent) !important;
  color: var(--russ-accent-dark) !important;
  box-shadow: none !important;
}

@media (max-width: 720px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .logo-upload {
    flex-direction: column;
    align-items: stretch;
  }

  .logo-preview-container {
    width: 100%;
    max-width: 220px;
    height: 120px;
    margin: 0 auto;
  }
}

</style>
