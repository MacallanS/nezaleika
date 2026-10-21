<template>
  <div class="analytics">
    <div class="analytics__toolbar">
      <h3 class="analytics__title">Склад сейчас</h3>
    </div>

    <p class="hint">Остатки карт по статусам. Приёмка и списание — через API (вкладка «Приёмка / списание»).</p>

    <template v-if="data">
      <div class="analytics-kpis">
        <div class="kpi">
          <span class="kpi__value">{{ data.units_in_central ?? 0 }}</span>
          <span class="kpi__label">В офисе</span>
        </div>
        <div class="kpi">
          <span class="kpi__value">{{ data.units_at_point ?? 0 }}</span>
          <span class="kpi__label">На точках</span>
        </div>
        <div class="kpi">
          <span class="kpi__value">{{ unitsInTransit }}</span>
          <span class="kpi__label">В пути</span>
        </div>
        <div class="kpi">
          <span class="kpi__value">{{ data.units_written_off ?? data.writeoffs_quantity ?? 0 }}</span>
          <span class="kpi__label">Списано</span>
        </div>
        <div v-if="(data.util_sent ?? 0) > 0" class="kpi">
          <span class="kpi__value">{{ data.util_sent }} / {{ data.util_received ?? 0 }}</span>
          <span class="kpi__label">Утиль отпр. / получ.</span>
        </div>
      </div>

      <h3 class="analytics-sub">Где карты</h3>
      <ul v-if="unitRows.length" class="analytics-list" role="list">
        <li v-for="row in unitRows" :key="row.state" class="analytics-list__row">
          <span>{{ unitStateLabel(row.state) }}</span>
          <strong>{{ row.cnt }}</strong>
        </li>
      </ul>
      <p v-else class="hint">Нет данных</p>

      <h3 class="analytics-sub">Последние списания</h3>
      <ul v-if="recentWriteoffs.length" class="analytics-list" role="list">
        <li v-for="w in recentWriteoffs" :key="w.id" class="analytics-list__row analytics-list__row--stack">
          <div class="analytics-list__main">
            <span class="analytics-list__title">{{ w.point_name || "—" }}</span>
            <span class="analytics-list__meta">{{ formatWhen(w.created_at || w.updated_at) }} · {{ w.person_name || "—" }}</span>
          </div>
          <code class="mono">{{ w.card_code || "—" }}</code>
        </li>
      </ul>
      <p v-else class="hint">Списаний пока нет</p>

      <h3 class="analytics-sub">Последние приёмки в офис</h3>
      <ul v-if="recentReceives.length" class="analytics-list" role="list">
        <li v-for="box in recentReceives" :key="box.id" class="analytics-list__row analytics-list__row--stack">
          <div class="analytics-list__main">
            <span class="analytics-list__title">
              #{{ box.id }}
              <span v-if="box.external_ref" class="ref"> · {{ shortRef(box.external_ref) }}</span>
            </span>
            <span class="analytics-list__meta">{{ formatWhen(box.received_at) }} · {{ box.capacity ?? "—" }} карт</span>
          </div>
          <span class="state" :data-state="box.state">{{ stateLabel(box.state) }}</span>
        </li>
      </ul>
      <p v-else class="hint">Приёмок пока нет</p>
    </template>
    <p v-else-if="!loading" class="hint">Нет данных.</p>
    <p v-else class="hint">Загрузка…</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import "../cards-shared.css";

const props = defineProps<{
  loading: boolean;
  data: Record<string, any> | null;
}>();

defineEmits<{ refresh: [] }>();

const UNIT_ORDER = [
  "in_central",
  "in_transit",
  "at_point",
  "written_off",
  "lost",
  "util",
  "issued",
];

const stateLabel = (state: string) =>
  ({
    in_central: "В офисе",
    in_transit: "В пути",
    at_point: "На точке",
    depleted: "Исчерпана",
  })[state] || state;

const unitStateLabel = (state: string) =>
  ({
    in_central: "В офисе",
    in_transit: "В пути",
    at_point: "На точке",
    issued: "Выдана",
    written_off: "Списана",
    lost: "Потеря",
    util: "Утиль",
  })[state] || state;

const unitsInTransit = computed(() => {
  const raw = props.data?.units_by_state;
  if (!raw) return 0;
  if (Array.isArray(raw)) {
    const row = raw.find((r: any) => r.state === "in_transit");
    return Number(row?.cnt ?? 0);
  }
  return Number((raw as Record<string, number>).in_transit ?? 0);
});

const unitRows = computed(() => {
  const raw = props.data?.units_by_state;
  if (!raw) return [] as { state: string; cnt: number }[];
  let rows: { state: string; cnt: number }[];
  if (Array.isArray(raw)) {
    rows = raw.map((r: any) => ({
      state: String(r.state ?? ""),
      cnt: Number(r.cnt ?? 0),
    }));
  } else {
    rows = Object.entries(raw as Record<string, any>).map(([state, cnt]) => ({
      state,
      cnt: Number(cnt ?? 0),
    }));
  }
  rows = rows.filter((r) => r.cnt > 0);
  rows.sort((a, b) => {
    const ia = UNIT_ORDER.indexOf(a.state);
    const ib = UNIT_ORDER.indexOf(b.state);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  return rows;
});

const recentWriteoffs = computed(() => {
  const list = props.data?.recent_writeoffs;
  if (!Array.isArray(list)) return [];
  return list.slice(0, 20);
});

const recentReceives = computed(() => {
  const list = props.data?.recent_receives;
  if (!Array.isArray(list)) return [];
  return list.slice(0, 15);
});

const shortRef = (ref: string) => {
  if (!ref || ref.length <= 36) return ref;
  return `${ref.slice(0, 18)}…${ref.slice(-10)}`;
};

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
</script>

<style scoped>
.analytics {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.analytics__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.analytics__title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.analytics-list {
  list-style: none;
  margin: 0 0 8px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.analytics-list__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--rr-backgrounds-primary, #fff);
  border: 1px solid color-mix(in srgb, var(--rr-input-border-default, #e5e7eb) 88%, transparent);
  font-size: 14px;
}

.analytics-list__row--stack {
  align-items: flex-start;
}

.analytics-list__main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.analytics-list__title {
  font-weight: 650;
  color: var(--rr-input-text-default, #101012);
}

.analytics-list__meta {
  font-size: 12px;
  color: var(--rr-labels-neutral-secondary, #5f6673);
}

.analytics-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
  margin: 8px 0 4px;
}

.kpi {
  padding: 12px;
  border-radius: 12px;
  background: var(--rr-backgrounds-secondary, #f5f5f7);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kpi__label {
  font-size: 12px;
  color: var(--rr-labels-neutral-secondary, #5f6673);
}

.kpi__value {
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.analytics-sub {
  margin: 16px 0 8px;
  font-size: 15px;
  font-weight: 650;
}

.analytics-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.analytics-table th,
.analytics-table td {
  text-align: left;
  padding: 8px 10px;
  border-bottom: 1px solid color-mix(in srgb, var(--rr-input-border-default, #e5e7eb) 80%, transparent);
  vertical-align: top;
}

.col-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  word-break: break-all;
}

.ref {
  color: var(--rr-labels-neutral-secondary, #5f6673);
  font-size: 12px;
}

.state {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background: #e8eef5;
  color: #334155;
}

.state[data-state="in_central"] {
  background: #e0f2fe;
  color: #075985;
}

.state[data-state="in_transit"] {
  background: #ede9fe;
  color: #5b21b6;
}

.state[data-state="at_point"] {
  background: #d1fae5;
  color: #065f46;
}

.state[data-state="depleted"] {
  background: #f1f5f9;
  color: #64748b;
}

.hint {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}
</style>
