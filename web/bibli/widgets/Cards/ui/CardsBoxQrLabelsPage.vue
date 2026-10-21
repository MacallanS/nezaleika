<template>
  <div class="cards-root qr-labels-page">
    <CardsPageShell
      variant="warehouse"
      :refresh-loading="centralLoading || allBoxesLoading"
      @refresh="reload"
      @project-change="reload"
    >
      <CardsContentBlock
        title="Коробки"
        lead="Что попадёт в файл для печати наклеек."
      >
        <div class="qr-choices" role="radiogroup" aria-label="Какие коробки">
          <button
            type="button"
            class="qr-choice"
            :class="{ 'qr-choice--on': mode === 'all_office' }"
            @click="mode = 'all_office'"
          >
            <span class="qr-choice__title">Весь склад</span>
            <span class="qr-choice__hint">
              <template v-if="centralLoading">Загрузка…</template>
              <template v-else>{{ warehouseBoxCount }} в офисе</template>
            </span>
          </button>
          <button
            type="button"
            class="qr-choice"
            :class="{ 'qr-choice--on': mode === 'pick' }"
            @click="mode = 'pick'"
          >
            <span class="qr-choice__title">Отметить в списке</span>
            <span class="qr-choice__hint">По умолчанию только офис; можно добавить в пути и на точках</span>
          </button>
        </div>

        <div v-if="mode === 'pick'" class="qr-picker">
          <label class="qr-picker__scope">
            <input v-model="includeAllBoxes" type="checkbox" />
            <span>Показать все коробки: в пути и на точках</span>
          </label>
          <p v-if="pickerLoading" class="hint">Загрузка списка…</p>
          <CardsBoxPicker
            v-else
            :model-value="pickedBoxIds"
            :boxes="pickerBoxes"
            multiple
            list-first
            scan-position="bottom"
            scan-label="Добавить по QR"
            empty-text="Нет коробок для печати."
            scan-not-in-list-text="Коробка #{id} не в списке"
            @update:model-value="onPickedBoxes"
          />
        </div>
      </CardsContentBlock>

      <CardsContentBlock
        title="Скачивание"
        lead="Каждая коробка — отдельный PNG 58×40 мм. Все файлы в одном ZIP."
      >
        <div class="qr-format-card">
          <p class="qr-format-card__title">PNG 58×40 мм</p>
          <p class="qr-format-card__hint">
            В архиве файлы вида <code>box-57-Sheet56.png</code> — откройте и печатайте на термопринтере
            или вставьте в свою программу печати.
          </p>
        </div>

        <p class="qr-summary" aria-live="polite">{{ summaryLine }}</p>
      </CardsContentBlock>

      <div class="field-sticky-footer qr-footer">
        <AuthRRButton
          variant="brand-primary"
          :label="downloadLabel"
          :loading="downloading"
          :disabled="downloading || downloadDisabled"
          @click="download"
        />
      </div>
    </CardsPageShell>
  </div>
</template>

<script setup lang="ts">
import { onActivated } from "vue";
import { AuthRRButton } from "bibli/shared/ui/rr";
import CardsPageShell from "./CardsPageShell.vue";
import CardsContentBlock from "./CardsContentBlock.vue";
import CardsBoxPicker from "./CardsBoxPicker.vue";
import { useCardsBoxQrLabels } from "../composables/useCardsBoxQrLabels";
import "./cards-shared.css";

const {
  mode,
  pickedBoxIds,
  pickerBoxes,
  includeAllBoxes,
  pickerLoading,
  centralLoading,
  allBoxesLoading,
  downloading,
  warehouseBoxCount,
  downloadDisabled,
  downloadLabel,
  summaryLine,
  onPickedBoxes,
  download,
  reload,
} = useCardsBoxQrLabels();

onActivated(() => {
  void reload();
});
</script>

<style scoped>
.qr-labels-page {
  padding-bottom: calc(16px + var(--app-mobile-tabbar-content-inset, env(safe-area-inset-bottom, 0px)));
}

.qr-choices {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qr-choices--stack {
  margin-top: 8px;
}

.qr-choice {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--rr-stroke-neutral-secondary, #e5e7eb);
  border-radius: 12px;
  background: var(--rr-background-base, #fff);
  text-align: left;
  cursor: pointer;
  font: inherit;
  color: inherit;
}

.qr-choice--on {
  border-color: var(--rr-stroke-brand-primary, #2563eb);
  background: var(--rr-background-brand-tertiary, #eff6ff);
}

.qr-choice__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.qr-choice__title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--rr-labels-neutral-primary, #1c1c1e);
}

.qr-choice__hint {
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--rr-labels-neutral-secondary, #5f6673);
}

.qr-choice__badge {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--rr-background-brand-secondary, #dbeafe);
  color: var(--rr-labels-brand-primary, #1d4ed8);
}

.qr-picker {
  margin-top: 12px;
  min-width: 0;
}

.qr-picker__scope {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 0.875rem;
  color: var(--rr-labels-neutral-secondary, #5f6673);
  cursor: pointer;
}

.qr-format-card {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--rr-stroke-brand-primary, #2563eb);
  background: var(--rr-background-brand-tertiary, #eff6ff);
}

.qr-format-card__title {
  margin: 0 0 6px;
  font-size: 0.9375rem;
  font-weight: 700;
}

.qr-format-card__hint {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--rr-labels-neutral-secondary, #5f6673);
}

.qr-format-card__hint code {
  font-size: 0.75rem;
}

.qr-summary {
  margin: 16px 0 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--rr-labels-neutral-primary, #1c1c1e);
}

.qr-footer {
  margin-top: 8px;
}

.qr-footer :deep(.auth-rr-button) {
  width: 100%;
}
</style>
