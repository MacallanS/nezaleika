<template>
  <BaseModal
    v-model="modalVisible"
    class="final-modal"
    :closable="false"
    :close-on-overlay-click="false"
    :close-on-escape="false"
    @hide="onHide"
  >
    <div class="final-modal-content success-modal-content">
      <div class="success-icon-block">
        <i class="pi pi-check success-icon"></i>
      </div>
      <h2 class="success-title">Процесс выдачи</h2>
      <div class="success-subtitle">Продолжите выдачу продукта в Альфа Селфи</div>
      <div v-if="hasClientInfo" class="final-client-info grid-client-info">
        <div v-if="clientSurname" class="final-client-row">
          <span class="final-client-label">Фамилия:</span>
          <span class="final-client-value copyable">
            {{ clientSurname }}
            <Button icon="pi pi-copy" class="p-button-text copy-icon-btn" @click="copyToClipboard(clientSurname)" />
          </span>
        </div>
        <div v-if="clientName" class="final-client-row">
          <span class="final-client-label">Имя:</span>
          <span class="final-client-value copyable">
            {{ clientName }}
            <Button icon="pi pi-copy" class="p-button-text copy-icon-btn" @click="copyToClipboard(clientName)" />
          </span>
        </div>
        <div v-if="clientPatronymic" class="final-client-row">
          <span class="final-client-label">Отчество:</span>
          <span class="final-client-value copyable">
            {{ clientPatronymic }}
            <Button icon="pi pi-copy" class="p-button-text copy-icon-btn" @click="copyToClipboard(clientPatronymic)" />
          </span>
        </div>
        <div v-if="clientPhone" class="final-client-row">
          <span class="final-client-label">Телефон:</span>
          <span class="final-client-value copyable">
            {{ clientPhone }}
            <Button icon="pi pi-copy" class="p-button-text copy-icon-btn" @click="copyToClipboard(clientPhone)" />
          </span>
        </div>
        <div v-if="clientEmail" class="final-client-row">
          <span class="final-client-label">Email:</span>
          <span class="final-client-value copyable">
            {{ clientEmail }}
            <Button icon="pi pi-copy" class="p-button-text copy-icon-btn" @click="copyToClipboard(clientEmail)" />
          </span>
        </div>
      </div>
      <div v-if="link" class="final-modal-link-block">
        <a :href="link" target="_blank" class="final-modal-link">Перейти по ссылке</a>
      </div>
      <Button label="Закрыть" class="close-modal-btn" @click="close" />
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { BaseModal, Button } from '~/shared/ui';
import { useToast } from '../Toast';
import { writeClipboardText } from '../../../utils/copyToClipboard';

interface Props {
  visible: boolean;
  clientSurname?: string;
  clientName?: string;
  clientPatronymic?: string;
  clientPhone?: string;
  clientEmail?: string;
  link?: string;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const toast = useToast();

const modalVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
});

const hasClientInfo = computed(() => {
  return !!(props.clientSurname || props.clientName || props.clientPatronymic || props.clientPhone || props.clientEmail);
});

const copyToClipboard = async (text: string) => {
  const ok = await writeClipboardText(text);
  if (ok) {
    toast.add({ severity: 'success', summary: 'Скопировано', detail: 'Текст скопирован в буфер обмена', life: 2000 });
    return;
  }
  toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Не удалось скопировать текст', life: 3000 });
};

const close = () => {
  modalVisible.value = false;
  emit('close');
};

const onHide = () => {
  emit('close');
};
</script>

<style scoped>
.final-modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem 1.5rem;
  text-align: center;
}

.success-modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  text-align: center;
}

.success-icon-block {
  margin-bottom: 1rem;
}

.success-icon {
  color: var(--russ-success);
  font-size: 48px;
}

.success-title {
  font-weight: 700;
  margin-bottom: 0.5rem;
  font-size: 24px;
  color: var(--russ-text-primary);
}

.success-subtitle {
  color: var(--russ-text-tertiary);
  margin-bottom: 1.2rem;
  font-size: 16px;
}

.grid-client-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 1.2rem 0 1.2rem 0;
  background: var(--russ-bg-secondary);
  border-radius: 10px;
  padding: 1.1rem 1.2rem;
  border: 1px solid var(--russ-border-light);
  width: 100%;
  text-align: left;
}

.grid-client-info .final-client-row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.grid-client-info .final-client-label {
  min-width: 90px;
  color: var(--russ-value);
  font-weight: 600;
}

.grid-client-info .final-client-value {
  color: var(--russ-text-primary);
  font-weight: 500;
  word-break: break-all;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex: 1;
}

.copy-icon-btn {
  margin-left: 0.4em;
  padding: 0 0.2em;
  vertical-align: middle;
}

.final-modal-link-block {
  margin: 1rem 0;
}

.final-modal-link {
  color: var(--russ-accent);
  font-weight: 600;
  text-decoration: underline;
  word-break: break-all;
}

.close-modal-btn {
  width: 100%;
  max-width: 260px;
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .final-modal-content {
    padding: 1.5rem 1rem !important;
    gap: 1.2rem !important;
  }

  .success-modal-content {
    padding: 1.5rem 1rem 1.2rem 1rem !important;
  }

  .success-title {
    font-size: calc(1.2rem + 0.3vw) !important;
  }

  .success-subtitle {
    font-size: calc(0.95rem + 0.2vw) !important;
    margin-bottom: 1rem !important;
  }

  .grid-client-info {
    padding: 1rem 0.8rem !important;
    margin: 1rem 0 !important;
    gap: 0.6rem !important;
  }

  .grid-client-info .final-client-row {
    font-size: calc(0.95rem + 0.1vw) !important;
    gap: 0.6rem !important;
  }

  .grid-client-info .final-client-label {
    min-width: 80px !important;
    font-size: calc(0.9rem + 0.1vw) !important;
  }

  .grid-client-info .final-client-value {
    font-size: calc(0.9rem + 0.1vw) !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    max-width: calc(100% - 90px) !important;
  }

  .final-modal-link {
    font-size: calc(0.95rem + 0.1vw) !important;
  }

  .close-modal-btn {
    font-size: calc(0.9rem + 0.2vw) !important;
    padding: calc(0.6rem + 0.2vw) 0 !important;
  }
}

@media (max-width: 600px) {
  .final-modal-content {
    padding: 1.2rem 0.8rem !important;
    gap: 1rem !important;
  }

  .success-modal-content {
    padding: 1.2rem 0.8rem 1rem 0.8rem !important;
  }

  .success-icon {
    font-size: calc(2rem + 0.5vw) !important;
  }

  .success-title {
    font-size: calc(1.1rem + 0.2vw) !important;
  }

  .success-subtitle {
    font-size: calc(0.9rem + 0.15vw) !important;
    margin-bottom: 0.8rem !important;
  }

  .grid-client-info {
    padding: 0.8rem 0.6rem !important;
    margin: 0.8rem 0 !important;
    gap: 0.5rem !important;
  }

  .grid-client-info .final-client-row {
    font-size: calc(0.9rem + 0.1vw) !important;
    gap: 0.5rem !important;
  }

  .grid-client-info .final-client-label {
    min-width: 70px !important;
    font-size: calc(0.85rem + 0.1vw) !important;
  }

  .grid-client-info .final-client-value {
    font-size: calc(0.85rem + 0.1vw) !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    max-width: calc(100% - 80px) !important;
  }

  .final-modal-link {
    font-size: calc(0.9rem + 0.1vw) !important;
  }

  .close-modal-btn {
    font-size: calc(0.85rem + 0.2vw) !important;
    padding: calc(0.5rem + 0.2vw) 0 !important;
  }
}
</style>
