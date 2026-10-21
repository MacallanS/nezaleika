<template>
  <BaseModal
    :model-value="visible"
    @update:model-value="onCancel"
    :close-on-overlay-click="!loading"
    :closable="!loading"
    :title="title"
    :overlay-z-index="99999"
    size="sm"
    class="confirm-modal-base"
  >
    <div class="confirm-message">{{ message }}</div>
    <div v-if="error" class="confirm-error">{{ error }}</div>

    <template #footer>
      <div class="confirm-actions">
        <button class="btn-cancel" :disabled="loading" @click="onCancel">Нет</button>
        <button class="btn-submit" :disabled="loading" @click="onConfirm">Да</button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { BaseModal } from '@/shared/ui';

interface Props {
  visible: boolean;
  message: string;
  /** Заголовок окна (шапка не остаётся пустой). */
  title?: string;
  error?: string;
  loading?: boolean;
}

interface Emits {
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}

withDefaults(defineProps<Props>(), {
  title: 'Подтверждение',
});
const emit = defineEmits<Emits>();

const onConfirm = () => {
  emit('confirm');
};

const onCancel = () => {
  emit('cancel');
};
</script>

<style scoped>
.confirm-modal-base :deep(.base-modal-header) {
  align-items: center;
  min-height: unset;
  padding: 1.25rem 1.5rem 0.75rem;
}

.confirm-modal-base :deep(.base-modal-title) {
  margin: 0;
  color: var(--russ-text-primary);
  font-size: clamp(16px, calc(16px + (17 - 16) * ((100vw - 320px) / (1920 - 320))), 17px);
  font-weight: 600;
  letter-spacing: 0.01em;
}

.confirm-message {
  font-size: clamp(16px,
      calc(16px + (18 - 16) * ((100vw - 320px) / (1920 - 320))),
      18px);
  font-weight: 600;
  color: var(--russ-text-primary);
  margin-bottom: 1.5rem;
  margin-top: 0;
  line-height: 1.5;
  white-space: pre-line;
}

.confirm-error {
  color: var(--russ-error);
  font-size: clamp(12px,
      calc(12px + (14 - 12) * ((100vw - 320px) / (1920 - 320))),
      14px);
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  background: var(--russ-error-light);
  border-radius: 8px;
  border: 1px solid var(--russ-error-light);
}

.confirm-actions {
  display: flex;
  justify-content: center;
  gap: 1.2rem;
  margin-top: 1.5rem;
}

.btn-cancel,
.btn-submit {
  padding: 1rem 2.2rem;
  border-radius: 12px;
  font-size: clamp(14px,
      calc(14px + (16 - 14) * ((100vw - 320px) / (1920 - 320))),
      16px);
  font-weight: 700;
  transition: all 0.2s;
  cursor: pointer;
  min-width: 130px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px var(--russ-shadow-accent-light);
}

.btn-cancel {
  background: var(--russ-bg-disabled);
  color: var(--russ-text-secondary);
  border: 1.5px solid var(--russ-border-dark);
}

.btn-submit {
  background: linear-gradient(90deg, var(--russ-accent) 0%, var(--russ-accent-light) 100%);
  color: var(--russ-text-inverse);
  border: none;
}

.btn-cancel:hover {
  background: var(--russ-bg-active);
  color: var(--russ-accent);
  border-color: var(--russ-accent);

}

.btn-submit:hover {
  background: linear-gradient(90deg, var(--russ-accent-dark) 0%, var(--russ-accent) 100%);

  box-shadow: 0 4px 12px var(--russ-shadow-accent);
}

.btn-cancel:disabled,
.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 700px) {
  .confirm-actions {
    flex-direction: column;
    gap: 0.8rem;
  }

  .btn-cancel,
  .btn-submit {
    width: 100%;
    font-size: 14px;
    padding: 10px 0;
    border-radius: 7px;
    min-width: 0;
    box-sizing: border-box;
  }
}
</style>
