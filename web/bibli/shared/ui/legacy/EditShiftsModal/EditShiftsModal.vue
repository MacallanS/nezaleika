<template>
  <component
    :is="embedded ? 'div' : BaseModal"
    v-bind="wrapperBind"
    @update:modelValue="onWrapperModelUpdate"
  >
    <div :class="embedded ? 'edit-shifts-embedded-inner' : 'edit-shifts-modal-inner'">
      <FiltersBar
        :filters="filterConfigs"
        :model-value="filterValues"
        :show-mobile-button="embedded"
        @update:model-value="handleFiltersUpdate"
        @filter-change="handleFilterChange"
        @reset="handleReset"
      />

    <div class="edit-shifts-table-stack">
    <div class="table-controls-section">
      <div class="controls-row">
        <div class="shift-settings-compact shift-settings-wide">
          <span class="shift-settings-label">
            <i class="pi pi-clock"></i>
            Интервалы:
          </span>
          <div class="interval-palette-wrap">
            <div class="interval-palette-desktop">
              <div
                v-if="plannedShiftIntervals.length === 0"
                class="interval-palette-empty"
              >
                Нет сохранённых интервалов
              </div>
              <div
                v-else
                class="interval-palette"
                role="tablist"
                aria-label="Шаблоны смен"
              >
                <button
                  v-for="interval in plannedShiftIntervals"
                  :key="interval.id"
                  type="button"
                  role="tab"
                  :aria-selected="
                    Number(selectedIntervalId) === Number(interval.id)
                  "
                  :class="[
                    'interval-chip',
                    {
                      'interval-chip-active':
                        Number(selectedIntervalId) === Number(interval.id),
                    },
                  ]"
                  :title="formatIntervalFullLabel(interval)"
                  @click="handleIntervalSelect(interval.id)"
                >
                  {{ formatIntervalFullLabel(interval) }}
                </button>
              </div>
            </div>
            <div class="interval-palette-mobile">
              <div
                v-if="plannedShiftIntervals.length === 0"
                class="interval-palette-empty"
              >
                Нет сохранённых интервалов
              </div>
              <select
                v-else
                class="interval-template-select"
                :value="selectedIntervalSelectValue"
                aria-label="Шаблон смены"
                @change="onIntervalNativeChange($event)"
              >
                <option value="" disabled>
                  Выберите шаблон смены
                </option>
                <option
                  v-for="interval in plannedShiftIntervals"
                  :key="'m-iv-' + interval.id"
                  :value="String(interval.id)"
                >
                  {{ formatIntervalFullLabel(interval) }}
                </option>
              </select>
            </div>
            <button
              type="button"
              class="interval-settings-btn"
              @click.stop="$emit('open-custom-interval')"
              title="Создать новый интервал"
            >
              <i class="pi pi-cog"></i>
            </button>
          </div>
        </div>

        <div v-if="filteredPlannedShiftsStaffList.length" class="pagination-compact">
          <button
            class="pagination-btn"
            :disabled="editModePage <= 1"
            @click="$emit('page-change', editModePage - 1)"
          >
            <i class="pi pi-chevron-left"></i>
          </button>
          <span class="pagination-info">{{ editModePage }} / {{ editModeLastPage }}</span>
          <button
            class="pagination-btn"
            :disabled="editModePage >= editModeLastPage"
            @click="$emit('page-change', editModePage + 1)"
          >
            <i class="pi pi-chevron-right"></i>
          </button>
          <select
            :model-value="editModePerPage"
            class="pagination-select"
            @change="$emit('per-page-change', Number(($event.target as HTMLSelectElement).value))"
          >
            <option
              v-for="option in editModePerPageOptions"
              :key="option"
              :value="option"
            >
              {{ option }}
            </option>
          </select>
        </div>
      </div>
      <div class="edit-modes-toolbar">
        <button
          type="button"
          class="mode-chip"
          :class="{ 'mode-chip-on': paintMode }"
          title="Один клик по ячейке: поставить или снять смену с выбранным шаблоном (сверху). Если в ячейке уже другая смена — клик заменит её на выбранный шаблон."
          @click="togglePaintMode"
        >
          <i class="pi pi-check-square" aria-hidden="true" />
          По клику
        </button>
        <button
          type="button"
          class="mode-chip"
          :class="{ 'mode-chip-on': rangeSelectMode }"
          title="Первый клик — угол, второй — противоположный угол прямоугольника; область добавляется к выделению, можно задать несколько прямоугольников подряд. Сброс — кнопка «Сброс выделения»."
          @click="toggleRangeSelectMode"
        >
          <i class="pi pi-table" aria-hidden="true" />
          Выделение
        </button>
        <span
          v-if="selectedIntervalId == null || selectedIntervalId === ''"
          class="toolbar-interval-hint"
        >Выберите интервал</span>
      </div>
    </div>

    <div class="table-container-edit" :class="{ 'paint-mode-on': paintMode }">
      <div v-if="rectSelectNeedsSecondClick" class="rect-corner-hint">
        <span class="rect-corner-hint-mark" aria-hidden="true">1</span>
        <span>Угол отмечен — кликните <strong>вторую</strong> ячейку области; ячейки добавятся к выделению. Затем можно снова отметить угол и задать ещё область. Повторный клик по первой ячейке снимает только текущий угол.</span>
      </div>
      <div v-if="rectSelectionCount > 0" class="rect-selection-bar">
        <span class="rect-selection-label">Выбрано ячеек: {{ rectSelectionCount }}</span>
        <button type="button" class="rect-bar-btn rect-bar-primary" @click="applyRectSelection">
          Поставить интервал
        </button>
        <button type="button" class="rect-bar-btn" @click="emitClearRectCells">
          Снять смены
        </button>
        <button type="button" class="rect-bar-btn rect-bar-ghost" @click="resetRectSelection">
          Сброс выделения
        </button>
      </div>
      <div class="table-responsive-edit">
        <table class="staff-table-edit">
          <thead>
            <tr>
              <th class="sticky-col-edit left-col-edit wide-col-edit">
                ФИО
              </th>
              <th class="wide-col-edit">Телефон</th>
              <th
                v-for="date in editModalMonthDates"
                :key="date"
                :class="{ 'weekend-header-edit': isWeekend(date) }"
              >
                <div class="date-number-edit">
                  {{ date.slice(-2) }}
                </div>
                <div class="weekday-name-edit">
                  {{ getWeekdayName(date) }}
                </div>
              </th>
              <th class="sticky-summary-pack summary-head-cell" scope="colgroup">
                <div
                  class="summary-inner-head"
                  :style="{ '--summary-cols': summaryColumnCount }"
                >
                  <span title="Сумма часов по плану (черновик + сохранённое)">Часы по плану</span>
                  <span title="Количество смен по плану">Смен</span>
                  <span title="Сумма фактических часов по дням (из отчёта)">Факт ч</span>
                  <span title="Данные API не подключены">Яндекс</span>
                  <span title="Данные API не подключены">ДВД</span>
                  <span v-if="showCoeffColumns" title="Сумма коэффициентов пилотных продуктов за месяц">Коэф.</span>
                  <span v-if="showCoeffColumns" title="Коэффициент на час по плану">Коэф/ч</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="staff in paginatedEditStaffList"
              :key="staff.id"
              :data-staff-id="staff.id"
            >
              <td class="sticky-col-edit left-col-edit wide-col-edit">
                <div class="staff-name-edit">
                  {{ staff.surname }} {{ staff.name }}
                  <span v-if="staff.patronymic">{{
                    staff.patronymic
                  }}</span>
                </div>
                <div v-if="staff.code" class="staff-code-edit">
                  Код: {{ staff.code }}
                </div>
              </td>
              <td class="wide-col-edit">{{ staff.phone }}</td>
              <td
                v-for="date in editModalMonthDates"
                :key="date"
                :data-shift-date="date"
                :class="[
                  'shift-cell-wrap',
                  {
                    'has-pending': isPendingShiftSelection(staff.id, date),
                    'inline-saving': resolveInlineSaving(staff.id, date),
                    'rect-range-highlight': isRectHighlight(staff.id, date),
                    'rect-range-anchor-wait': isRectAnchorAwaitingSecond(staff.id, date),
                  },
                ]"
              >
                <div
                  v-if="resolveInlineSaving(staff.id, date)"
                  class="shift-cell-inline-overlay"
                  aria-hidden="true"
                >
                  <i class="pi pi-spinner shift-cell-inline-spinner" />
                </div>
                <button
                  v-if="!isPastDate(date) && (hasShiftOnDate(staff.id, date) || isPendingShiftSelection(staff.id, date))"
                  type="button"
                  class="shift-cell-edit"
                  title="Другой интервал"
                  aria-label="Выбрать другой интервал смены"
                  @click.stop="openDayEdit(staff.id, date)"
                >
                  <i class="pi pi-pencil" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  class="shift-cell-tile"
                  :class="{
                    'shift-cell-tile-filled': hasShiftOnDate(staff.id, date),
                    'shift-cell-tile-pending': isPendingShiftSelection(staff.id, date),
                    'shift-cell-tile-past': isPastDate(date),
                    'shift-cell-tile-paint': paintMode && !isPastDate(date),
                  }"
                  :disabled="isPastDate(date)"
                  :aria-pressed="hasShiftOnDate(staff.id, date) || isPendingShiftSelection(staff.id, date)"
                  :aria-label="getShiftTooltip(staff.id, date)"
                  @click="onMainTileClick($event, staff.id, date)"
                  @pointerdown="onTileLongPressStart(staff.id, date)"
                  @pointerup="onTileLongPressEnd"
                  @pointerleave="onTileLongPressEnd"
                  @pointercancel="onTileLongPressEnd"
                  @keydown.space.prevent="onMainTileKeydown($event, staff.id, date)"
                  @keydown.enter.prevent="onMainTileKeydown($event, staff.id, date)"
                >
                  <template v-if="isPastDate(date)">
                    <span class="shift-cell-muted">—</span>
                  </template>
                  <template v-else-if="hasShiftOnDate(staff.id, date)">
                    <template
                      v-for="slot in shiftCellTimeSlot(staff.id, date, 'saved')"
                      :key="'t-s-' + staff.id + '-' + date"
                    >
                      <div v-if="slot.compact" class="shift-time-compact">
                        <div class="shift-time-dur-hero" :title="slot.title">
                          <template v-if="slot.compact.dh === 0 && slot.compact.dm > 0">
                            <span class="shift-time-dur-hours">{{ slot.compact.dm }}</span>
                            <span class="shift-time-dur-prime" title="минут">′</span>
                          </template>
                          <template v-else>
                            <span class="shift-time-dur-hours">{{ slot.compact.dh }}</span>
                            <template v-if="slot.compact.dm">
                              <span class="shift-time-dur-ratio" aria-hidden="true">∶</span>
                              <span class="shift-time-dur-min">{{ padDurMinutes(slot.compact.dm) }}</span>
                            </template>
                            <span v-else class="shift-time-dur-unit">ч</span>
                          </template>
                        </div>
                        <div class="shift-time-start-muted">
                          <span class="shift-time-start-clock">с {{ slot.compact.start }}</span>
                          <template v-if="getShiftTimezoneLabel(staff.id, date)">
                            <span class="shift-time-tz-sep" aria-hidden="true">·</span>
                            <span class="shift-time-tz-label">{{ getShiftTimezoneLabel(staff.id, date) }}</span>
                          </template>
                        </div>
                      </div>
                      <span v-else class="shift-time-line">
                        {{ slot.raw }}<template v-if="getShiftTimezoneLabel(staff.id, date)"><span class="shift-time-inline-tz"> · {{ getShiftTimezoneLabel(staff.id, date) }}</span></template>
                      </span>
                    </template>
                  </template>
                  <template v-else-if="isPendingShiftSelection(staff.id, date)">
                    <template
                      v-for="slot in shiftCellTimeSlot(staff.id, date, 'pending')"
                      :key="'t-p-' + staff.id + '-' + date"
                    >
                      <div v-if="slot.compact" class="shift-time-compact pending">
                        <div class="shift-time-dur-hero" :title="slot.title">
                          <template v-if="slot.compact.dh === 0 && slot.compact.dm > 0">
                            <span class="shift-time-dur-hours">{{ slot.compact.dm }}</span>
                            <span class="shift-time-dur-prime" title="минут">′</span>
                          </template>
                          <template v-else>
                            <span class="shift-time-dur-hours">{{ slot.compact.dh }}</span>
                            <template v-if="slot.compact.dm">
                              <span class="shift-time-dur-ratio" aria-hidden="true">∶</span>
                              <span class="shift-time-dur-min">{{ padDurMinutes(slot.compact.dm) }}</span>
                            </template>
                            <span v-else class="shift-time-dur-unit">ч</span>
                          </template>
                        </div>
                        <div class="shift-time-start-muted">
                          <span class="shift-time-start-clock">с {{ slot.compact.start }}</span>
                          <template v-if="getShiftTimezoneLabel(staff.id, date)">
                            <span class="shift-time-tz-sep" aria-hidden="true">·</span>
                            <span class="shift-time-tz-label">{{ getShiftTimezoneLabel(staff.id, date) }}</span>
                          </template>
                        </div>
                      </div>
                      <span v-else class="shift-time-line pending">
                        {{ slot.raw }}<template v-if="getShiftTimezoneLabel(staff.id, date)"><span class="shift-time-inline-tz"> · {{ getShiftTimezoneLabel(staff.id, date) }}</span></template>
                      </span>
                    </template>
                  </template>
                  <template v-else>
                    <span class="shift-cell-slot" aria-hidden="true">
                      <span class="shift-cell-slot-line" />
                    </span>
                  </template>
                </button>
                <div
                  v-if="dayEditOpen && dayEditOpen.userId === staff.id && dayEditOpen.date === date"
                  class="day-edit-popover"
                  @click.stop
                >
                  <div class="day-edit-popover-title">Интервал для дня</div>
                  <div class="day-edit-interval-list">
                    <button
                      v-for="iv in plannedShiftIntervals"
                      :key="iv.id"
                      type="button"
                      :class="['day-edit-interval-btn', { active: dayEditIntervalId === iv.id }]"
                      @click="applyDayInterval(staff.id, date, iv.id)"
                    >
                      {{ formatIntervalFullLabel(iv) }}
                    </button>
                  </div>
                  <div class="day-edit-actions">
                    <button type="button" class="day-edit-cancel" @click="closeDayEdit">
                      Отмена
                    </button>
                  </div>
                </div>
              </td>
              <td class="sticky-summary-pack summary-body-cell">
                <div
                  class="summary-inner-body"
                  :style="{ '--summary-cols': summaryColumnCount }"
                >
                  <span>{{ resolveStaffSummary(staff).planHoursTotal }}</span>
                  <span>{{ resolveStaffSummary(staff).planShiftCount }}</span>
                  <span>{{ resolveStaffSummary(staff).factHoursTotal }}</span>
                  <span>{{ resolveStaffSummary(staff).yandex }}</span>
                  <span>{{ resolveStaffSummary(staff).dvd }}</span>
                  <span v-if="showCoeffColumns">{{ resolveStaffSummary(staff).coeffTotal }}</span>
                  <span v-if="showCoeffColumns">{{ resolveStaffSummary(staff).coeffPerHour }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        v-if="loading"
        class="table-loading-overlay"
      >
        <div class="table-loading-content">
          <span class="spinner"></span>
          <span class="table-loading-text">Обновляем данные…</span>
        </div>
      </div>
      <div
        v-if="
          !loading && filteredPlannedShiftsStaffList.length === 0
        "
        class="empty-shifts-message"
      >
        Нет сотрудников для отображения
      </div>
    </div>
    </div>
    </div>
    <template v-if="!embedded" #footer>
      <button
        class="btn-primary"
        :disabled="!canSubmitPendingBatch"
        @click="$emit('submit')"
      >
        {{ isBatchSubmitting ? "Сохраняем…" : "Сохранить" }}
      </button>
      <button class="btn-cancel-modern" @click="$emit('close')">
        Закрыть
      </button>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted, watch } from 'vue';
import type { FilterConfig } from '../FiltersBar/FiltersBar.vue';
import { FiltersBar } from '../FiltersBar';
import { BaseModal } from '../BaseModal';
import MonthPicker from '../MonthPicker/MonthPicker.vue';
import type { Staff, PlannedShiftInterval, EditModalStaffSummary } from './types';

interface Props {
  embedded?: boolean;
  visible: boolean;
  loading: boolean;
  /** When true, show pilot-product coefficient summary columns (Коэф. / Коэф/ч). */
  showCoeffColumns?: boolean;
  search: string;
  projectFilter: string | number;
  pointFilter: string | number;
  month: number;
  year: number;
  projects: Array<{ id: number | string; name: string }>;
  points: Array<{ id: number | string; name: string }>;
  monthNames: string[];
  yearOptions: Array<{ id: number; name: string }>;
  plannedShiftIntervals: PlannedShiftInterval[];
  selectedIntervalId?: number | string | undefined;
  editModePage: number;
  editModeLastPage: number;
  editModePerPage: number;
  editModePerPageOptions: number[];
  filteredPlannedShiftsStaffList: Staff[];
  paginatedEditStaffList: Staff[];
  editModalMonthDates: string[];
  canSubmitPendingBatch: boolean;
  isBatchSubmitting: boolean;
  getStaffSummary?: (staff: Staff) => EditModalStaffSummary;
  isInlineSaving?: (userId: number, date: string) => boolean;
  // Methods
  formatIntervalFullLabel: (interval: PlannedShiftInterval) => string;
  getWeekdayName: (date: string) => string;
  isWeekend: (date: string) => boolean;
  isPendingShiftSelection: (userId: number, date: string) => boolean;
  hasShiftOnDate: (userId: number, date: string) => boolean;
  getShiftTimezoneLabel: (userId: number, date: string) => string;
  getShiftDisplayTime: (userId: number, date: string) => string;
  getPendingShiftDisplayTime: (userId: number, date: string) => string;
  isPastDate: (date: string) => boolean;
  getShiftTooltip: (userId: number, date: string) => string;
}

const props = withDefaults(defineProps<Props>(), {
  embedded: false,
  showCoeffColumns: false,
});

const summaryColumnCount = computed(() => (props.showCoeffColumns ? 7 : 5));

const emit = defineEmits<{
  'close': [];
  'submit': [];
  'open-custom-interval': [];
  'page-change': [page: number];
  'per-page-change': [perPage: number];
  'search-change': [value: string];
  'search-submit': [];
  'project-filter-change': [value: string | number];
  'point-filter-change': [value: string | number];
  'month-change': [value: number];
  'year-change': [value: number];
  'interval-select': [value: number | string | undefined];
  'toggle-shift': [userId: number, date: string, event: Event];
  'reset-filters': [];
  'update-shift-immediate': [payload: { userId: number; date: string; intervalId: number }];
  'apply-shifts-cells': [payload: { cells: { userId: number; date: string }[] }];
  'clear-shifts-cells': [payload: { cells: { userId: number; date: string }[] }];
}>();

const wrapperBind = computed(() => {
  if (props.embedded) {
    return { class: 'edit-shifts-embedded' };
  }
  return {
    modelValue: props.visible,
    class: 'edit-shifts-base-modal',
    title: 'Редактирование запланированных смен',
    width: 1520,
    maxWidth: '1680px',
  };
});

function onWrapperModelUpdate(val: boolean) {
  if (!props.embedded && !val) {
    emit('close');
  }
}

const EMPTY_SUMMARY: EditModalStaffSummary = {
  planHoursTotal: '—',
  planShiftCount: '—',
  factHoursTotal: '—',
  yandex: '—',
  dvd: '—',
  coeffTotal: '—',
  coeffPerHour: '—',
};

function resolveStaffSummary(staff: Staff): EditModalStaffSummary {
  return props.getStaffSummary ? props.getStaffSummary(staff) : EMPTY_SUMMARY;
}

function resolveInlineSaving(userId: number, date: string): boolean {
  return props.isInlineSaving ? props.isInlineSaving(userId, date) : false;
}

const RE_SHIFT_TIME = /^(\d{1,2}):(\d{2})(?::\d{2})?$/;

/** Парсинг диапазона для ячейки: начало, конец, длительность в ч/мин (полный интервал в title). */
function parseShiftTimeCompact(full: string): { start: string; end: string; dh: number; dm: number } | null {
  if (!full || !full.includes('-')) return null;
  const idx = full.indexOf('-');
  const left = full.slice(0, idx).trim();
  const right = full.slice(idx + 1).trim();
  const m1 = left.match(RE_SHIFT_TIME);
  const m2 = right.match(RE_SHIFT_TIME);
  if (!m1 || !m2) return null;
  const sh = Number(m1[1]);
  const smin = m1[2];
  const eh = Number(m2[1]);
  const emin = m2[2];
  const start = `${sh}:${smin}`;
  const end = `${eh}:${emin}`;
  const toMin = (h: number, min: string) => h * 60 + Number(min);
  let sMm = toMin(sh, smin);
  let eMm = toMin(eh, emin);
  if (eMm <= sMm) eMm += 24 * 60;
  const diff = eMm - sMm;
  const dh = Math.floor(diff / 60);
  const dm = diff % 60;
  return { start, end, dh, dm };
}

function padDurMinutes(dm: number): string {
  return dm < 10 ? `0${dm}` : String(dm);
}

function shiftCellTimeSlot(
  userId: number,
  date: string,
  kind: 'saved' | 'pending'
): Array<{ compact: { start: string; end: string; dh: number; dm: number } | null; raw: string; title: string }> {
  const raw =
    kind === 'pending'
      ? props.getPendingShiftDisplayTime(userId, date)
      : props.getShiftDisplayTime(userId, date);
  const compact = parseShiftTimeCompact(raw);
  let title = raw ? raw.replace('-', ' — ') : '';
  if (compact) {
    const dk =
      compact.dh === 0 && compact.dm > 0
        ? `${compact.dm} мин`
        : compact.dm === 0
          ? `${compact.dh} ч`
          : `${compact.dh} ч ${compact.dm} мин`;
    title = title ? `${title} · ${dk}` : dk;
  }
  return [{ compact, raw, title }];
}

const dayEditOpen = ref<{ userId: number; date: string } | null>(null);
const dayEditIntervalId = ref<number | null>(null);

const paintMode = ref(false);
const rangeSelectMode = ref(false);
const rectAnchor = ref<{ staffId: number; date: string } | null>(null);
/** Объединённое выделение: несколько прямоугольников подряд без дублирования ячеек. */
const accumulatedRectCells = ref<Map<string, { userId: number; date: string }>>(new Map());
let longPressTimer: number | null = null;

function syntheticToggleEvent(nextChecked: boolean): Event {
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = nextChecked;
  return { target: input } as unknown as Event;
}

function staffRowIndex(staffId: number): number {
  return props.paginatedEditStaffList.findIndex((s) => s.id === staffId);
}

function dateColIndex(date: string): number {
  return props.editModalMonthDates.indexOf(date);
}

function rectCellKey(userId: number, date: string): string {
  return `${userId}_${date}`;
}

function computeRectCellsBetween(
  a: { staffId: number; date: string },
  b: { staffId: number; date: string }
): { userId: number; date: string }[] {
  const i0 = staffRowIndex(a.staffId);
  const i1 = staffRowIndex(b.staffId);
  const d0 = dateColIndex(a.date);
  const d1 = dateColIndex(b.date);
  if (i0 < 0 || i1 < 0 || d0 < 0 || d1 < 0) return [];
  const ri0 = Math.min(i0, i1);
  const ri1 = Math.max(i0, i1);
  const di0 = Math.min(d0, d1);
  const di1 = Math.max(d0, d1);
  const out: { userId: number; date: string }[] = [];
  for (let i = ri0; i <= ri1; i++) {
    const staff = props.paginatedEditStaffList[i];
    if (!staff) continue;
    for (let j = di0; j <= di1; j++) {
      const date = props.editModalMonthDates[j];
      if (date) out.push({ userId: staff.id, date });
    }
  }
  return out;
}

function mergeRectCellsIntoAccumulated(cells: { userId: number; date: string }[]) {
  const m = new Map(accumulatedRectCells.value);
  for (const c of cells) {
    m.set(rectCellKey(c.userId, c.date), c);
  }
  accumulatedRectCells.value = m;
}

const rectSelectionCount = computed(() => accumulatedRectCells.value.size);

const rectSelectNeedsSecondClick = computed(
  () => rangeSelectMode.value && !!rectAnchor.value
);

function isRectHighlight(staffId: number, date: string): boolean {
  return accumulatedRectCells.value.has(rectCellKey(staffId, date));
}

/** Первая точка прямоугольника выбрана, ждём второй клик — подсветка угла. */
function isRectAnchorAwaitingSecond(staffId: number, date: string): boolean {
  if (!rangeSelectMode.value || !rectAnchor.value) return false;
  return rectAnchor.value.staffId === staffId && rectAnchor.value.date === date;
}

function resetRectSelection() {
  rectAnchor.value = null;
  accumulatedRectCells.value = new Map();
}

function togglePaintMode() {
  const next = !paintMode.value;
  paintMode.value = next;
  if (next) {
    rangeSelectMode.value = false;
    resetRectSelection();
  }
}

function toggleRangeSelectMode() {
  const next = !rangeSelectMode.value;
  rangeSelectMode.value = next;
  if (!next) {
    resetRectSelection();
  } else {
    paintMode.value = false;
    resetRectSelection();
  }
}

function resolveIntervalIdFromCellDisplay(userId: number, date: string): number | null {
  const disp = props.getShiftDisplayTime(userId, date);
  if (!disp) return null;
  const found = props.plannedShiftIntervals.find((i: PlannedShiftInterval) => {
    const st = i.start_time.slice(0, 5);
    const en = i.end_time.slice(0, 5);
    return disp === `${st}-${en}`;
  });
  return found?.id ?? null;
}

function onMainTileClick(ev: MouseEvent, staffId: number, date: string) {
  if (props.isPastDate(date)) return;
  if (rangeSelectMode.value) {
    if (ev.shiftKey && rectAnchor.value) {
      mergeRectCellsIntoAccumulated(
        computeRectCellsBetween(rectAnchor.value, { staffId, date })
      );
      rectAnchor.value = null;
      return;
    }
    const a = rectAnchor.value;
    if (!a) {
      rectAnchor.value = { staffId, date };
      return;
    }
    const sameCell = a.staffId === staffId && a.date === date;
    if (sameCell) {
      rectAnchor.value = null;
      return;
    }
    mergeRectCellsIntoAccumulated(computeRectCellsBetween(a, { staffId, date }));
    rectAnchor.value = null;
    return;
  }
  const visuallyOn =
    props.hasShiftOnDate(staffId, date) ||
    props.isPendingShiftSelection(staffId, date);
  const sel = props.selectedIntervalId;
  const hasSelectedInterval =
    sel !== undefined && sel !== null && sel !== '';
  if (paintMode.value && hasSelectedInterval && visuallyOn) {
    const currentId = resolveIntervalIdFromCellDisplay(staffId, date);
    const selectedNum = Number(sel);
    const sameAsSelected =
      currentId != null && Number(currentId) === selectedNum;
    if (!sameAsSelected) {
      emit('update-shift-immediate', {
        userId: staffId,
        date,
        intervalId: selectedNum,
      });
      return;
    }
  }
  const nextChecked = !visuallyOn;
  emit('toggle-shift', staffId, date, syntheticToggleEvent(nextChecked));
}

function onMainTileKeydown(ev: KeyboardEvent, staffId: number, date: string) {
  onMainTileClick(ev as unknown as MouseEvent, staffId, date);
}

function onTileLongPressStart(staffId: number, date: string) {
  if (rangeSelectMode.value || props.isPastDate(date)) return;
  if (
    !props.hasShiftOnDate(staffId, date) &&
    !props.isPendingShiftSelection(staffId, date)
  ) {
    return;
  }
  onTileLongPressEnd();
  longPressTimer = window.setTimeout(() => {
    longPressTimer = null;
    openDayEdit(staffId, date);
  }, 550);
}

function onTileLongPressEnd() {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}

function getAccumulatedRectCellsArray(): { userId: number; date: string }[] {
  return [...accumulatedRectCells.value.values()];
}

function applyRectSelection() {
  const cells = getAccumulatedRectCellsArray();
  if (!cells.length) return;
  emit('apply-shifts-cells', { cells });
  resetRectSelection();
}

function emitClearRectCells() {
  const cells = getAccumulatedRectCellsArray();
  if (!cells.length) return;
  emit('clear-shifts-cells', { cells });
  resetRectSelection();
}

function onDocumentPointerDown(ev: PointerEvent) {
  const t = ev.target as Node | null;
  if (t && typeof (t as Element).closest === 'function') {
    const el = t as Element;
    if (
      el.closest('.day-edit-popover') ||
      el.closest('.shift-cell-edit')
    ) {
      return;
    }
  }
  if (dayEditOpen.value) closeDayEdit();
}

watch(
  () => !!dayEditOpen.value,
  (on, prev) => {
    if (on && !prev) {
      document.addEventListener('pointerdown', onDocumentPointerDown, true);
    } else if (!on && prev) {
      document.removeEventListener('pointerdown', onDocumentPointerDown, true);
    }
  }
);

watch(
  () => props.visible,
  (v) => {
    if (!v) {
      paintMode.value = false;
      rangeSelectMode.value = false;
      resetRectSelection();
      closeDayEdit();
      onTileLongPressEnd();
    } else {
      paintMode.value = true;
      rangeSelectMode.value = false;
      resetRectSelection();
    }
  },
  { immediate: true }
);

function handleIntervalSelect(value: number | string | undefined) {
  emit('interval-select', value);
  if (value !== undefined && value !== null && value !== '') {
    paintMode.value = true;
    rangeSelectMode.value = false;
    resetRectSelection();
  }
}

const selectedIntervalSelectValue = computed(() => {
  const s = props.selectedIntervalId;
  if (s === undefined || s === null || s === '') return '';
  return String(s);
});

function onIntervalNativeChange(ev: Event) {
  const el = ev.target as HTMLSelectElement;
  const raw = el.value;
  if (raw === '') {
    handleIntervalSelect(undefined);
    return;
  }
  const n = Number(raw);
  handleIntervalSelect(Number.isNaN(n) ? raw : n);
}

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown, true);
  onTileLongPressEnd();
});

function openDayEdit(userId: number, date: string) {
  dayEditOpen.value = { userId, date };
  const disp = props.getShiftDisplayTime(userId, date);
  const found =
    disp &&
    props.plannedShiftIntervals.find((i: PlannedShiftInterval) => {
      const st = i.start_time.slice(0, 5);
      const en = i.end_time.slice(0, 5);
      return disp === `${st}-${en}`;
    });
  dayEditIntervalId.value =
    found?.id ??
    (props.selectedIntervalId !== undefined &&
    props.selectedIntervalId !== null &&
    props.selectedIntervalId !== ''
      ? Number(props.selectedIntervalId)
      : props.plannedShiftIntervals[0]?.id ?? null);
}

function closeDayEdit() {
  dayEditOpen.value = null;
  dayEditIntervalId.value = null;
}

function applyDayInterval(userId: number, date: string, intervalId: number) {
  emit('update-shift-immediate', {
    userId,
    date,
    intervalId,
  });
  closeDayEdit();
}

const filterConfigs = computed<FilterConfig[]>(() => {
  const configs: FilterConfig[] = [
    {
      key: 'search',
      type: 'search',
      label: 'Поиск',
      placeholder: 'Поиск по ФИО',
      onChange: () => emit('search-submit'),
    },
    {
      key: 'project',
      type: 'select',
      label: 'Проект',
      placeholder: 'Все проекты',
      options: [
        { id: '', name: 'Все' },
        ...props.projects.map((p) => ({ id: p.id, name: p.name })),
      ],
      searchable: false,
      hideWhenSingle: true,
      onChange: (value) => emit('project-filter-change', value),
    },
  ];

  if (props.projectFilter !== '' && props.projectFilter != null) {
    configs.push({
      key: 'point',
      type: 'select',
      label: 'Точка',
      placeholder: 'Все точки',
      options: [
        { id: '', name: 'Все' },
        ...props.points.map((p) => ({ id: p.id, name: p.name })),
      ],
      searchable: true,
      hideWhenSingle: true,
      onChange: (value) => emit('point-filter-change', value),
    });
  }

  configs.push({
    key: 'monthYear',
    type: 'custom',
    label: 'Месяц и год',
    placeholder: 'Месяц и год',
    component: MonthPicker,
    props: {
      placeholder: 'Месяц и год',
    },
  });

  return configs;
});

const filterValues = computed(() => ({
  search: props.search,
  project: props.projectFilter,
  point: props.pointFilter,
  /** MonthPicker: month 0–11, year — как в компоненте bibli */
  monthYear: {
    year: props.year,
    month: Math.max(0, Math.min(11, props.month - 1)),
  },
}));

const handleFiltersUpdate = (values: Record<string, any>) => {
  if (values.search !== undefined && values.search !== props.search) {
    emit('search-change', values.search);
  }
  if (values.project !== undefined && values.project !== props.projectFilter) {
    emit('project-filter-change', values.project);
  }
  if (values.point !== undefined && values.point !== props.pointFilter) {
    emit('point-filter-change', values.point);
  }
  if (values.monthYear !== undefined) {
    const raw = values.monthYear;
    if (raw && typeof raw === 'object' && raw.year != null && raw.month != null) {
      const y = Number(raw.year);
      const m1 = Number(raw.month) + 1;
      if (m1 !== props.month) emit('month-change', m1);
      if (y !== props.year) emit('year-change', y);
    }
  }
};

const handleFilterChange = (key: string, value: any) => {
  if (key === 'search') {
    emit('search-change', value);
  } else if (key === 'project') {
    emit('project-filter-change', value);
  } else if (key === 'point') {
    emit('point-filter-change', value);
  } else if (key === 'monthYear') {
    if (value && typeof value === 'object' && value.year != null && value.month != null) {
      const y = Number(value.year);
      const m1 = Number(value.month) + 1;
      if (m1 !== props.month) emit('month-change', m1);
      if (y !== props.year) emit('year-change', y);
    }
  }
};

const handleReset = () => {
  emit('reset-filters');
};
</script>

<style scoped>
:deep(.edit-shifts-base-modal) {
  --ui-control-height: 40px;
  --filter-control-height: var(--ui-control-height);
}

.modal-section-modern.filters-section {
  padding: 20px;
  background: var(--russ-bg-secondary);
  border-radius: 12px;
  margin-bottom: 20px;
}

.edit-shifts-table-stack {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.table-controls-section {
  margin-bottom: 0;
  padding: 12px 16px 8px;
  background: var(--russ-bg);
  border: 1.5px solid var(--russ-border);
  border-radius: 12px 12px 0 0;
  box-shadow: 0 2px 12px var(--russ-shadow-primary-light),
    0 1.5px 4px var(--russ-shadow-color);
  width: 100%;
  box-sizing: border-box;
}

.controls-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: nowrap;
  width: 100%;
  padding: 10px 0;
  border-bottom: 1px solid var(--russ-border);
}

.edit-modes-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
  padding: 8px 0 4px;
  font-size: 12px;
  color: var(--russ-text-secondary);
}

.mode-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--russ-border);
  background: var(--russ-bg-secondary);
  color: var(--russ-text-primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s;
}

.mode-chip i {
  font-size: 13px;
  color: var(--russ-text-muted);
}

.mode-chip:hover {
  border-color: var(--russ-primary);
  color: var(--russ-primary);
}

.mode-chip-on {
  border-color: var(--russ-primary);
  background: var(--russ-info-light);
  color: var(--russ-primary);
}

.mode-chip-on i {
  color: var(--russ-primary);
}

.toolbar-interval-hint {
  font-size: 11px;
  font-style: italic;
  color: var(--russ-text-muted);
}

@media (max-width: 1024px) {
  .controls-row {
    flex-wrap: wrap;
    gap: 12px;
  }

  .shift-settings-compact {
    width: 100%;
    max-width: 100%;
    order: 1;
  }

  .pagination-compact {
    width: 100%;
    order: 2;
    padding-left: 0;
    border-left: none;
    border-top: 1px solid var(--russ-border);
    padding-top: 12px;
    justify-content: center;
  }

  .shift-settings-label {
    font-size: 11px;
  }

  .interval-palette-wrap {
    min-width: 0;
  }
}

.shift-settings-compact {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.shift-settings-compact.shift-settings-wide {
  max-width: none;
}

.interval-palette-wrap {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.interval-palette-desktop {
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: flex-start;
}

.interval-palette-mobile {
  display: none;
  flex: 1;
  min-width: 0;
  align-items: stretch;
}

.interval-template-select {
  width: 100%;
  min-height: var(--ui-control-height, 40px);
  padding: 8px 32px 8px 12px;
  border-radius: 10px;
  border: 1.5px solid var(--russ-border);
  background: var(--russ-bg);
  color: var(--russ-text-primary);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  box-sizing: border-box;
}

.interval-template-select:focus {
  outline: none;
  border-color: var(--russ-primary);
  box-shadow: 0 0 0 3px var(--russ-shadow-accent-light);
}

@media (max-width: 1024px) {
  .interval-palette-desktop {
    display: none !important;
  }

  .interval-palette-mobile {
    display: flex;
  }

  .interval-palette-mobile .interval-palette-empty {
    font-size: 11px;
    line-height: 1.3;
  }
}

.interval-palette {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  flex: 1;
  min-height: 36px;
  max-height: 100px;
  overflow-y: auto;
  padding: 2px 0;
}

.interval-palette-empty {
  font-size: 12px;
  color: var(--russ-text-muted);
}

.interval-chip {
  border: 1px solid var(--russ-border-dark);
  background: var(--russ-bg-secondary);
  color: var(--russ-text-primary);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  line-height: 1.25;
  max-width: 220px;
  transition: background 0.15s, border-color 0.15s;
}

.interval-chip:hover {
  border-color: var(--russ-primary);
  background: var(--russ-bg-tertiary);
}

.interval-chip-active {
  background: var(--russ-primary) !important;
  color: var(--russ-text-inverse) !important;
  border-color: var(--russ-primary) !important;
}

.interval-chip:focus-visible {
  outline: 2px solid var(--russ-primary);
  outline-offset: 2px;
}

.rect-range-highlight {
  outline: 2px dashed var(--russ-accent);
  outline-offset: -2px;
  background: rgba(59, 130, 246, 0.06);
  z-index: 1;
}

.shift-cell-wrap.rect-range-anchor-wait {
  outline: 3px solid var(--russ-primary);
  outline-offset: -2px;
  background: rgba(33, 62, 137, 0.14);
  box-shadow:
    inset 0 0 0 1px rgba(33, 62, 137, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.9);
  z-index: 2;
  animation: rect-anchor-wait-pulse 1.1s ease-in-out infinite;
}

@keyframes rect-anchor-wait-pulse {
  0%,
  100% {
    outline-color: var(--russ-primary);
    background: rgba(33, 62, 137, 0.12);
  }
  50% {
    outline-color: rgba(33, 62, 137, 0.55);
    background: rgba(33, 62, 137, 0.18);
  }
}

.table-container-edit.paint-mode-on .shift-cell-tile:not(.shift-cell-tile-past):not(:disabled) {
  cursor: cell;
}

.rect-selection-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  border: 1px solid var(--russ-info-border);
  background: var(--russ-info-light);
}

.rect-corner-hint {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  margin-bottom: 6px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  color: var(--russ-text-secondary);
  background: rgba(33, 62, 137, 0.06);
  border: 1px dashed rgba(33, 62, 137, 0.22);
}

.rect-corner-hint-mark {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 800;
  color: var(--russ-text-inverse);
  background: var(--russ-primary);
  box-shadow: 0 0 0 2px rgba(33, 62, 137, 0.2);
}

.rect-selection-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--russ-text-primary);
  margin-right: auto;
}

.rect-bar-btn {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid var(--russ-border);
  background: var(--russ-text-inverse);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  color: var(--russ-text-primary);
}

.rect-bar-btn:hover {
  border-color: var(--russ-primary);
  color: var(--russ-primary);
}

.rect-bar-primary {
  background: var(--russ-primary);
  border-color: var(--russ-primary);
  color: var(--russ-text-inverse);
}

.rect-bar-primary:hover {
  filter: brightness(1.05);
  color: var(--russ-text-inverse);
}

.rect-bar-ghost {
  background: transparent;
}

.shift-cell-wrap.inline-saving {
  pointer-events: none;
}

.shift-cell-inline-overlay {
  position: absolute;
  inset: 2px;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(1px);
}

.shift-cell-inline-spinner {
  font-size: 17px;
  color: var(--russ-primary);
  animation: shift-inline-spin 0.75s linear infinite;
}

@keyframes shift-inline-spin {
  to {
    transform: rotate(360deg);
  }
}

.day-edit-popover {
  position: absolute;
  left: 50%;
  top: calc(100% + 6px);
  bottom: auto;
  transform: translateX(-50%);
  z-index: 130;
  background: var(--russ-text-inverse);
  border: 1px solid var(--russ-border-dark);
  border-radius: 10px;
  padding: 10px;
  min-width: 240px;
  max-width: min(92vw, 300px);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.14);
}

.day-edit-popover-title {
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--russ-text-primary);
}

.day-edit-interval-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 180px;
  overflow-y: auto;
  margin-bottom: 10px;
}

.day-edit-interval-btn {
  text-align: left;
  font-size: 11px;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid var(--russ-border);
  background: var(--russ-bg-secondary);
  cursor: pointer;
}

.day-edit-interval-btn.active {
  border-color: var(--russ-primary);
  background: var(--russ-info-light);
}

.day-edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.day-edit-cancel {
  padding: 6px 12px;
  border: 1px solid var(--russ-border);
  border-radius: 6px;
  background: var(--russ-text-inverse);
  font-size: 12px;
  cursor: pointer;
}

.summary-inner-head,
.summary-inner-body {
  display: grid;
  grid-template-columns: repeat(var(--summary-cols, 7), minmax(36px, 1fr));
  gap: 2px;
  font-size: 9px;
  text-align: center;
  line-height: 1.2;
  font-weight: 600;
  color: var(--russ-text-secondary);
}

.summary-inner-body span {
  font-weight: 600;
  color: var(--russ-text-primary);
  padding: 2px 0;
}

.sticky-summary-pack {
  position: sticky;
  right: 0;
  z-index: 90;
  min-width: 272px;
  max-width: 300px;
  background: var(--russ-bg-blue-light) !important;
  box-shadow: -6px 0 14px rgba(0, 0, 0, 0.06);
  vertical-align: middle;
}

.summary-head-cell {
  z-index: 125 !important;
}

.staff-table-edit thead th.sticky-summary-pack {
  top: 0;
}

.staff-table-edit tbody td.sticky-summary-pack {
  background: var(--russ-text-inverse) !important;
}

.staff-table-edit tr:nth-child(even) td.sticky-summary-pack {
  background: var(--russ-bg-quaternary) !important;
}

.staff-table-edit tr:hover td.sticky-summary-pack {
  background: var(--russ-info-light) !important;
}

.shift-settings-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--russ-text-muted);
  white-space: nowrap;
  flex-shrink: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.shift-settings-label i {
  color: var(--russ-primary);
  font-size: 13px;
}

.interval-select-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
  position: relative;
}

.interval-settings-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--russ-text-muted);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.interval-settings-btn:hover {
  background: var(--russ-bg-tertiary);
  color: var(--russ-primary);
}

.interval-settings-btn i {
  font-size: 15px;
}

.pagination-compact {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding-left: 16px;
  border-left: 1px solid var(--russ-border);
}

.pagination-compact .pagination-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--russ-text-muted);
  border-radius: 6px;
}

.pagination-compact .pagination-btn:hover:not(:disabled) {
  background: var(--russ-bg-tertiary);
  color: var(--russ-primary);
}

.pagination-compact .pagination-info {
  font-size: 12px;
  padding: 0 8px;
  min-width: 45px;
  text-align: center;
  color: var(--russ-text-muted);
  font-weight: 500;
}

.pagination-compact .pagination-select {
  padding: 6px 10px;
  border: none;
  background: var(--russ-bg-secondary);
  border-radius: 6px;
  font-size: 12px;
  color: var(--russ-text-primary);
  cursor: pointer;
  height: 32px;
  min-height: 32px;
  transition: all 0.2s;
}

.pagination-compact .pagination-select:hover {
  background: var(--russ-bg-tertiary);
}

.pagination-compact .pagination-select:focus {
  outline: none;
  background: var(--russ-bg);
  box-shadow: 0 0 0 2px rgba(33, 62, 137, 0.1);
}

.pagination-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 12px;
  color: var(--russ-text-muted);
  font-weight: 500;
}

.pagination-select {
  padding: 6px 10px;
  border: none;
  background: var(--russ-bg-secondary);
  border-radius: 6px;
  font-size: 12px;
  color: var(--russ-text-primary);
  cursor: pointer;
  height: 32px;
  min-height: 32px;
  transition: all 0.2s;
}


.table-container-edit {
  background: var(--russ-bg);
  border-radius: 0 0 12px 12px;
  box-shadow: 0 2px 12px var(--russ-shadow-primary-light),
    0 1.5px 4px var(--russ-shadow-color);
  border: 1.5px solid var(--russ-border);
  border-top: none;
  margin-top: 0;
  position: relative;
  padding-bottom: 12px;
}

.table-responsive-edit {
  flex: 1;
  max-height: min(65vh, 620px);
  overflow-x: auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.staff-table-edit {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 12px;
  background: var(--russ-text-inverse);
  border-radius: 8px;
  overflow: visible;
  box-shadow: 0 1px 4px rgba(33, 62, 137, 0.06);
}

.staff-table-edit th,
.staff-table-edit td {
  text-align: center;
  border-bottom: 1px solid var(--russ-bg-tertiary);
  border-right: 1px solid var(--russ-bg-tertiary);
  height: 45px;
  padding: 4px;
}

.staff-table-edit th:last-child,
.staff-table-edit td:last-child {
  border-right: none;
}

.staff-table-edit th {
  background: var(--russ-bg-blue-light);
  font-weight: 700;
  color: var(--russ-primary);
  position: sticky;
  top: 0;
  z-index: 10;
  font-size: 12px;
}

.weekend-header-edit {
  background: var(--russ-bg-disabled) !important;
  color: var(--russ-text-quaternary) !important;
}

.weekend-header-edit .date-number-edit {
  color: var(--russ-text-quaternary) !important;
  font-weight: 700;
}

.weekend-header-edit .weekday-name-edit {
  color: var(--russ-text-quaternary) !important;
  font-weight: 600;
}

.date-number-edit {
  font-size: 12px;
  font-weight: 700;
  color: var(--russ-primary);
  margin-bottom: 1px;
}

.weekday-name-edit {
  font-size: 9px;
  font-weight: 500;
  color: var(--russ-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.staff-table-edit tr:last-child td {
  border-bottom: none;
}

.staff-table-edit tr:nth-child(even) td {
  background: var(--russ-bg-quaternary);
}

.staff-table-edit tr:hover td {
  background: var(--russ-info-light);
}

.sticky-col-edit.left-col-edit {
  position: sticky;
  left: 0;
  background: var(--russ-bg-blue-light);
  z-index: 100;
}

.left-col-edit {
  left: 0;
  z-index: 30;
  text-align: left;
  padding-left: 12px;
}

.staff-table-edit thead th.left-col-edit {
  position: sticky;
  top: 0;
  left: 0;
  z-index: 120;
  background: var(--russ-bg-blue-light);
}

.wide-col-edit {
  min-width: 90px !important;
  max-width: 140px;
  width: 200px;
  font-size: 12px;
  background: var(--russ-bg-blue-light);
  font-weight: 600;
  z-index: 5;
}

.staff-name-edit {
  font-weight: 600;
  padding: 5px;
  color: var(--russ-text-primary);
}

.staff-code-edit {
  font-size: 10px;
  color: var(--russ-text-tertiary);
  font-weight: 500;
}

.shift-cell-wrap {
  padding: 2px !important;
  text-align: center;
  position: relative;
  vertical-align: middle;
}

.shift-cell-tile {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: 0;
  width: 100%;
  box-sizing: border-box;
  min-height: 46px;
  height: 46px;
  max-height: 46px;
  margin: 0;
  padding: 2px 5px 2px 5px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--russ-text-primary);
  font: inherit;
  cursor: pointer;
  user-select: none;
  overflow: hidden;
  text-align: center;
  transition:
    border-color 0.12s,
    background 0.12s,
    box-shadow 0.12s;
}

.shift-cell-tile:focus-visible {
  outline: 2px solid var(--russ-primary);
  outline-offset: 1px;
}

.shift-cell-tile:hover:not(:disabled) {
  border-color: rgba(33, 62, 137, 0.35);
  background: var(--russ-text-inverse);
  box-shadow: none;
}

.shift-cell-tile-filled {
  background: rgba(33, 62, 137, 0.07);
  border-color: rgba(33, 62, 137, 0.28);
}

.shift-cell-tile-pending {
  border-width: 1px;
  border-color: rgba(59, 130, 246, 0.55);
  background: rgba(59, 130, 246, 0.06);
  box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.2);
  animation: none;
}

.shift-cell-tile-past {
  cursor: default;
  background: var(--russ-bg-disabled);
  border-color: var(--russ-border);
  color: var(--russ-text-muted);
}

.shift-cell-tile:disabled {
  opacity: 0.85;
  cursor: not-allowed;
}

.shift-cell-muted {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  flex: 1;
  min-height: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--russ-text-muted);
  line-height: 1;
}

.shift-time-line {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  flex: 1;
  min-height: 0;
  font-size: 10px;
  color: var(--russ-text-primary);
  font-weight: 600;
  white-space: nowrap;
  line-height: 1.15;
  letter-spacing: -0.02em;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
}

.shift-time-line.pending {
  color: var(--russ-accent-dark);
  background: rgba(59, 130, 246, 0.1);
  padding: 1px 4px;
  border-radius: 3px;
}

.shift-time-compact {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: 2px;
  line-height: 1;
  max-width: 100%;
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow: hidden;
}

.shift-time-compact.pending .shift-time-dur-hero {
  background: rgba(59, 130, 246, 0.1);
  border-radius: 6px;
  padding: 2px 5px 1px;
}

.shift-time-dur-hero {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  justify-content: center;
  flex-wrap: nowrap;
  white-space: nowrap;
  width: 100%;
  min-width: 0;
  color: var(--russ-text-primary);
}

.shift-time-dur-hours {
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.06em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.shift-time-dur-prime {
  font-size: 12px;
  font-weight: 700;
  margin-left: 1px;
  color: var(--russ-text-secondary);
  line-height: 1;
}

.shift-time-dur-ratio {
  font-size: 11px;
  font-weight: 600;
  opacity: 0.42;
  margin: 0 1px;
  line-height: 1;
}

.shift-time-dur-min {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: -0.03em;
  opacity: 0.92;
  font-variant-numeric: tabular-nums;
}

.shift-time-dur-unit {
  font-size: 9px;
  font-weight: 700;
  color: var(--russ-text-muted);
  margin-left: 2px;
  align-self: flex-end;
  line-height: 1.2;
  padding-bottom: 1px;
}

.shift-time-start-muted {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0 3px;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  font-size: 8.5px;
  font-weight: 600;
  color: var(--russ-text-muted);
  letter-spacing: 0.01em;
  line-height: 1.25;
  text-align: center;
}

.shift-time-start-clock {
  white-space: nowrap;
}

.shift-time-tz-sep {
  opacity: 0.45;
  font-weight: 500;
}

.shift-time-tz-label {
  font-weight: 800;
  color: var(--russ-text-secondary);
  white-space: nowrap;
}

.shift-time-inline-tz {
  font-weight: 700;
  color: var(--russ-text-secondary);
  white-space: nowrap;
}

.shift-cell-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  flex: 1;
  min-height: 0;
}

.shift-cell-slot-line {
  display: block;
  width: 18px;
  height: 2px;
  border-radius: 1px;
  background: rgba(0, 0, 0, 0.12);
}

.shift-cell-tile.shift-cell-tile-paint:not(:disabled):not(.shift-cell-tile-past):not(
    .shift-cell-tile-filled
  ):not(.shift-cell-tile-pending) {
  border-style: dashed;
  border-color: rgba(33, 62, 137, 0.22);
  background: rgba(33, 62, 137, 0.02);
}

.shift-cell-edit {
  position: absolute;
  top: 1px;
  right: 2px;
  z-index: 14;
  width: 15px;
  height: 15px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(33, 62, 137, 0.1);
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--russ-text-muted);
  cursor: pointer;
  font-size: 8px;
  opacity: 0.82;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: opacity 0.12s ease, color 0.12s ease, background 0.12s ease, border-color 0.12s ease;
}

.shift-cell-wrap:hover .shift-cell-edit {
  opacity: 1;
}

.shift-cell-wrap.has-pending .shift-cell-edit {
  opacity: 1;
  border-color: rgba(59, 130, 246, 0.35);
  background: rgba(255, 255, 255, 0.98);
}

@media (hover: none) {
  .shift-cell-edit {
    opacity: 0.88;
  }
}

.shift-cell-edit:hover {
  color: var(--russ-primary);
  background: rgba(33, 62, 137, 0.08);
  border-color: var(--russ-primary);
}

.shift-cell-wrap.has-pending {
  background: var(--russ-info-light) !important;
  border: 1px solid var(--russ-info-border) !important;
  position: relative;
}

.table-loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.table-loading-content {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid var(--russ-border-dark);
  background: var(--russ-text-inverse);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  font-size: 13px;
  font-weight: 600;
  color: var(--russ-primary);
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--russ-border-light);
  border-top-color: var(--russ-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.table-loading-text {
  font-size: 13px;
}

.empty-shifts-message {
  padding: 40px;
  text-align: center;
  color: var(--russ-text-muted);
  font-size: 14px;
}

.btn-primary {
  padding: 10px 24px;
  background: var(--russ-primary);
  color: var(--russ-text-inverse);
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: var(--russ-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel-modern {
  padding: 10px 24px;
  background: var(--russ-bg);
  color: var(--russ-text-muted);
  border: 1px solid var(--russ-border-light);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel-modern:hover {
  background: var(--russ-bg-secondary);
  border-color: var(--russ-border-dark);
}

/* Мобилка: без липких краёв (ФИО + сводка) — иначе перекрывают все дни; горизонтальный скролл. */
@media (max-width: 1024px) {
  .table-controls-section {
    padding: 10px 12px 8px;
  }

  .table-responsive-edit {
    max-height: min(72vh, 640px);
    overflow-x: auto;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .staff-table-edit {
    font-size: 11px;
    min-width: max-content;
  }

  .sticky-col-edit.left-col-edit {
    position: static;
    left: auto;
    z-index: auto;
  }

  .staff-table-edit thead th.left-col-edit {
    position: sticky;
    top: 0;
    left: auto;
    z-index: 15;
    background: var(--russ-bg-blue-light);
  }

  .sticky-summary-pack {
    position: static;
    right: auto;
    z-index: auto;
    min-width: 0;
    max-width: none;
    width: auto;
    box-shadow: none;
  }

  .summary-head-cell {
    z-index: 15 !important;
  }

  .summary-inner-head,
  .summary-inner-body {
    grid-template-columns: repeat(var(--summary-cols, 7), minmax(26px, 1fr));
    gap: 1px;
    font-size: 8px;
  }

  .staff-table-edit th,
  .staff-table-edit td {
    height: auto;
    min-height: 36px;
    padding: 2px;
    font-size: 10px;
  }

  .staff-table-edit th {
    z-index: 10;
  }

  .wide-col-edit {
    min-width: 72px !important;
    max-width: 96px;
    width: 88px;
    font-size: 10px;
    padding: 2px 4px;
  }

  .staff-name-edit {
    font-size: 11px;
    padding: 3px;
    line-height: 1.2;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .staff-code-edit {
    font-size: 9px;
  }

  .date-number-edit {
    font-size: 11px;
  }

  .weekday-name-edit {
    font-size: 7px;
  }

  .shift-cell-wrap {
    min-width: 44px;
    max-width: 56px;
  }

  .shift-cell-tile {
    min-height: 40px;
    height: 40px;
    max-height: 40px;
    padding: 2px 4px;
    font-size: 10px;
  }

  .shift-cell-edit {
    width: 22px;
    height: 22px;
    font-size: 10px;
  }

  .shift-time-compact {
    gap: 0;
  }

  .shift-time-dur-hero {
    font-size: 11px;
  }

  .shift-time-start-muted {
    font-size: 8px;
  }

  .day-edit-popover {
    left: 0;
    right: 0;
    top: calc(100% + 6px);
    transform: none;
    max-width: none;
    width: min(100%, 280px);
    margin: 0 auto;
  }
}

@media (max-width: 480px) {
  .table-responsive-edit {
    max-height: min(68vh, 560px);
  }

  .staff-table-edit th,
  .staff-table-edit td {
    min-height: 34px;
    padding: 1px;
    font-size: 9px;
  }

  .wide-col-edit {
    min-width: 64px !important;
    max-width: 84px;
    width: 72px;
  }

  .shift-cell-wrap {
    min-width: 40px;
    max-width: 48px;
  }

  .shift-cell-tile {
    min-height: 36px;
    height: 36px;
    max-height: 36px;
    padding: 1px 3px;
  }

  .summary-inner-head,
  .summary-inner-body {
    grid-template-columns: repeat(var(--summary-cols, 7), minmax(22px, 1fr));
    font-size: 7px;
  }
}

.edit-shifts-embedded {
  width: 100%;
  min-height: 0;
}

.edit-shifts-embedded-inner {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  min-height: 0;
}

.edit-shifts-modal-inner .table-controls-section {
  margin-bottom: 0;
  border-radius: 12px;
}

.edit-shifts-modal-inner .table-container-edit {
  margin-top: 12px;
  border-radius: 12px;
  border-top: 1.5px solid var(--russ-border);
}

.edit-shifts-modal-inner {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}
</style>
