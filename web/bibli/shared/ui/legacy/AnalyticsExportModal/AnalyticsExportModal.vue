<template>
  <ResponsiveModal
    :model-value="modelValue"
    width="90vw"
    max-width="420px"
    class="analytics-export-modal"
    sheet-height-percent="70"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="analytics-export-header">
        <span class="analytics-export-header-icon" aria-hidden="true">
          <i class="pi pi-chart-line"></i>
        </span>
        <div class="analytics-export-header-info">
          <h3 class="analytics-export-title">Аналитика</h3>
          <span class="analytics-export-subtitle">Выгрузка отчётов в Excel</span>
        </div>
      </div>
    </template>

    <div class="analytics-export-actions">
      <button
        type="button"
        class="analytics-export-btn"
        :disabled="isBusy"
        :aria-busy="isMagnitExporting"
        @click="emit('export-magnit')"
      >
        <span v-if="isMagnitExporting" class="analytics-export-loader" aria-hidden="true"></span>
        <i v-else class="pi pi-download" aria-hidden="true"></i>
        <span>{{ isMagnitExporting ? "Экспорт..." : "Экспорт карт Магнит" }}</span>
      </button>

      <template v-if="ruchnikTypesLoading">
        <button type="button" class="analytics-export-btn" disabled aria-busy="true">
          <span class="analytics-export-loader" aria-hidden="true"></span>
          <span>Загрузка...</span>
        </button>
      </template>

      <template v-else-if="ruchnikTypes.length">
        <button
          v-for="type in ruchnikTypes"
          :key="type.slug"
          type="button"
          class="analytics-export-btn"
          :disabled="isBusy"
          :aria-busy="exportingTypeSlug === type.slug"
          @click="emit('export-ruchniks', type.slug)"
        >
          <span
            v-if="exportingTypeSlug === type.slug"
            class="analytics-export-loader"
            aria-hidden="true"
          ></span>
          <i v-else class="pi pi-download" aria-hidden="true"></i>
          <span>
            {{
              exportingTypeSlug === type.slug
                ? "Экспорт..."
                : `Экспорт ${type.name}`
            }}
          </span>
        </button>
      </template>

      <button v-else type="button" class="analytics-export-btn" disabled>
        <i class="pi pi-download" aria-hidden="true"></i>
        <span>Экспорт ручников недоступен</span>
      </button>
    </div>
  </ResponsiveModal>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ResponsiveModal } from "../ResponsiveModal";
import type { AnalyticsRuchnikType } from "./types";

interface Props {
  modelValue: boolean;
  isMagnitExporting: boolean;
  ruchnikTypes: AnalyticsRuchnikType[];
  ruchnikTypesLoading: boolean;
  exportingTypeSlug: string | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "export-magnit": [];
  "export-ruchniks": [slug: string];
}>();

const isBusy = computed(
  () => props.isMagnitExporting || !!props.exportingTypeSlug || props.ruchnikTypesLoading,
);
</script>

<style scoped>
.analytics-export-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 0;
  width: 100%;
}

.analytics-export-header-icon {
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

.analytics-export-header-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.analytics-export-title {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.2px;
  color: var(--russ-text-primary);
  line-height: 1.2;
}

.analytics-export-subtitle {
  font-size: 13px;
  color: var(--russ-text-tertiary);
  font-weight: 600;
  line-height: 1.35;
}

.analytics-export-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.analytics-export-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  min-height: 52px;
  padding: 14px 18px;
  border: none;
  border-radius: 12px;
  background: var(--russ-accent);
  color: var(--russ-text-inverse);
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition:
    background 0.2s ease,
    opacity 0.2s ease;
  box-shadow: 0 8px 20px var(--russ-accent-tint-18);
}

.analytics-export-btn:hover:not(:disabled) {
  background: var(--russ-accent-dark);
}

.analytics-export-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  box-shadow: none;
}

.analytics-export-btn i {
  font-size: 18px;
}

.analytics-export-loader {
  width: 18px;
  height: 18px;
  border: 3px solid var(--russ-bg);
  border-top-color: transparent;
  border-radius: 50%;
  animation: analytics-export-spin 1s linear infinite;
  flex-shrink: 0;
}

@keyframes analytics-export-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 600px) {
  .analytics-export-title {
    font-size: 18px;
  }

  .analytics-export-subtitle {
    font-size: 12px;
  }

  .analytics-export-btn {
    font-size: 14px;
    padding: 12px 16px;
  }
}
</style>
