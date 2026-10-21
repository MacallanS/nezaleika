<template>
  <div class="point-picker">
    <p class="point-picker__lead">
      Выберите точку, с которой работаете. Можно сменить в любой момент.
    </p>
    <p v-if="loading" class="hint">Загрузка точек…</p>
    <p v-else-if="!options.length" class="empty-hint">
      Нет точек в cards-проектах. Проверьте доступ к проектам.
    </p>
    <div v-else class="point-picker__field">
      <label class="point-picker__label" @click.prevent="openSelect">Точка</label>
      <RrMultiSelect
        class="point-picker__select"
        :model-value="modelValue"
        :options="selectOptions"
        option-label="label"
        option-value="id"
        placeholder="Выберите точку"
        :multiple="false"
        :searchable="true"
        sheet-title="Точка"
        @update:model-value="onSelect"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RrMultiSelect } from "bibli/shared/ui/rr";
import type { CardsFieldPointOption } from "../composables/useCardsFieldPoint";
import "./cards-shared.css";

const props = defineProps<{
  options: CardsFieldPointOption[];
  modelValue: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const selectOptions = computed(() =>
  props.options.map((p) => ({
    id: p.location,
    label: p.projectName ? `${p.name} · ${p.projectName}` : p.name,
  })),
);

const onSelect = (raw: unknown) => {
  const value = String(raw ?? "");
  if (value) emit("update:modelValue", value);
};

function openSelect(event: Event) {
  const label = event.currentTarget as HTMLElement | null;
  const field = label?.closest(".point-picker__field");
  field?.querySelector<HTMLElement>(".rr-multi-select")?.click();
}
</script>

<style scoped>
.point-picker {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 420px;
}

.point-picker__lead {
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
  color: var(--rr-labels-neutral-secondary, #5f6673);
}

.point-picker__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.point-picker__label {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--rr-labels-neutral-secondary, #5f6673);
  cursor: pointer;
  width: fit-content;
}

.point-picker__select {
  width: 100%;
  max-width: 100%;
}

/* Поле — дефолтный RrMultiSelect variant=field */
</style>
