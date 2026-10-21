<template>
  <div class="api-journal">
    <div class="api-journal__toolbar">
      <h3 class="api-journal__title">Приёмка и списание API</h3>
      <AuthRRButton
        variant="neutral-secondary"
        label="Обновить"
        :loading="loading"
        @click="emit('refresh')"
      />
    </div>

    <p class="hint">
      Журнал вызовов публичного API: загрузка новых коробок и списаний. Что пришло в запросе и как обработалось.
    </p>

    <div class="api-journal__filters" role="group" aria-label="Фильтры журнала">
      <div class="api-journal__filter-row">
        <span class="api-journal__filter-label">Операция</span>
        <div class="api-journal__chips">
          <button
            v-for="opt in operationOptions"
            :key="opt.value"
            type="button"
            class="chip"
            :class="{ 'chip--active': operationFilter === opt.value }"
            :aria-pressed="operationFilter === opt.value"
            @click="operationFilter = opt.value"
          >
            {{ opt.label }}
            <span v-if="opt.count != null" class="chip__count">{{ opt.count }}</span>
          </button>
        </div>
      </div>
      <div class="api-journal__filter-row">
        <span class="api-journal__filter-label">Статус</span>
        <div class="api-journal__chips">
          <button
            v-for="opt in statusOptions"
            :key="opt.value"
            type="button"
            class="chip"
            :class="{ 'chip--active': statusFilter === opt.value }"
            :aria-pressed="statusFilter === opt.value"
            @click="statusFilter = opt.value"
          >
            {{ opt.label }}
            <span v-if="opt.count != null" class="chip__count">{{ opt.count }}</span>
          </button>
        </div>
      </div>
    </div>

    <ul v-if="filteredRows.length" class="api-journal__list" role="list">
      <li
        v-for="row in filteredRows"
        :key="row.id"
        class="api-journal__row"
      >
        <button
          type="button"
          class="api-journal__row-btn"
          @click="openDetail(row)"
        >
          <div class="api-journal__row-top">
            <span class="tag" :data-op="row.operation">{{ operationLabel(row.operation) }}</span>
            <span class="status" :data-ok="row.success ? '1' : '0'">
              {{ row.success ? "Успех" : "Ошибка" }}
            </span>
          </div>
          <span class="api-journal__when">{{ formatWhen(row.created_at) }}</span>
          <span class="api-journal__summary">{{ resultSummary(row) }}</span>
        </button>
        <button
          v-if="row.has_file"
          type="button"
          class="file-link api-journal__file"
          :disabled="downloadingId === row.id"
          @click="onDownload(row)"
        >
          {{ downloadingId === row.id ? "…" : "Excel" }}
        </button>
      </li>
    </ul>
    <p v-else-if="!loading && rows.length" class="hint">
      Нет записей по выбранным фильтрам.
    </p>
    <p v-else-if="!loading" class="hint">
      Вызовов пока нет. Они появятся после POST /api/cards/public/boxes или /api/cards/writeoff/import.
    </p>

    <RrBottomSheet
      v-model="detailOpen"
      title="Вызов API"
      height-mode="fit"
      :height-percent="88"
      placement="sheet"
    >
      <div v-if="detailRow" class="api-journal__detail">
        <p><b>Когда:</b> {{ formatWhen(detailRow.created_at) }}</p>
        <p><b>Операция:</b> {{ operationLabel(detailRow.operation) }}</p>
        <p><b>Via:</b> {{ viaLabel(detailRow.via) }}</p>
        <p>
          <b>Статус:</b>
          {{ detailRow.success ? "Успех" : "Ошибка" }}
          ({{ detailRow.http_status }})
        </p>
        <p><b>Запрос:</b> {{ requestSummary(detailRow) }}</p>
        <p><b>Результат:</b> {{ resultSummary(detailRow) }}</p>
        <AuthRRButton
          v-if="detailRow.has_file"
          variant="brand-secondary"
          :label="downloadingId === detailRow.id ? 'Скачиваем…' : 'Скачать Excel'"
          :loading="downloadingId === detailRow.id"
          @click="onDownload(detailRow)"
        />
      </div>
    </RrBottomSheet>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { AuthRRButton, RrBottomSheet } from "bibli/shared/ui/rr";
import {
  downloadPublicApiCallFile,
  type CardPublicApiCall,
  type CardPublicApiOperation,
} from "@/pages/cards/api";
import { useCardsNotify } from "../../composables/useCardsNotify";
import "../cards-shared.css";

type OperationFilter = "" | CardPublicApiOperation;
type StatusFilter = "" | "ok" | "error";

const props = defineProps<{
  loading: boolean;
  rows: CardPublicApiCall[];
  partner: string;
}>();

const emit = defineEmits<{ refresh: [] }>();

const { notifyError } = useCardsNotify();
const rows = computed(() => props.rows ?? []);
const downloadingId = ref<number | null>(null);
const operationFilter = ref<OperationFilter>("");
const statusFilter = ref<StatusFilter>("");
const detailOpen = ref(false);
const detailRow = ref<CardPublicApiCall | null>(null);

const openDetail = (row: CardPublicApiCall) => {
  detailRow.value = row;
  detailOpen.value = true;
};

const countBy = (pred: (row: CardPublicApiCall) => boolean) =>
  rows.value.reduce((n, row) => n + (pred(row) ? 1 : 0), 0);

const operationOptions = computed(() => [
  { value: "" as OperationFilter, label: "Все", count: rows.value.length },
  {
    value: "boxes_receive" as OperationFilter,
    label: "Коробки",
    count: countBy((r) => r.operation === "boxes_receive"),
  },
  {
    value: "writeoff_import" as OperationFilter,
    label: "Списания",
    count: countBy((r) => r.operation === "writeoff_import"),
  },
]);

const statusOptions = computed(() => [
  { value: "" as StatusFilter, label: "Все", count: rows.value.length },
  {
    value: "ok" as StatusFilter,
    label: "Успех",
    count: countBy((r) => r.success),
  },
  {
    value: "error" as StatusFilter,
    label: "Ошибка",
    count: countBy((r) => !r.success),
  },
]);

const filteredRows = computed(() =>
  rows.value.filter((row) => {
    if (operationFilter.value && row.operation !== operationFilter.value) return false;
    if (statusFilter.value === "ok" && !row.success) return false;
    if (statusFilter.value === "error" && row.success) return false;
    return true;
  }),
);

const operationLabel = (op: string) =>
  ({
    boxes_receive: "Коробка",
    writeoff_import: "Списание",
  })[op] || op;

const viaLabel = (via: string) =>
  ({
    api_key: "API-ключ",
    session: "UI",
  })[via] || via;

const formatWhen = (iso: string) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

const requestSummary = (row: CardPublicApiCall) => {
  const parts: string[] = [];
  if (row.file_name) parts.push(row.file_name);
  const req = row.request ?? {};
  if (req.external_ref) parts.push(`ref: ${req.external_ref}`);
  if (req.card_kind) parts.push(String(req.card_kind));
  if (req.codes_count != null) parts.push(`${req.codes_count} кодов`);
  if (req.rows_count != null) parts.push(`${req.rows_count} строк`);
  return parts.length ? parts.join(" · ") : "—";
};

const resultSummary = (row: CardPublicApiCall) => {
  if (row.error_summary) return row.error_summary;
  const res = row.response ?? {};
  if (row.operation === "boxes_receive") {
    const id = res.box_id ?? (Array.isArray(res.box_ids) ? res.box_ids[0] : null);
    const cap = res.capacity;
    if (id != null) return `коробка #${id}${cap != null ? ` · ${cap} карт` : ""}`;
  }
  if (row.operation === "writeoff_import") {
    const applied = res.applied;
    const errors = Array.isArray(res.errors) ? res.errors : [];
    if (applied != null) {
      return errors.length
        ? `применено ${applied}, ошибок ${errors.length}`
        : `применено ${applied}`;
    }
  }
  if (typeof res.message === "string") return res.message;
  return row.success ? "OK" : "—";
};

const onDownload = async (row: CardPublicApiCall) => {
  downloadingId.value = row.id;
  try {
    await downloadPublicApiCallFile(row.id, props.partner, row.file_name);
  } catch (e: unknown) {
    notifyError(e, "Не удалось скачать файл");
  } finally {
    downloadingId.value = null;
  }
};
</script>

<style scoped>
.api-journal {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.api-journal__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.api-journal__row {
  display: flex;
  align-items: stretch;
  gap: 8px;
  padding: 4px;
  border-radius: 14px;
  background: var(--rr-backgrounds-primary, #fff);
  border: 1px solid color-mix(in srgb, var(--rr-input-border-default, #e5e7eb) 88%, transparent);
}

.api-journal__row-btn {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 10px 12px;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font: inherit;
  color: inherit;
}

.api-journal__row-top {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.api-journal__when {
  font-size: 12px;
  color: var(--rr-labels-neutral-secondary, #5f6673);
}

.api-journal__summary {
  font-size: 14px;
  font-weight: 600;
  color: var(--rr-input-text-default, #101012);
  word-break: break-word;
}

.api-journal__file {
  align-self: center;
  margin-right: 8px;
  min-height: 44px;
  min-width: 64px;
}

.api-journal__detail {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 14px;
  line-height: 1.45;
}

.api-journal__detail p {
  margin: 0;
}

.api-journal__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.api-journal__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
}

.api-journal__filters {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.api-journal__filter-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.api-journal__filter-label {
  flex: 0 0 auto;
  min-width: 72px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
}

.api-journal__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #d0d7e2;
  background: #fff;
  color: #334155;
  border-radius: 999px;
  padding: 4px 12px;
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
}

.chip:hover {
  border-color: #94a3b8;
}

.chip--active {
  border-color: #1d4ed8;
  background: #eff6ff;
  color: #1e3a8a;
  font-weight: 600;
}

.chip__count {
  font-size: 0.75rem;
  opacity: 0.7;
  font-weight: 500;
}

.api-journal__cell {
  max-width: 280px;
  word-break: break-word;
}

.file-link {
  border: 0;
  background: transparent;
  color: #1d4ed8;
  cursor: pointer;
  padding: 0;
  font: inherit;
  text-decoration: underline;
}

.file-link:disabled {
  opacity: 0.5;
  cursor: wait;
}

.tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  background: #e8eef5;
  color: #334155;
  font-weight: 600;
}

.tag[data-op="boxes_receive"] {
  background: #e0f2fe;
  color: #075985;
}

.tag[data-op="writeoff_import"] {
  background: #ffedd5;
  color: #9a3412;
}

.tag[data-via="session"] {
  background: #f1f5f9;
  color: #64748b;
  font-weight: 500;
}

.tag[data-via="api_key"] {
  background: #e8eef5;
  color: #334155;
  font-weight: 500;
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.status[data-ok="1"] {
  color: #166534;
}

.status[data-ok="0"] {
  color: #9a3412;
}

.status__http {
  font-weight: 500;
  opacity: 0.7;
  font-size: 0.85em;
}

.analytics-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.analytics-table th,
.analytics-table td {
  text-align: left;
  padding: 8px 10px;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: top;
}

.hint {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}
</style>
