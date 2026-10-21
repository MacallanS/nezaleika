<template>
  <BaseModal
    :model-value="modelValue"
    width="90vw"
    max-width="480px"
    class="staff-registry-export-modal"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="staff-registry-export-header">
        <span class="staff-registry-export-header-icon" aria-hidden="true">
          <i class="pi pi-file-excel"></i>
        </span>
        <div class="staff-registry-export-header-info">
          <h3 class="staff-registry-export-title">Реестр по проектам</h3>
          <span class="staff-registry-export-subtitle">
            Excel со сводкой и отдельным листом на каждый проект
          </span>
        </div>
      </div>
    </template>

    <div class="staff-registry-export-body">
      <label class="staff-registry-export-field">
        <span class="staff-registry-export-label">Исключить регистрации за период</span>
        <span class="staff-registry-export-hint">
          Необязательно. Сотрудники, зарегистрированные в эти даты, не попадут в выгрузку.
        </span>
        <DateRangePicker
          :model-value="excludeDateRange"
          placeholder="Период не выбран"
          @update:model-value="excludeDateRange = $event"
        />
      </label>
    </div>

    <template #footer>
      <button
        type="button"
        class="staff-registry-export-cancel"
        :disabled="isExporting"
        @click="emit('update:modelValue', false)"
      >
        Отмена
      </button>
      <button
        type="button"
        class="staff-registry-export-submit"
        :disabled="isExporting"
        :aria-busy="isExporting"
        @click="handleExport"
      >
        <span v-if="isExporting" class="staff-registry-export-loader" aria-hidden="true"></span>
        <i v-else class="pi pi-download" aria-hidden="true"></i>
        <span>{{ isExporting ? 'Выгрузка...' : 'Скачать Excel' }}</span>
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { BaseModal } from '../BaseModal';
import { DateRangePicker } from '../DateRangePicker';
import type { StaffRegistryByProjectsExportParams } from './types';

interface DateRangeValue {
  from?: Date | null;
  to?: Date | null;
}

interface Props {
  modelValue: boolean;
  exportFn: (params: StaffRegistryByProjectsExportParams) => Promise<Blob>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  exported: [];
  error: [message: string];
}>();

const excludeDateRange = ref<DateRangeValue>({ from: null, to: null });
const isExporting = ref(false);

function formatDateForAPI(date: Date | null | undefined): string | undefined {
  if (!date) {
    return undefined;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

async function handleExport() {
  if (isExporting.value) {
    return;
  }

  const from = excludeDateRange.value.from;
  const to = excludeDateRange.value.to;

  if ((from && !to) || (!from && to)) {
    emit('error', 'Укажите обе даты периода исключения или очистите поле');
    return;
  }

  isExporting.value = true;

  try {
    const params: StaffRegistryByProjectsExportParams = {};

    const excludeFrom = formatDateForAPI(from);
    const excludeTo = formatDateForAPI(to);
    if (excludeFrom && excludeTo) {
      params.exclude_registered_from = excludeFrom;
      params.exclude_registered_to = excludeTo;
    }

    const blob = await props.exportFn(params);
    const today = new Date().toISOString().split('T')[0];
    downloadBlob(blob, `staff_registry_${today}_by_projects.xlsx`);
    emit('exported');
    emit('update:modelValue', false);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Не удалось сформировать выгрузку';
    emit('error', message);
  } finally {
    isExporting.value = false;
  }
}
</script>

<style scoped>
.staff-registry-export-header {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
}

.staff-registry-export-header-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: var(--russ-primary);
  border-radius: 12px;
  padding: 11px;
  background: var(--russ-bg-tertiary);
  flex-shrink: 0;
}

.staff-registry-export-header-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.staff-registry-export-title {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: var(--russ-text-primary);
  line-height: 1.2;
}

.staff-registry-export-subtitle {
  font-size: 13px;
  color: var(--russ-text-tertiary);
  font-weight: 600;
  line-height: 1.35;
}

.staff-registry-export-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.staff-registry-export-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.staff-registry-export-label {
  font-size: 14px;
  font-weight: 700;
  color: var(--russ-text-primary);
}

.staff-registry-export-hint {
  font-size: 12px;
  line-height: 1.45;
  color: var(--russ-text-muted);
}

.staff-registry-export-cancel,
.staff-registry-export-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.staff-registry-export-cancel {
  border: 1px solid var(--russ-border);
  background: var(--russ-bg);
  color: var(--russ-text-secondary);
}

.staff-registry-export-submit {
  border: none;
  background: var(--russ-accent-dark);
  color: var(--russ-text-inverse);
}

.staff-registry-export-cancel:disabled,
.staff-registry-export-submit:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.staff-registry-export-loader {
  width: 16px;
  height: 16px;
  border: 2px solid color-mix(in srgb, currentColor 35%, transparent);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: staff-registry-export-spin 0.8s linear infinite;
}

@keyframes staff-registry-export-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
