<template>
  <div
    class="cards-toolbar"
    :class="{ 'cards-toolbar--inline': inline }"
  >
    <div
      v-if="showProject"
      class="cards-toolbar__project"
      @click="onProjectSurfaceClick"
    >
      <span class="cards-toolbar__kicker">Проект</span>
      <RrMultiSelect
        class="cards-toolbar__select"
        variant="bare"
        :model-value="modelValue"
        :options="options"
        :option-label="optionLabel"
        :option-value="optionValue"
        :placeholder="placeholder"
        :multiple="false"
        :searchable="true"
        sheet-title="Проект"
        @update:model-value="emit('update:modelValue', $event)"
      />
    </div>

    <button
      type="button"
      class="cards-toolbar__refresh"
      :disabled="refreshDisabled || refreshLoading"
      aria-label="Обновить"
      title="Обновить"
      @click="emit('refresh')"
    >
      <i
        :class="refreshLoading ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"
        aria-hidden="true"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import { RrMultiSelect } from "bibli/shared/ui/rr";

withDefaults(
  defineProps<{
    modelValue?: string | number
    options?: Array<Record<string, unknown> | string | number>
    optionLabel?: string
    optionValue?: string
    placeholder?: string
    showProject?: boolean
    refreshLoading?: boolean
    refreshDisabled?: boolean
    /** В слоте shell (не в шапке страницы). */
    inline?: boolean
  }>(),
  {
    modelValue: "",
    options: () => [],
    optionLabel: "name",
    optionValue: "id",
    placeholder: "Проект",
    showProject: true,
    refreshLoading: false,
    refreshDisabled: false,
    inline: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string | number | Array<string | number>]
  refresh: []
}>();

function onProjectSurfaceClick(event: MouseEvent) {
  const root = event.currentTarget as HTMLElement | null;
  if (!root) return;
  const target = event.target as HTMLElement;
  if (target.closest(".rr-multi-select__arrow")) return;
  if (target.closest(".rr-multi-select")) return;
  root.querySelector<HTMLElement>(".rr-multi-select")?.click();
}
</script>

<style scoped>
.cards-toolbar {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
}

.cards-toolbar--inline {
  width: 100%;
  justify-content: flex-start;
}

.cards-toolbar__project {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  max-width: min(220px, 100%);
  height: 40px;
  padding: 0 10px 0 12px;
  border-radius: 12px;
  background: var(--rr-backgrounds-primary, #fff);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, #e5e7eb 80%, transparent);
  cursor: pointer;
  transition: background-color 0.15s ease, box-shadow 0.15s ease;
}

.cards-toolbar__project:hover {
  background: #f8f9fb;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, #5b7dec 35%, #e5e7eb);
}

.cards-toolbar__kicker {
  flex-shrink: 0;
  color: #8b919a;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1;
}

.cards-toolbar__select {
  flex: 1 1 auto;
  min-width: 0;
  height: 100%;
  display: flex;
  align-items: stretch;
}

.cards-toolbar__select :deep(.rr-multi-select__trigger) {
  gap: 4px;
  min-height: 0;
  height: 100%;
  padding: 0;
  border: none !important;
  border-radius: 0;
  background: transparent !important;
  box-shadow: none !important;
}

.cards-toolbar__select :deep(.rr-multi-select__primary),
.cards-toolbar__select :deep(.rr-multi-select__placeholder) {
  font-size: 13px;
  font-weight: 650;
  line-height: 18px;
  color: #101012;
}

.cards-toolbar__select :deep(.rr-multi-select__placeholder) {
  font-weight: 500;
  color: #8b919a;
}

.cards-toolbar__select :deep(.rr-multi-select__arrow) {
  width: 14px;
  height: 14px;
  border-radius: 0;
  background: transparent;
  color: #8b919a;
}

.cards-toolbar__refresh {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 12px;
  background: var(--rr-backgrounds-primary, #fff);
  color: #5f6673;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, #e5e7eb 80%, transparent);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}

.cards-toolbar__refresh:hover:not(:disabled) {
  background: #f8f9fb;
  color: #101012;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, #5b7dec 35%, #e5e7eb);
}

.cards-toolbar__refresh:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.cards-toolbar__refresh i {
  font-size: 15px;
  line-height: 1;
}

@media (max-width: 768px) {
  .cards-toolbar {
    width: 100%;
  }

  .cards-toolbar__project {
    flex: 1 1 auto;
    max-width: none;
    height: 44px;
  }

  .cards-toolbar__refresh {
    width: 44px;
    height: 44px;
  }
}
</style>
