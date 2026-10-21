<template>
  <div class="report-section">
    <h3 class="report-section__title">Досье (выдача / возврат)</h3>

    <div class="block-toolbar">
      <RrSegmentTabs
        class="report-presets"
        :tabs="presetTabs"
        :model-value="reportPreset"
        aria-label="Период отчёта"
        @update:model-value="onPresetChange"
      />
      <AuthRRButton
        v-if="hasDossierData"
        variant="brand-secondary"
        class="report-export-btn"
        :label="exporting ? 'Готовим…' : 'Экспорт в Excel'"
        :loading="exporting"
        :disabled="exporting || !report"
        @click="emit('export')"
      />
    </div>

    <p v-if="reportLoading && !report" class="hint">Загрузка…</p>

    <template v-else-if="report && hasDossierData">
      <div class="kpi-row">
        <div class="kpi kpi--hero" :class="rateClass(report.summary.return_rate)">
          <span class="kpi__num">
            {{ report.summary.return_rate === null ? "—" : `${report.summary.return_rate}%` }}
          </span>
          <span class="kpi__label">доля возврата досье</span>
        </div>
        <div class="kpi">
          <span class="kpi__num">{{ report.summary.issued }}</span>
          <span class="kpi__label">выдано</span>
        </div>
        <div class="kpi">
          <span class="kpi__num">{{ report.summary.returned }}</span>
          <span class="kpi__label">возвращено</span>
        </div>
        <div class="kpi kpi--warn">
          <span class="kpi__num">{{ report.summary.outstanding }}</span>
          <span class="kpi__label">ещё не вернулось</span>
        </div>
      </div>

      <div v-if="report.weekly.length" class="report-card">
        <div class="report-head">
          <span class="report-title">По неделям</span>
          <span class="legend">
            <i class="legend__dot legend__dot--iss"></i> выдано
            <i class="legend__dot legend__dot--ret"></i> возвращено
          </span>
        </div>
        <div class="chart">
          <div
            v-for="week in report.weekly"
            :key="week.week_start"
            class="chart-col"
            :title="`Неделя ${weekLabel(week.week_start)} — выдано ${week.issued}, возвращено ${week.returned}`"
          >
            <div class="bars">
              <div class="bar bar--iss" :style="{ height: barHeight(week.issued) }"></div>
              <div class="bar bar--ret" :style="{ height: barHeight(week.returned) }"></div>
            </div>
            <span class="chart-x">{{ weekLabel(week.week_start) }}</span>
          </div>
        </div>
      </div>

      <div v-if="report.by_point.length" class="report-card">
        <div class="report-title">По точкам</div>
        <ul class="report-point-list" role="list">
          <li
            v-for="item in report.by_point"
            :key="item.location_external_id"
            class="report-point-row"
            :class="{ 'report-point-row--anomaly': item.anomaly }"
          >
            <div class="report-point-row__main">
              <span class="report-point-row__name">
                {{ item.point_name || pointName(item.location_external_id) }}
                <i
                  v-if="item.anomaly"
                  class="pi pi-exclamation-circle anomaly-flag"
                  title="Аномалия: остаток больше доставленного"
                />
              </span>
              <span class="report-point-row__meta">
                <template v-if="item.last_inventory_at">
                  Инвент. {{ formatDate(item.last_inventory_at) }}
                </template>
                <template v-else>Инвент. не было</template>
                <i
                  v-if="isStale(item.last_inventory_at)"
                  class="pi pi-exclamation-triangle stale-flag"
                  title="Давно не инвентаризовали (>10 дней)"
                />
              </span>
            </div>
            <div class="report-point-row__side">
              <span>выдано {{ item.issued }}</span>
              <strong :class="{ 'cell-anomaly': item.anomaly }">
                остаток {{ item.on_hand ?? "—" }}
              </strong>
            </div>
          </li>
        </ul>
      </div>
    </template>

    <p v-else-if="!reportLoading" class="hint">
      За период нет выдач досье — блок скрыт, пока не появятся данные.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { AuthRRButton, RrSegmentTabs, type RrSegmentTab } from "bibli/shared/ui/rr";
import type { CardsReport } from "@/pages/cards/api";
import "./cards-shared.css";

type ReportPreset = "4w" | "8w" | "quarter" | "all";

const props = defineProps<{
  report: CardsReport | null;
  reportLoading: boolean;
  reportPreset: ReportPreset;
  pointName: (location: string) => string;
  exporting?: boolean;
}>();

const emit = defineEmits<{
  (e: "preset-change", preset: ReportPreset): void;
  (e: "export"): void;
}>();

const presetTabs: RrSegmentTab[] = [
  { id: "4w", label: "4 недели" },
  { id: "8w", label: "8 недель" },
  { id: "quarter", label: "Квартал" },
  { id: "all", label: "Всё время" },
];

const hasDossierData = computed(() => {
  const s = props.report?.summary;
  if (!s) return false;
  return (s.issued ?? 0) > 0 || (s.returned ?? 0) > 0 || (props.report?.weekly?.length ?? 0) > 0;
});

const onPresetChange = (value: string) => {
  emit("preset-change", value as ReportPreset);
};

const chartMax = computed(() =>
  Math.max(1, ...(props.report?.weekly ?? []).flatMap((week) => [week.issued, week.returned])),
);

const barHeight = (value: number) =>
  value > 0 ? `${Math.max(2, (value / chartMax.value) * 100)}%` : "0";

const rateClass = (rate: number | null) => {
  if (rate === null) return "";
  if (rate >= 90) return "kpi--good";
  if (rate >= 70) return "kpi--mid";
  return "kpi--bad";
};

const weekLabel = (iso: string) => {
  const [, month, day] = iso.split("-");
  return `${day}.${month}`;
};

const formatDate = (iso: string) => {
  const [year, month, day] = iso.split("-");
  return `${day}.${month}.${year}`;
};

const isStale = (iso: string | null) => {
  if (!iso) return true;
  const days = (Date.now() - new Date(iso).getTime()) / 86_400_000;
  return days > 10;
};
</script>

<style scoped>
.report-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid color-mix(in srgb, var(--rr-input-border-default, #e5e7eb) 80%, transparent);
}

.report-section__title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.report-presets {
  max-width: 100%;
}

.hint-inline {
  color: var(--rr-labels-neutral-secondary, #5f6673);
}

.kpi-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.kpi {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 16px 18px;
  border: 1px solid color-mix(in srgb, var(--rr-input-border-default, #e5e7eb) 88%, transparent);
  border-radius: 16px;
  min-width: 130px;
  background: var(--rr-backgrounds-secondary, #f5f5f7);
}

.kpi__num {
  font-size: 26px;
  font-weight: 700;
  color: var(--rr-input-text-default, #101012);
  line-height: 1.1;
}

.kpi__label {
  font-size: 12px;
  color: var(--rr-labels-neutral-secondary, #5f6673);
}

.kpi--hero {
  min-width: 170px;
  background: var(--rr-backgrounds-primary, #fff);
}

.kpi--hero .kpi__num {
  font-size: 34px;
}

.kpi--good {
  background: color-mix(in srgb, #52c41a 12%, #fff);
  border-color: #b7eb8f;
}

.kpi--good .kpi__num {
  color: #389e0d;
}

.kpi--mid {
  background: color-mix(in srgb, #f59e0b 12%, #fff);
  border-color: #ffe58f;
}

.kpi--mid .kpi__num {
  color: #d48806;
}

.kpi--bad {
  background: #fff1f0;
  border-color: #ffccc7;
}

.kpi--bad .kpi__num {
  color: #cf1322;
}

.kpi--warn {
  background: var(--rr-backgrounds-tetriary, #e7e8ee);
}

.report-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  border: 1px solid color-mix(in srgb, var(--rr-input-border-default, #e5e7eb) 88%, transparent);
  border-radius: var(--rr-radius-2-xl, 20px);
  background: var(--rr-backgrounds-secondary, #f5f5f7);
}

.report-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.report-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--rr-input-text-default, #101012);
}

.report-point-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.report-point-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 14px;
  border-radius: 14px;
  background: var(--rr-backgrounds-primary, #fff);
  border: 1px solid color-mix(in srgb, var(--rr-input-border-default, #e5e7eb) 88%, transparent);
}

.report-point-row--anomaly {
  border-color: color-mix(in srgb, #cf1322 35%, transparent);
}

.report-point-row__main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1 1 160px;
}

.report-point-row__name {
  font-size: 15px;
  font-weight: 700;
  color: var(--rr-input-text-default, #101012);
}

.report-point-row__meta {
  font-size: 12px;
  color: var(--rr-labels-neutral-secondary, #5f6673);
}

.report-point-row__side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  font-size: 13px;
  color: var(--rr-labels-neutral-secondary, #5f6673);
}

.report-point-row__side strong {
  font-size: 14px;
  color: var(--rr-input-text-default, #101012);
}

.block-toolbar {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
}

.block-toolbar .report-presets {
  width: fit-content;
  max-width: 100%;
}

.block-toolbar .report-export-btn {
  width: 100%;
}

@media (min-width: 769px) {
  .block-toolbar {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .block-toolbar .report-export-btn {
    width: auto;
  }
}

.legend {
  font-size: 12px;
  color: var(--rr-labels-neutral-secondary, #5f6673);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.legend__dot {
  width: 9px;
  height: 9px;
  border-radius: 2px;
  display: inline-block;
  margin-left: 8px;
}

.legend__dot--iss {
  background: #69707a;
}

.legend__dot--ret {
  background: #389e0d;
}

.chart {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 150px;
  padding-top: 6px;
  overflow-x: auto;
}

.chart-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 34px;
  flex: 1;
  height: 100%;
}

.bars {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 100%;
}

.bar {
  width: 12px;
  border-radius: 3px 3px 0 0;
  transition: height 0.2s;
}

.bar--iss {
  background: #69707a;
}

.bar--ret {
  background: #389e0d;
}

.chart-x {
  font-size: 11px;
  color: var(--rr-labels-neutral-secondary, #5f6673);
  white-space: nowrap;
}

.stale-flag {
  color: #d46b08;
  margin-left: 6px;
  font-size: 12px;
}

.anomaly-flag {
  color: #cf1322;
  margin-left: 6px;
  font-size: 12px;
  cursor: help;
}

.cell-anomaly {
  color: #cf1322;
  font-weight: 600;
}

@media (max-width: 768px) {
  .block-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .block-toolbar :deep(.auth-rr-button) {
    width: 100%;
  }

  .report-export-btn {
    width: 100%;
  }
}
</style>
