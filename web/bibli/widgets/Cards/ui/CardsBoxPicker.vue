<template>
  <div
    class="box-picker"
    :class="{
      'box-picker--list-first': listFirst,
      'box-picker--scan-bottom': scanPosition === 'bottom',
    }"
  >
    <div
      v-if="showScan && scanPosition === 'top'"
      class="box-picker__scan box-picker__scan--first"
    >
      <p class="hint">
        {{ scanOnly ? "Выбор только по QR коробки" : "Сканируйте QR на коробке" }}
        <code>CARDBOX:id</code>
      </p>
      <CardScanInput
        :default-mode="scanDefaultMode"
        :allowed-modes="scanAllowedModes"
        :start-label="scanLabel"
        :scanned-count="selectedCount"
        @decode="onScan"
      />
      <p v-if="scanFlash" class="hint ok">{{ scanFlash }}</p>
      <p v-if="scanError" class="scanner-error">{{ scanError }}</p>
    </div>

    <div class="box-picker__tools">
      <label class="box-picker__search">
        <span class="visually-hidden">Поиск коробки</span>
        <i class="pi pi-search" aria-hidden="true" />
        <input
          v-model="query"
          type="search"
          class="box-picker__search-input"
          placeholder="Поиск коробки…"
          autocomplete="off"
          enterkeyhint="search"
        />
        <button
          v-if="query"
          type="button"
          class="box-picker__clear"
          aria-label="Очистить поиск"
          @click="query = ''"
        >
          <i class="pi pi-times" aria-hidden="true" />
        </button>
      </label>
      <p class="box-picker__meta">
        {{ filtered.length }} из {{ boxes.length }}
        <template v-if="selectedCount"> · выбрано {{ selectedCount }}</template>
      </p>
    </div>

    <ul
      v-if="filtered.length"
      class="box-list"
      role="listbox"
      :aria-multiselectable="multiple"
    >
      <li v-for="box in filtered" :key="box.id" class="box-row">
        <label
          v-if="!scanOnly"
          class="box-check"
          :class="{ 'box-check--on': isSelected(box.id) }"
        >
          <input
            :type="multiple ? 'checkbox' : 'radio'"
            :name="radioName"
            :checked="isSelected(box.id)"
            @change="toggle(box.id)"
          />
          <span class="box-check__body">
            <span class="box-check__top">
              <span class="box-check__id">#{{ box.id }}</span>
              <span class="box-check__cap">{{ formatCapacity(box.capacity) }}</span>
              <span v-if="stateLabel(box)" class="tag">{{ stateLabel(box) }}</span>
              <span v-if="isUninitialized(box)" class="tag">без накладной</span>
              <span v-if="confirmedId === box.id" class="tag">QR OK</span>
            </span>
            <span
              class="box-check__name"
              :title="box.external_ref || undefined"
            >{{ boxTitle(box) }}</span>
          </span>
        </label>
        <div
          v-else
          class="box-check box-check--readonly"
          :class="{ 'box-check--on': isSelected(box.id) }"
        >
          <span class="box-check__body">
            <span class="box-check__top">
              <span class="box-check__id">#{{ box.id }}</span>
              <span class="box-check__cap">{{ formatCapacity(box.capacity) }}</span>
              <span v-if="stateLabel(box)" class="tag">{{ stateLabel(box) }}</span>
              <span v-if="isUninitialized(box)" class="tag">без накладной</span>
              <span v-if="isSelected(box.id)" class="tag">QR OK</span>
            </span>
            <span
              class="box-check__name"
              :title="box.external_ref || undefined"
            >{{ boxTitle(box) }}</span>
          </span>
        </div>
      </li>
    </ul>
    <p v-else-if="boxes.length && query.trim()" class="hint">Ничего не найдено по «{{ query }}».</p>
    <p v-else-if="!boxes.length" class="hint">{{ emptyText }}</p>

    <div
      v-if="showScan && scanPosition === 'bottom'"
      class="box-picker__scan box-picker__scan--bottom"
    >
      <p class="hint">
        {{ scanOnly ? "Выбор только по QR коробки" : "Или отсканируйте QR" }}
        <code>CARDBOX:id</code>
      </p>
      <CardScanInput
        :default-mode="scanDefaultMode"
        :allowed-modes="scanAllowedModes"
        :start-label="scanLabel"
        :scanned-count="selectedCount"
        @decode="onScan"
      />
      <p v-if="scanFlash" class="hint ok">{{ scanFlash }}</p>
      <p v-if="scanError" class="scanner-error">{{ scanError }}</p>
    </div>

    <div v-if="multiple && selectedIds.length" class="box-picker__selected">
      <span class="box-picker__selected-label">Выбраны:</span>
      <button
        v-for="id in selectedIds"
        :key="id"
        type="button"
        class="chip"
        :title="`Убрать #${id}`"
        @click="toggle(id)"
      >
        #{{ id }}
        <i class="pi pi-times" aria-hidden="true" />
      </button>
      <button type="button" class="linkish" @click="clearSelection">Сбросить выбор</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import CardScanInput from "./CardScanInput.vue";
import type { CardBox } from "@/pages/cards/api";
import "./cards-shared.css";

const props = withDefaults(
  defineProps<{
    boxes: CardBox[];
    /** single: id | null; multi: number[] */
    modelValue: number | number[] | null;
    multiple?: boolean;
    showScan?: boolean;
    /** Только QR: клик по списку не выбирает (разделение коробки). */
    scanOnly?: boolean;
    scanDefaultMode?: "camera" | "hid";
    scanAllowedModes?: Array<"camera" | "hid">;
    scanLabel?: string;
    emptyText?: string;
    /** Подсветка подтверждённой QR (разделение) */
    confirmedId?: number | null;
    /** Текст, если сканнутая коробка не в `boxes` (по умолчанию — «не в офисе»). */
    scanNotInListText?: string;
    /** Список и поиск выше кнопки скана (экран QR-наклеек). */
    listFirst?: boolean;
    scanPosition?: "top" | "bottom";
  }>(),
  {
    multiple: false,
    showScan: true,
    scanOnly: false,
    listFirst: false,
    scanPosition: "top",
    scanDefaultMode: "camera",
    scanAllowedModes: () => ["camera"],
    scanLabel: "Сканировать QR коробки",
    emptyText: "В офисе нет коробок.",
    confirmedId: null,
    scanNotInListText: "",
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: number | number[] | null): void;
  /** Скан CARDBOX успешен (id найден в списке) */
  (e: "box-scanned", id: number): void;
}>();

const query = ref("");
const scanFlash = ref("");
const scanError = ref("");
const radioName = `box-picker-${Math.random().toString(36).slice(2, 9)}`;

/** Название коробки = `external_ref` как есть (напр. OTP-TRIAL-d2b17e8d19b6445d). */
const formatCapacity = (n: number | null | undefined) => {
  const v = Number(n ?? 0);
  const s = Number.isFinite(v) ? v.toLocaleString("ru-RU") : "0";
  return `${s} карт`;
};

const boxTitle = (box: CardBox) => {
  const ref = (box.external_ref ?? "").trim();
  return ref || "Без названия";
};

const STATE_LABELS: Record<string, string> = {
  in_central: "офис",
  in_transit: "в пути",
  at_point: "на точке",
  depleted: "пустая",
};

const stateLabel = (box: CardBox) => {
  if (!box.state) return "";
  return STATE_LABELS[box.state] ?? box.state;
};

const isUninitialized = (box: CardBox) => box.meta?.codes_initialized === false;

const selectedIds = computed((): number[] => {
  if (props.multiple) {
    return Array.isArray(props.modelValue) ? props.modelValue : [];
  }
  return props.modelValue == null ? [] : [Number(props.modelValue)];
});

const selectedCount = computed(() => selectedIds.value.length);

const isSelected = (id: number) => selectedIds.value.includes(id);

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  const qNum = q.replace(/^#/, "");
  const matched = !q
    ? [...props.boxes]
    : props.boxes.filter((b) => {
        if (String(b.id) === qNum || String(b.id).includes(qNum)) return true;
        if (b.external_ref && b.external_ref.toLowerCase().includes(q)) return true;
        if (boxTitle(b).toLowerCase().includes(q)) return true;
        if (String(b.capacity).includes(q)) return true;
        return false;
      });
  return matched.sort((a, b) => b.id - a.id);
});

const parseBoxId = (raw: string): number | null => {
  const m = raw.trim().match(/^(?:CARDBOX|BOX):(\d+)$/i);
  if (m) return Number(m[1]);
  // чистый id — только если явно число без букв
  if (/^\d{1,9}$/.test(raw.trim())) return Number(raw.trim());
  return null;
};

const setSelection = (ids: number[]) => {
  if (props.multiple) {
    emit("update:modelValue", ids);
  } else {
    emit("update:modelValue", ids[0] ?? null);
  }
};

const toggle = (id: number) => {
  if (props.scanOnly) return;
  if (props.multiple) {
    const next = isSelected(id)
      ? selectedIds.value.filter((x) => x !== id)
      : [...selectedIds.value, id];
    setSelection(next);
  } else {
    setSelection([id]);
  }
  scanError.value = "";
};

const clearSelection = () => setSelection([]);

const onScan = (raw: string) => {
  scanError.value = "";
  const id = parseBoxId(raw);
  if (id == null) {
    scanError.value = "Нужен QR коробки (CARDBOX:id), не карты";
    return;
  }
  if (!props.boxes.some((b) => b.id === id)) {
    const custom = props.scanNotInListText.trim();
    scanError.value = custom
      ? custom.replace(/\{id\}/g, String(id))
      : `Коробка #${id} не в офисе`;
    return;
  }
  if (props.multiple) {
    if (!isSelected(id)) setSelection([...selectedIds.value, id]);
  } else {
    setSelection([id]);
  }
  // подтянуть в поиск, чтобы строка была видна
  query.value = String(id);
  scanFlash.value = `Коробка #${id} выбрана`;
  setTimeout(() => (scanFlash.value = ""), 1600);
  emit("box-scanned", id);
};

watch(
  () => props.boxes,
  () => {
    // убрать выбор исчезнувших
    const alive = new Set(props.boxes.map((b) => b.id));
    const next = selectedIds.value.filter((id) => alive.has(id));
    if (next.length !== selectedIds.value.length) setSelection(next);
  },
);
</script>

<style scoped>
.box-picker {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.box-picker__tools {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.box-picker__search {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
  height: 32px;
  padding: 0 8px;
  border-radius: 8px;
  background: var(--rr-backgrounds-primary, #fff);
  border: 1px solid color-mix(in srgb, var(--rr-input-border-default, #e5e7eb) 88%, transparent);
  box-sizing: border-box;
}

.box-picker__search:focus-within {
  border-color: var(--rr-button-brand-primary-background-default, #5b7dec);
  box-shadow: 0 0 0 2px rgba(91, 125, 236, 0.18);
}

.box-picker__search .pi-search {
  color: var(--rr-labels-neutral-secondary, #5f6673);
  font-size: 12px;
  flex-shrink: 0;
}

.box-picker__search-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  outline: none;
  background: transparent;
  font: inherit;
  font-size: 13px;
  color: var(--rr-input-text-default, #101012);
  line-height: 1.2;
}

.box-picker__search-input::placeholder {
  color: var(--rr-labels-neutral-secondary, #5f6673);
  opacity: 0.85;
}

.box-picker__clear {
  border: 0;
  background: transparent;
  color: var(--rr-labels-neutral-secondary, #5f6673);
  padding: 0;
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  line-height: 1;
  flex-shrink: 0;
  border-radius: 4px;
}

.box-picker__clear:hover {
  color: var(--rr-input-text-default, #101012);
}

.box-picker__meta {
  margin: 0;
  font-size: 12px;
  color: var(--rr-labels-neutral-secondary, #5f6673);
  white-space: nowrap;
  flex-shrink: 0;
}

@media (max-width: 520px) {
  .box-picker__tools {
    flex-wrap: wrap;
    gap: 6px;
  }

  .box-picker__meta {
    width: 100%;
  }
}

.box-picker__scan {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.box-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: min(40vh, 320px);
  overflow: auto;
}

.box-picker--list-first {
  display: flex;
  flex-direction: column;
}

.box-picker--scan-bottom .box-picker__tools {
  order: 1;
}

.box-picker--scan-bottom .box-list {
  order: 2;
}

.box-picker--scan-bottom .box-picker__selected {
  order: 3;
}

.box-picker--scan-bottom .box-picker__scan--bottom {
  order: 4;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--rr-stroke-neutral-secondary, #e5e7eb);
}

.box-picker__scan--first {
  margin-bottom: 4px;
}

.box-row {
  min-width: 0;
}

.box-check {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  background: var(--rr-backgrounds-primary, #fff);
  border: 1px solid color-mix(in srgb, var(--rr-input-border-default, #e5e7eb) 88%, transparent);
  cursor: pointer;
  min-width: 0;
}

.box-check:hover {
  border-color: color-mix(in srgb, var(--rr-input-border-default, #e5e7eb) 100%, transparent);
  background: var(--rr-backgrounds-secondary, #f8fafc);
}

.box-check--on {
  border-color: var(--rr-button-brand-primary-background-default, #5b7dec);
  background: color-mix(in srgb, #5b7dec 6%, #fff);
}

.box-check--readonly {
  cursor: default;
}

.box-check input {
  margin-top: 3px;
  flex-shrink: 0;
}

.box-check__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.box-check__top {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.box-check__id {
  font-weight: 700;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  color: var(--rr-input-text-default, #101012);
  flex-shrink: 0;
}

.box-check__cap {
  margin-left: auto;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--rr-labels-neutral-secondary, #5f6673);
  white-space: nowrap;
}

.box-check__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--rr-input-text-default, #101012);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.box-check__ref {
  font-size: 11px;
  color: var(--rr-labels-neutral-secondary, #5f6673);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag {
  font-size: 11px;
  font-weight: 650;
  color: #1a7f37;
  flex-shrink: 0;
}

.box-picker__selected {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.box-picker__selected-label {
  font-size: 12px;
  font-weight: 600;
  color: #5f6673;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid #d0d7e2;
  background: #fff;
  border-radius: 999px;
  padding: 3px 10px;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.linkish {
  border: 0;
  background: transparent;
  color: #1d4ed8;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.ok {
  color: #1a7f37;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.hint code {
  font-size: 12px;
}
</style>
