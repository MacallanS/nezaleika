<template>
  <div class="calendar-wrapper">
    <div class="modern-calendar">
      <div class="calendar-header">
        <button type="button" class="nav-btn prev-btn" @click="prevMonth">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <h2 class="calendar-title">
          {{ monthNames[calendarMonth] }} {{ calendarYear }}
        </h2>
        <button type="button" class="nav-btn next-btn" @click="nextMonth">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 18l6-6-6-6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>

      <div class="calendar-weekdays">
        <div class="weekday" v-for="day in dayNamesShort" :key="day">
          {{ day }}
        </div>
      </div>

      <div class="calendar-grid">
        <div
          v-for="n in firstDayOfMonth"
          :key="'empty-' + n"
          class="calendar-day empty-day"
        ></div>

        <div
          v-for="day in daysInMonth"
          :key="day"
          class="calendar-day"
          :class="getDayClasses(day)"
          :title="
            getDayStatusTooltip(getDateKey(day))
          "
          @click="openDayModal(day)"
        >
          <div class="day-number">{{ day }}</div>
          <div
            v-if="getDayPlanInterval(day) || getDayPlanHoursLabel(day) || getActualHoursLabel(day)"
            class="slots-wrapper"
          >
            <div
              v-if="!getActualHoursLabel(day) && (getDayPlanInterval(day) || getDayPlanHoursLabel(day))"
              class="time-slot"
            >
              <span v-if="getDayPlanInterval(day)" class="plan-interval">
                {{ getDayPlanInterval(day) }}
              </span>
              <span v-if="getDayPlanHoursLabel(day)" class="plan-hours">
                {{ getDayPlanHoursLabel(day) }}
              </span>
            </div>
            <div v-if="getActualHoursLabel(day)" class="fact-slot">
              {{ getActualHoursLabel(day) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <ResponsiveModal
      :model-value="showDayModal"
      size="sm"
      max-width="500px"
      class="kpi-day-details-modal"
      :sheet-height-percent="85"
      @update:model-value="onDayModalVisible"
    >
      <template #header>
        <h3 class="kpi-day-modal-heading">
          Детали дня: {{ selectedDayString }}
        </h3>
      </template>

      <div v-if="selectedDayData" class="kpi-day-modal-body">
        <div class="modal-summary">
          <div class="summary-item">
            <span>План</span>
            <div class="summary-content">
              <div class="summary-graph">{{ plannedIntervalForModal || "—" }}</div>
              <div class="summary-hours">{{ planSummaryLabel }}</div>
            </div>
          </div>
          <div class="summary-item">
            <span>Факт</span>
            <div class="summary-content">
              <div class="summary-graph">{{ actualIntervalForModal || "—" }}</div>
              <div class="summary-hours">{{ factSummaryLabel }}</div>
            </div>
          </div>
          <div v-if="selectedDayStatusLabel" class="summary-item">
            <span>Статус</span>
            <span class="status-chip" :class="selectedDayStatusClass">{{
              selectedDayStatusLabel
            }}</span>
          </div>
        </div>

        <div class="kpi-day-modal-sections">
          <div class="modal-section">
            <div class="section-title">Фактическая смена</div>
            <template v-if="selectedDayRealShift">
              <div v-if="realStartTimeLabel" class="info-row">
                <span class="info-label">Начало смены:</span>
                <span class="info-value">{{ realStartTimeLabel }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Статус смены:</span>
                <span class="info-value">{{
                  selectedDayRealShift.is_shift_open === true
                    ? "Не закрыта"
                    : selectedDayRealShift.is_shift_open === false
                    ? "Закрыта"
                    : "-"
                }}</span>
              </div>
              <div v-if="actualIntervalForModal" class="info-row">
                <span class="info-label">Фактическое время:</span>
                <span class="info-value">{{ actualIntervalForModal }}</span>
              </div>
              <div v-if="actualDurationForModal" class="info-row">
                <span class="info-label">Отработано:</span>
                <span class="info-value">{{ actualDurationForModal }}</span>
              </div>
            </template>
            <template v-else>
              <div class="info-row">
                <span class="info-label">Нет данных о фактической смене</span>
                <span class="info-value">—</span>
              </div>
            </template>
          </div>

          <div
            v-if="selectedDayData.checkin || selectedDayData.checkout"
            class="modal-section"
          >
            <div class="section-title">Отметки</div>
            <div v-if="selectedDayData.checkin" class="info-row">
              <span class="info-label">Вход:</span>
              <span class="info-value">{{ selectedDayData.checkin }}</span>
            </div>
            <div v-if="selectedDayData.checkout" class="info-row">
              <span class="info-label">Выход:</span>
              <span class="info-value">{{ selectedDayData.checkout }}</span>
            </div>
          </div>

          <div v-if="shiftReportsLoading" class="modal-section">
            <div class="section-title">Итоги дня</div>
            <div class="info-row">
              <span class="info-label">Загрузка данных...</span>
            </div>
          </div>

          <div
            v-else-if="filteredShiftReports && filteredShiftReports.length > 0"
            class="modal-section"
          >
            <div class="section-title">Итоги дня</div>
            <div
              v-for="(report, index) in filteredShiftReports"
              :key="report.id || index"
              class="report-item"
            >
              <div class="report-header">
                <span class="report-type">{{ report.name || `Отчёт #${Number(index) + 1}` }}</span>
              </div>
              <div v-if="report.fields && report.fields.length > 0" class="report-data">
                <div
                  v-for="field in report.fields"
                  :key="field.id"
                  class="info-row"
                >
                  <span class="info-label">{{ field.name }}:</span>
                  <span class="info-value">{{ field.value !== null && field.value !== undefined ? field.value : 0 }}</span>
                </div>
              </div>
              <div v-else class="info-row">
                <span class="info-label">Нет данных</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <button type="button" class="kpi-day-modal-btn" @click="closeDayModal">
          Закрыть
        </button>
      </template>
    </ResponsiveModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { ResponsiveModal } from "../../shared/ui/legacy/ResponsiveModal";
import type { Report, FetchShiftDataFn, GetCurrentUserIdFn } from "./types";

interface Props {
  calendarData: Record<string, any>;
  planData: any;
  currentYear?: number;
  currentMonth?: number;
  /** Функция загрузки данных смены (передаётся из приложения) */
  fetchShiftData?: FetchShiftDataFn;
  /** Колбэк для получения id текущего пользователя (приложение само вызывает свой API) */
  getCurrentUserId?: GetCurrentUserIdFn;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "month-changed": [year: number, month: number];
}>();

const monthNames = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

const dayNamesShort = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const today = new Date();
const calendarYear = ref(props.currentYear ?? today.getFullYear());
const calendarMonth = ref(props.currentMonth ?? today.getMonth());
const selectedDay = ref<number | null>(null);

// Синхронизация с пропсами
watch(() => props.currentYear, (newYear) => {
  if (newYear !== undefined && newYear !== null) {
    calendarYear.value = newYear;
  }
});

watch(() => props.currentMonth, (newMonth) => {
  if (newMonth !== undefined && newMonth !== null) {
    calendarMonth.value = newMonth;
  }
});
const selectedDayString = ref("");
const showDayModal = ref(false);
const selectedDayData = ref<any>(null);
const shiftReports = ref<Report[] | null>(null);
const shiftReportsLoading = ref(false);
const currentUserId = ref<number | null>(null);

const selectedDateKey = computed(() => {
  if (selectedDay.value === null) return null;
  return getDateKey(selectedDay.value);
});

const selectedDayRealShift = computed(
  () => selectedDayData.value?.shift ?? null
);
const selectedDayPlannedShift = computed(
  () => selectedDayData.value?.plannedShift ?? null
);

const plannedIntervalForModal = computed(() => {
  const planFromData = selectedDayData.value?.plan;
  const planFromPlannedShift = selectedDayPlannedShift.value?.planned_interval;
  const planFromInterval = formatShiftInterval(selectedDayPlannedShift.value);
  
  const hasPlan = !!(planFromData || planFromPlannedShift || planFromInterval);
  
  if (!hasPlan && actualIntervalForModal.value) {
    return "Доп. смена";
  }
  
  if (planFromData) {
    return planFromData;
  }
  if (planFromPlannedShift) {
    return planFromPlannedShift;
  }
  return planFromInterval;
});

const plannedDurationForModal = computed(() => {
  if (selectedDayPlannedShift.value?.sum_human) {
    return (
      formatHumanTimeLabel(selectedDayPlannedShift.value.sum_human) ??
      selectedDayPlannedShift.value.sum_human
    );
  }
  if (typeof selectedDayData.value?.planHours === "number") {
    return `${selectedDayData.value.planHours} ч`;
  }
  if (selectedDateKey.value) {
    const info = getPlanInfoForDateKey(selectedDateKey.value);
    if (info.hasPlan) {
      return formatHoursLabelFromSeconds(info.seconds);
    }
  }
  return null;
});
const actualIntervalForModal = computed(() =>
  formatShiftInterval(selectedDayRealShift.value)
);
const actualDurationForModal = computed(() => {
  if (selectedDayRealShift.value?.sum_human) {
    return (
      formatHumanTimeLabel(selectedDayRealShift.value.sum_human) ??
      selectedDayRealShift.value.sum_human
    );
  }
  if (typeof selectedDayData.value?.actualHours === "number") {
    return `${selectedDayData.value.actualHours} ч`;
  }
  if (
    typeof selectedDayData.value?.hours === "number" &&
    !selectedDayPlannedShift.value
  ) {
    return `${selectedDayData.value.hours} ч`;
  }
  return null;
});

const plannedStartTimeLabel = computed(() =>
  formatDateTimeLabel(selectedDayPlannedShift.value?.scheduled_start_time)
);
const plannedStatusLabel = computed(() =>
  mapPlannedStatus(selectedDayPlannedShift.value?.status)
);
const plannedIsCurrentLabel = computed(() => {
  if (
    selectedDayPlannedShift.value &&
    typeof selectedDayPlannedShift.value.is_planned_shift_going_now === "boolean"
  ) {
    return selectedDayPlannedShift.value.is_planned_shift_going_now
      ? "Да"
      : "Нет";
  }
  return "";
});
const realStartTimeLabel = computed(() =>
  formatDateTimeLabel(
    selectedDayRealShift.value?.start_time ||
      selectedDayRealShift.value?.scheduled_start_time
  )
);

const planSummaryLabel = computed(() => {
  if (!selectedDateKey.value) {
    // Если нет даты, но есть факт - доп. смена
    if (actualIntervalForModal.value) {
      return "—";
    }
    return "—";
  }
  const info = getPlanInfoForDateKey(selectedDateKey.value);
  // Если плана нет, но есть факт - это доп. смена
  if (!info.hasPlan && actualIntervalForModal.value) {
    return "—";
  }
  if (!info.hasPlan) return "—";
  return formatHoursLabelFromSeconds(info.seconds) ?? "—";
});

const factSummaryLabel = computed(() => actualDurationForModal.value ?? "—");

const filteredShiftReports = computed(() => {
  if (!shiftReports.value || shiftReports.value.length === 0) {
    return [];
  }
  // Как в Reporting: 0 — валидное внесённое значение в конце смены, не скрываем.
  return shiftReports.value.filter((report) => hasEnteredReportValues(report));
});

const selectedDayStatusClass = computed(() => {
  const key = selectedDateKey.value;
  if (!key) return "";
  const entry = props.calendarData?.[key];
  const realShift = entry?.shift;
  const plannedShift = entry?.plannedShift;
  return getDayStatusClass(key, realShift, plannedShift) || (hasPlanForDateKey(key) ? "has-plan" : "");
});

const selectedDayStatusLabel = computed(() => {
  const statusClass = selectedDayStatusClass.value;
  switch (statusClass) {
    case "shift-unclosed-today":
      return "Смена открыта";
    case "shift-unclosed":
      return "Смена не закрыта";
    case "shift-sufficient":
      return "Норма выполнена";
    case "shift-insufficient":
      return "Норма не выполнена";
    case "shift-planned-no-fact":
      return "Смена пропущена";
    case "shift-fact-no-plan":
      return "План на будущее";
    case "shift-compensation":
      return "Доп. смена";
    default:
      return selectedDateKey.value && hasPlanForDateKey(selectedDateKey.value)
        ? "План на будущее"
        : "";
  }
});

const daysInMonth = computed(() => {
  return new Date(calendarYear.value, calendarMonth.value + 1, 0).getDate();
});

const firstDayOfMonth = computed(() => {
  let d = new Date(calendarYear.value, calendarMonth.value, 1).getDay();
  d = d === 0 ? 6 : d - 1;
  return d;
});

function isToday(day: number) {
  return (
    today.getFullYear() === calendarYear.value &&
    today.getMonth() === calendarMonth.value &&
    today.getDate() === day
  );
}

function isWeekendDay(day: number) {
  const date = new Date(calendarYear.value, calendarMonth.value, day);
  const weekday = date.getDay();
  return weekday === 0 || weekday === 6;
}

function getDateKey(day: number) {
  return [
    calendarYear.value,
    String(calendarMonth.value + 1).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

function getShiftDataForDay(day: number) {
  const key = getDateKey(day);
  const entry = (props.calendarData || {})[key];
  // Приоритет: real_shift > planned_shift
  if (entry?.shift) return entry.shift;
  if (entry?.plannedShift) return entry.plannedShift;
  const dayKey = String(day).padStart(2, "0");
  return (props.planData?.shifts as any)?.[dayKey] || null;
}

async function openDayModal(day: number) {
  const key = getDateKey(day);
  let data = props.calendarData[key];
  if (!data) {
    data = {
      plan: "09:00—18:00",
      planSeconds:
        planIntervalStringToSeconds("09:00—18:00") ?? timeToSeconds(normPerDay),
    };
  } else if (data.plan && !data.planSeconds) {
    const seconds = planIntervalStringToSeconds(data.plan);
    if (seconds) {
      data.planSeconds = seconds;
    }
  }
  selectedDay.value = day;
  selectedDayData.value = data;
  selectedDayString.value = `${String(day).padStart(2, "0")}.${String(
    calendarMonth.value + 1
  ).padStart(2, "0")}.${calendarYear.value}`;
  showDayModal.value = true;
  
  // Загружаем данные смены, если есть shift_id
  await loadShiftReports(data);
}

async function loadShiftReports(dayData: any) {
  shiftReports.value = null;
  shiftReportsLoading.value = false;
  
  const shift = dayData?.shift;
  if (!shift || !shift.id) {
    return;
  }

  // user_id из смены или из колбэка приложения (API вызывается снаружи)
  let userId = shift.user_id;
  if (userId) {
    currentUserId.value = userId;
  } else if (props.getCurrentUserId) {
    const id = await props.getCurrentUserId();
    if (id == null) return;
    userId = id;
    currentUserId.value = userId;
  } else {
    return;
  }

  const shiftId = shift.id;
  if (!shiftId || !userId || !props.fetchShiftData) {
    return;
  }

  shiftReportsLoading.value = true;
  try {
    const shiftData = await props.fetchShiftData(userId, shiftId);
    if (shiftData && shiftData.reports && Array.isArray(shiftData.reports)) {
      shiftReports.value = shiftData.reports;
    }
  } catch (error) {
    console.error('Error loading shift reports:', error);
    shiftReports.value = [];
  } finally {
    shiftReportsLoading.value = false;
  }
}


function closeDayModal() {
  onDayModalVisible(false);
}

function onDayModalVisible(visible: boolean) {
  showDayModal.value = visible;
  if (!visible) {
    shiftReports.value = null;
    shiftReportsLoading.value = false;
  }
}

/** Поле внесено, если есть значение — включая 0 (как на бэке isShiftReportValueEntered). */
function hasEnteredReportValues(report: Report): boolean {
  if (!report.fields || report.fields.length === 0) {
    return false;
  }
  return report.fields.some((field) => {
    const value = field.value;
    if (value === null || value === undefined) return false;
    if (typeof value === "string" && value.trim() === "") return false;
    return true;
  });
}

function prevMonth(event?: Event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  if (calendarMonth.value === 0) {
    calendarMonth.value = 11;
    calendarYear.value--;
  } else {
    calendarMonth.value--;
  }
  selectedDay.value = null;
  selectedDayData.value = null;
  emit("month-changed", calendarYear.value, calendarMonth.value);
}

function nextMonth(event?: Event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  if (calendarMonth.value === 11) {
    calendarMonth.value = 0;
    calendarYear.value++;
  } else {
    calendarMonth.value++;
  }
  selectedDay.value = null;
  selectedDayData.value = null;
  emit("month-changed", calendarYear.value, calendarMonth.value);
}

function getDayClasses(day: number) {
  const key = getDateKey(day);
  const entry = (props.calendarData || {})[key];
  const realShift = entry?.shift;
  const plannedShift = entry?.plannedShift;
  const hasPlan = hasPlanForDateKey(key);

  const classes = ["day-cell"];

  if (isToday(day)) {
    classes.push("today");
  }

  if (isWeekendDay(day)) {
    classes.push("weekend-day");
  }

  // Определяем статус на основе real_shift и planned_shift
  const statusClass = getDayStatusClass(key, realShift, plannedShift);
  if (statusClass) {
    classes.push(statusClass);
  } else if (hasPlan) {
    classes.push("has-plan");
  } else {
    classes.push("no-shift");
  }

  return classes;
}

// Новая функция для определения статуса дня на основе real_shift и planned_shift
function getDayStatusClass(dateKey: string, realShift: any, plannedShift: any): string {
  const today = new Date().toISOString().split("T")[0];
  const isToday = dateKey === today;
  const dateObj = new Date(dateKey);
  const isPast = dateObj < new Date(today);
  const isFuture = dateObj > new Date(today);

  // 1. Смена открыта (#FCDF49 #A77300) - real_shift.is_shift_open === true И is_today === true
  if (realShift?.is_shift_open === true && realShift?.is_today === true) {
    return "shift-unclosed-today";
  }

  // 2. Смена не закрыта (#F1F1F1 #6E6E6E) - real_shift.is_shift_open === true И is_today === false
  if (realShift?.is_shift_open === true && realShift?.is_today === false) {
    return "shift-unclosed";
  }

  // 3-5. Если смена закрыта (is_shift_open === false)
  if (realShift?.is_shift_open === false) {
    // Если есть план
    if (plannedShift) {
      const actualTime = realShift.sum_human;
      // Если sum_human null или undefined, считаем что норма не выполнена
      if (!actualTime || actualTime === null) {
        return "shift-insufficient";
      }
      const planTime = plannedShift.sum_human || "00:00:00";
      const actualSeconds = timeToSeconds(actualTime);
      const planSeconds = timeToSeconds(planTime);

      // 3. Норма не выполнена (#FFE2E3 #B91C1B)
      if (actualSeconds + SECONDS_TOLERANCE < planSeconds) {
        return "shift-insufficient";
      }
      // 5. Норма выполнена (#B1F8D4 #009D64)
      return "shift-sufficient";
    }
    // 7. Доп. смена (#C0E6FD #047AC6) - есть real_shift, но нет planned_shift
    return "shift-compensation";
  }

  // Если нет real_shift, но есть planned_shift
  if (!realShift && plannedShift) {
    // 4. Смена пропущена (критично) (#FDA5A5 #9A1B1B) - есть план, нет факта, дата в прошлом
    if (isPast) {
      return "shift-planned-no-fact";
    }
    // 6. План на будущее (#E0F2FE #047AC6) - есть план, нет факта, дата в будущем
    if (isFuture || isToday) {
      return "shift-fact-no-plan";
    }
  }

  return "";
}

function getDayPlanInterval(day: number): string | null {
  const key = getDateKey(day);
  return getPlanIntervalForDateKey(key);
}

function getDayPlanHoursLabel(day: number): string | null {
  const key = getDateKey(day);
  return getPlanHoursLabelForDateKey(key);
}

function getActualHoursLabel(day: number): string | null {
  const key = getDateKey(day);
  const entry = (props.calendarData || {})[key];
  if (!entry) return null;

  const numericHours =
    typeof entry.actualHours === "number"
      ? entry.actualHours
      : typeof entry.hours === "number"
        ? entry.hours
        : null;

  if (numericHours !== null) {
    const formatted = formatHoursLabelFromNumber(numericHours);
    if (formatted) {
      return `${formatted}`;
    }
  }

  const shift = entry.shift;
  if (shift?.sum_human) {
    const formatted = formatHumanTimeLabel(shift.sum_human);
    return formatted ? `${formatted}` : `${shift.sum_human}`;
  }

  return null;
}

function getPlanIntervalForDateKey(dateKey: string): string | null {
  const entry = (props.calendarData || {})[dateKey];
  return entry?.plan || entry?.plannedShift?.planned_interval || null;
}

function getPlanHoursLabelForDateKey(dateKey: string): string | null {
  const info = getPlanInfoForDateKey(dateKey);
  if (!info.hasPlan) return null;
  return formatHoursLabelFromSeconds(info.seconds);
}

function getPlanSecondsForDateKey(dateKey: string): number {
  return getPlanInfoForDateKey(dateKey).seconds;
}

function hasPlanForDateKey(dateKey: string): boolean {
  return getPlanInfoForDateKey(dateKey).hasPlan;
}

function getPlanInfoForDateKey(dateKey: string): {
  seconds: number;
  hasPlan: boolean;
} {
  const entry = (props.calendarData || {})[dateKey];
  if (entry) {
    if (typeof entry.planSeconds === "number") {
      return { seconds: entry.planSeconds, hasPlan: true };
    }
    if (typeof entry.planHours === "number") {
      return { seconds: Math.round(entry.planHours * 3600), hasPlan: true };
    }
    if (entry.plan) {
      const planSeconds = planIntervalStringToSeconds(entry.plan);
      if (planSeconds) {
        return { seconds: planSeconds, hasPlan: true };
      }
    }
    if (entry.plannedShift?.sum_human) {
      return {
        seconds: timeToSeconds(entry.plannedShift.sum_human),
        hasPlan: true,
      };
    }
  }

  return { seconds: timeToSeconds(normPerDay), hasPlan: false };
}

function planIntervalStringToSeconds(plan?: string | null): number | null {
  if (!plan) return null;
  const match = plan.match(/(\d{2}):(\d{2})[—-](\d{2}):(\d{2})/);
  if (!match) return null;
  const [, h1, m1, h2, m2] = match.map(Number);
  let hours = h2 - h1 + (m2 - m1) / 60;
  if (hours < 0) {
    hours += 24;
  }
  return Math.round(hours * 3600);
}

function formatHoursLabelFromSeconds(seconds?: number | null): string | null {
  if (seconds == null) return null;
  const totalSeconds = Math.max(0, Math.round(seconds));
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.round((totalSeconds % 3600) / 60);
  const parts: string[] = [];
  if (hrs) {
    parts.push(`${hrs} ч`);
  }
  if (mins) {
    parts.push(`${mins} м`);
  }
  if (!parts.length) {
    parts.push("0 м");
  }
  return parts.join(" ");
}

function formatHoursLabelFromNumber(hours?: number | null): string | null {
  if (typeof hours !== "number" || Number.isNaN(hours)) return null;
  return formatHoursLabelFromSeconds(Math.round(hours * 3600));
}

function formatHumanTimeLabel(value?: string | null): string | null {
  if (!value) return null;
  const seconds = timeToSeconds(value);
  if (!seconds && seconds !== 0) return null;
  return formatHoursLabelFromSeconds(seconds);
}

function timeToSeconds(time: string): number {
  if (!time) return 0;
  const parts = time.split(":").map(Number);
  if (parts.length >= 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 3600 + parts[1] * 60;
  }
  return 0;
}

function formatTimeHM(date: Date) {
  return date
    .toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    .replace(/\./g, ":");
}

function formatShiftInterval(shift: any): string | null {
  if (!shift) return null;
  if (shift.planned_interval) return shift.planned_interval;
  const startDate = parseDateTimeValue(
    shift.scheduled_start_time || shift.start_time
  );
  if (!startDate) return null;
  const durationSeconds = timeToSeconds(
    shift.sum_human || shift.total || normPerDay
  );
  const endDate = new Date(startDate.getTime() + durationSeconds * 1000);
  return `${formatTimeHM(startDate)}—${formatTimeHM(endDate)}`;
}

function formatDateTimeLabel(value?: string | null): string {
  if (!value) return "";
  const parsed = parseDateTimeValue(value);
  if (!parsed) return value || "";
  return parsed.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapPlannedStatus(status?: string | null): string {
  if (!status) return "";
  const normalized = String(status).toLowerCase();
  const dictionary: Record<string, string> = {
    planned: "Запланирована",
    completed: "Выполнена",
    canceled: "Отменена",
    cancelled: "Отменена",
    active: "В работе",
  };
  return dictionary[normalized] || status;
}

// Логика определения статусов смен из reporting
const normPerDay = "08:00:00";
const SECONDS_TOLERANCE = 60;

function getShiftStatusClass(shift: any, date: string): string {
  if (!shift) return "";

  // Проверяем, есть ли план для этой даты
  const hasPlan = hasPlanForDateKey(date);

  if (
    shift.status === "planned" &&
    typeof shift.is_shift_open === "undefined"
  ) {
    return "";
  }

  const today = new Date().toISOString().split("T")[0];
  const isToday = date === today;

  if (shift.is_shift_open === true && isToday) {
    return "shift-unclosed-today";
  }

  if (shift.is_shift_open === true) {
    return "shift-unclosed";
  }

  if (shift.is_shift_open === false) {
    // Если есть факт, но нет плана - это доп. смена
    if (!hasPlan) {
      return "shift-compensation";
    }
    
    const actualTime = shift.sum_human || shift.total || "00:00:00";
    const actualSeconds = timeToSeconds(actualTime);
    const planSeconds = getPlanSecondsForDateKey(date);

    if (actualSeconds + SECONDS_TOLERANCE < planSeconds) {
      return "shift-insufficient";
    }
    return "shift-sufficient";
  }

  // Если есть смена, но нет плана - это доп. смена
  if (!hasPlan) {
    return "shift-compensation";
  }

  return "";
}

function getDayStatusTooltip(dateKey: string): string {
  const entry = (props.calendarData || {})[dateKey];
  const realShift = entry?.shift;
  const plannedShift = entry?.plannedShift;
  const planSeconds = getPlanSecondsForDateKey(dateKey);
  const planLabel = formatHoursLabelFromSeconds(planSeconds) || "—";

  // 1. Смена открыта
  if (realShift?.is_shift_open === true && realShift?.is_today === true) {
    return `Смена открыта. План: ${planLabel}`;
  }

  // 2. Смена не закрыта
  if (realShift?.is_shift_open === true && realShift?.is_today === false) {
    return `Смена не закрыта. План: ${planLabel}`;
  }

  // 3-5. Смена закрыта
  if (realShift?.is_shift_open === false) {
    const actualTime = realShift.sum_human;
    const actualLabel = actualTime ? (formatHumanTimeLabel(actualTime) || actualTime) : "—";
    
    if (plannedShift) {
      if (!actualTime || actualTime === null) {
        return `Норма не выполнена\nФакт: —\nПлан: ${planLabel}`;
      }
      const planTime = plannedShift.sum_human || "00:00:00";
      const actualSeconds = timeToSeconds(actualTime);
      const planSeconds = timeToSeconds(planTime);
      const comparison =
        actualSeconds + SECONDS_TOLERANCE < planSeconds
          ? "Норма не выполнена"
          : "Норма выполнена";
      return `${comparison}\nФакт: ${actualLabel}\nПлан: ${planLabel}`;
    }
    // Доп. смена
    return `Доп. смена\nФакт: ${actualLabel}`;
  }

  // 4. Смена пропущена (критично)
  if (!realShift && plannedShift) {
    const today = new Date().toISOString().split("T")[0];
    const dateObj = new Date(dateKey);
    const isPast = dateObj < new Date(today);
    if (isPast) {
      return `Смена пропущена (критично)\nПлан: ${planLabel}`;
    }
    // 6. План на будущее
    return `План на будущее: ${planLabel}`;
  }

  // Если есть только план
  if (hasPlanForDateKey(dateKey)) {
    return `Запланировано: ${planLabel}`;
  }

  return "Нет данных о смене";
}

// Старая функция для совместимости
function getShiftStatusTooltip(shift: any, date: string): string {
  return getDayStatusTooltip(date);
}

function parseDateTimeValue(value?: string | null): Date | null {
  if (!value) return null;
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const match = value.match(
    /(\d{2})\.(\d{2})\.(\d{4}),?\s*(\d{2}):(\d{2})(?::(\d{2}))?/
  );
  if (match) {
    const [, dd, mm, yyyy, hh, min, ss] = match;
    const date = new Date(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd),
      Number(hh),
      Number(min),
      ss ? Number(ss) : 0
    );
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
}
</script>

<style scoped>
/* Цвета из bibli (StaffResultsModal, BaseModal, ConfirmModal, AddPagesModal) */
.calendar-wrapper {
  --kpi-bg: #fff;
  --kpi-text: #111827;
  --kpi-text-secondary: #1e293b;
  --kpi-text-muted: #374151;
  --kpi-text-muted-2: #6b7280;
  --kpi-border: #e5e7eb;
  --kpi-border-2: #d1d5db;
  --kpi-surface: #f9fafb;
  --kpi-surface-2: #f3f4f6;
  --kpi-surface-3: #f8fafc;
  --kpi-primary: #213e89;
  --kpi-primary-bg: #e0e7ff;
  --kpi-success-bg: var(--russ-success-light);
  --kpi-success-border: var(--russ-success-border);
  --kpi-success-text: var(--russ-success-text);
  --kpi-error-bg: #fee2e2;
  --kpi-error-border: #fecaca;
  --kpi-error-text: #991b1b;
  --kpi-unclosed-bg: #f3f4f6;
  --kpi-unclosed-border: #d1d5db;
  --kpi-unclosed-text: #6b7280;
  --kpi-unclosed-today-bg: #fef3c7;
  --kpi-unclosed-today-border: #f59e0b;
  --kpi-unclosed-today-text: #92400e;
  --kpi-plan-future-bg: #e0e7ff;
  --kpi-plan-future-border: #93c5fd;
  --kpi-compensation-bg: #e0e7ff;
  --kpi-compensation-border: #93c5fd;
  --kpi-weekend-bg: #fee2e2;
  --kpi-weekend-text: #991b1b;
  --kpi-critical-bg: #fecaca;
  --kpi-critical-border: #f87171;
  --kpi-overlay: rgba(0, 0, 0, 0.5);
  --kpi-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  --kpi-muted: #9ca3af;
  margin: 0;
  padding: 0;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 100vw;
  overflow-x: hidden;
}

.modern-calendar {
  background: var(--kpi-bg);
  border-radius: 12px;
  box-shadow: var(--kpi-shadow);
  padding: 12px;
  width: 100%;
  margin: 0px 0 20px 0;
  overflow: hidden;
  box-sizing: border-box;
  max-width: calc(100vw - 32px);
  min-width: 320px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.calendar-title {
  font-size: clamp(
    18px,
    calc(18px + (22 - 18) * ((100vw - 320px) / (1920 - 320))),
    22px
  );
  font-weight: 700;
  color: var(--kpi-text);
  margin: 0;
}

.nav-btn {
  background: var(--kpi-surface-2);
  color: var(--kpi-primary);
  border: none;
  border-radius: 6px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-btn:hover {
  background: var(--kpi-border);
}

.nav-btn svg {
  color: var(--kpi-primary);
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
  width: 100%;
}

.weekday {
  text-align: center;
  font-weight: 600;
  color: var(--kpi-primary);
  font-size: clamp(
    12px,
    calc(12px + (14 - 12) * ((100vw - 320px) / (1920 - 320))),
    14px
  );
  padding: 8px 0;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  min-width: 280px;
  box-sizing: border-box;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.calendar-day {
  background: var(--kpi-surface);
  border-radius: 10px;
  min-height: 25px;
  padding: 4px 3px;
  text-align: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  border: 1px solid var(--kpi-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-width: 100%;
  box-sizing: border-box;
  aspect-ratio: 1;
  justify-content: flex-end;
  min-width: 18px;
  max-width: 100%;
  align-items: flex-start;
}

.calendar-day.empty-day {
  background: transparent;
  border: none;
  cursor: default;
}

.calendar-day.empty-day:hover {
  background: transparent;
  transform: none;
  box-shadow: none;
}

.day-number {
  position: absolute;
  top: 4px;
  right: 4px;
  background: var(--kpi-surface-2);
  color: var(--kpi-text-muted);
  border-radius: 50%;
  width: 22px;
  height: 22px;
  min-width: 22px;
  min-height: 22px;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: clamp(
    9px,
    calc(9px + (11 - 9) * ((100vw - 320px) / (1920 - 320))),
    11px
  );
  z-index: 2;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.slots-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  width: 100%;
  gap: 4px;
  margin-top: 10px;
}

.time-slot {
  font-size: clamp(
    8px,
    calc(8px + (10 - 8) * ((100vw - 320px) / (1920 - 320))),
    10px
  );
  color: var(--kpi-text-muted);
  font-weight: 600;
  line-height: 1.1;
  margin-top: 0;
  text-align: left;
  max-width: 100%;
  word-wrap: break-word;
  padding: 2px 4px;
  border-radius: 4px;
  backdrop-filter: blur(2px);
  display: inline-flex;
  flex-wrap: nowrap;
  gap: 4px;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  background: var(--kpi-surface);
  overflow: hidden;
}

.fact-slot {
  font-size: clamp(
    9px,
    calc(9px + (11 - 9) * ((100vw - 320px) / (1920 - 320))),
    11px
  );
  color: var(--kpi-text);
  font-weight: 600;
  line-height: 1.1;
  margin-top: 0;
  text-align: center;
  max-width: 100%;
  word-wrap: break-word;
  padding: 2px 4px;
  border-radius: 4px;
}

.plan-interval,
.plan-hours {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  flex-shrink: 0;
}

.plan-interval {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  font-size: clamp(
    7px,
    calc(7px + (9 - 7) * ((100vw - 320px) / (1920 - 320))),
    9px
  );
}

.plan-hours {
  color: var(--kpi-text-muted-2);
  font-weight: 500;
}

.plan-interval + .plan-hours::before {
  content: "·";
  color: var(--kpi-muted);
  font-weight: 500;
  margin-right: 2px;
}

.calendar-day.today {
  background: var(--kpi-primary-bg);
  border-color: var(--kpi-primary);
  box-shadow: 0 0 0 2px rgba(33, 62, 137, 0.15);
}

.calendar-day.today .day-number {
  background: var(--kpi-primary);
  color: var(--kpi-bg);
}

.calendar-day.has-shift {
  background: var(--kpi-success-bg);
  border-color: var(--kpi-success-border);
}

.calendar-day.has-shift .day-number {
  background: var(--kpi-success-border);
  color: var(--kpi-bg);
}

.calendar-day.absence {
  background: var(--kpi-error-bg);
  border-color: var(--kpi-error-text);
}

.calendar-day.absence .day-number {
  background: var(--kpi-error-text);
  color: var(--kpi-bg);
}

.calendar-day.closed {
  background: var(--kpi-surface-3);
  border-color: var(--kpi-border-2);
}

.calendar-day.closed .day-number {
  background: var(--kpi-border-2);
  color: var(--kpi-bg);
}

/* Смена не закрыта (прошлое) — bibli neutral */
.calendar-day.shift-unclosed {
  background: var(--kpi-unclosed-bg) !important;
  border: 1px solid var(--kpi-unclosed-border) !important;
}

.calendar-day.shift-unclosed .day-number {
  background: var(--kpi-unclosed-border);
  color: var(--kpi-text-muted);
}

/* Смена открыта сегодня — bibli warning */
.calendar-day.shift-unclosed-today {
  background: var(--kpi-unclosed-today-bg) !important;
  border: 1px solid var(--kpi-unclosed-today-border) !important;
}

.calendar-day.shift-unclosed-today .day-number {
  background: var(--kpi-unclosed-today-border);
  color: var(--kpi-unclosed-today-text);
}

/* Норма не выполнена — bibli error */
.calendar-day.shift-insufficient {
  background: var(--kpi-error-bg) !important;
  border: 1px solid var(--kpi-error-border) !important;
}

.calendar-day.shift-insufficient .day-number {
  background: var(--kpi-error-border);
  color: var(--kpi-text-muted);
}

/* Норма выполнена — bibli success */
.calendar-day.shift-sufficient {
  background: var(--kpi-success-bg) !important;
  border: 1px solid var(--kpi-success-border) !important;
}

.calendar-day.shift-sufficient .day-number {
  background: var(--kpi-success-border);
  color: var(--kpi-text-muted);
}

/* Смена пропущена (критично) — bibli error critical */
.calendar-day.shift-planned-no-fact {
  background: var(--kpi-critical-bg) !important;
  border: 1px solid var(--kpi-critical-border) !important;
}

.calendar-day.shift-planned-no-fact .day-number {
  background: var(--kpi-critical-border);
  color: var(--kpi-text-muted);
}

/* План на будущее — bibli primary light */
.calendar-day.shift-fact-no-plan {
  background: var(--kpi-plan-future-bg) !important;
  border: 1px solid var(--kpi-plan-future-border) !important;
}

.calendar-day.shift-fact-no-plan .day-number {
  background: var(--kpi-plan-future-border);
  color: var(--kpi-text-muted);
}

/* Доп. смена — bibli primary light */
.calendar-day.shift-compensation {
  background: var(--kpi-compensation-bg) !important;
  border: 1px solid var(--kpi-compensation-border) !important;
}

.calendar-day.shift-compensation .day-number {
  background: var(--kpi-compensation-border);
  color: var(--kpi-text-muted);
}

/* План на будущее (старое имя класса) */
.calendar-day.has-plan {
  background: var(--kpi-plan-future-bg);
  border: 1px solid var(--kpi-plan-future-border);
}

.calendar-day.has-plan .day-number {
  background: var(--kpi-plan-future-border);
  color: var(--kpi-text-muted);
}

/* Нет данных */
.calendar-day.no-shift {
  background: transparent;
  border: 1px solid var(--kpi-border);
  color: var(--kpi-muted);
}

.calendar-day.no-shift:hover {
  background: transparent;
  transform: none;
  box-shadow: none;
}

.calendar-day.no-shift .day-number {
  background: var(--kpi-border);
  color: var(--kpi-text-muted-2);
}

.calendar-day.weekend-day::before {
  content: "";
  position: absolute;
  inset: 4px;
  border-radius: inherit;
  border: 1px dashed rgba(248, 113, 113, 0.35);
  pointer-events: none;
}

.calendar-day.weekend-day .day-number {
  background: var(--kpi-weekend-bg);
  color: var(--kpi-weekend-text);
}

/* Контент модалки (Teleport): свои --kpi-*, иначе переменные с .calendar-wrapper не доезжают */
.kpi-day-modal-body {
  --kpi-bg: #fff;
  --kpi-text: #111827;
  --kpi-text-secondary: #1e293b;
  --kpi-text-muted: #374151;
  --kpi-text-muted-2: #6b7280;
  --kpi-border: #e5e7eb;
  --kpi-border-2: #d1d5db;
  --kpi-surface: #f9fafb;
  --kpi-surface-2: #f3f4f6;
  --kpi-surface-3: #f8fafc;
  --kpi-primary: #213e89;
  --kpi-primary-bg: #e0e7ff;
  --kpi-success-bg: var(--russ-success-light);
  --kpi-success-border: var(--russ-success-border);
  --kpi-success-text: var(--russ-success-text);
  --kpi-error-bg: #fee2e2;
  --kpi-error-border: #fecaca;
  --kpi-error-text: #991b1b;
  --kpi-unclosed-bg: #f3f4f6;
  --kpi-unclosed-border: #d1d5db;
  --kpi-unclosed-text: #6b7280;
  --kpi-unclosed-today-bg: #fef3c7;
  --kpi-unclosed-today-border: #f59e0b;
  --kpi-unclosed-today-text: #92400e;
  --kpi-plan-future-bg: #e0e7ff;
  --kpi-plan-future-border: #93c5fd;
  --kpi-compensation-bg: #e0e7ff;
  --kpi-compensation-border: #93c5fd;
  --kpi-weekend-bg: #fee2e2;
  --kpi-weekend-text: #991b1b;
  --kpi-critical-bg: #fecaca;
  --kpi-critical-border: #f87171;
  --kpi-muted: #9ca3af;
}

.kpi-day-modal-heading {
  margin: 0;
  font-size: clamp(16px, calc(16px + (18 - 16) * ((100vw - 320px) / (1920 - 320))), 18px);
  font-weight: 600;
  color: var(--russ-text-primary, #111827);
  line-height: 1.3;
}

.kpi-day-modal-sections {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kpi-day-modal-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  border: 1px solid var(--russ-border, #e5e7eb);
  background: var(--russ-bg-secondary, #f3f4f6);
  color: var(--russ-text-primary, #111827);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.kpi-day-modal-btn:hover {
  background: var(--russ-border, #e5e7eb);
}

.modal-section {
  border: 1px solid var(--kpi-border);
  border-radius: 12px;
  padding: 12px 16px;
  background: var(--kpi-surface);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  font-weight: 600;
  color: var(--kpi-text-secondary);
  font-size: clamp(
    14px,
    calc(14px + (16 - 14) * ((100vw - 320px) / (1920 - 320))),
    16px
  );
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 8px 0;
  gap: 12px;
  word-break: break-word;
}

.info-row .info-label {
  flex-shrink: 0;
  min-width: 120px;
}

.info-row .info-value {
  text-align: right;
  flex: 1;
  word-break: break-word;
}

.info-row--inline {
  gap: 8px;
}

.info-label {
  font-weight: 500;
  color: var(--kpi-text-muted);
}

.info-value {
  font-weight: 600;
  color: var(--kpi-text);
}

.modal-summary {
  display: flex;
  gap: 12px;
  margin: 0 0 16px 0;
  flex-wrap: wrap;
  justify-content: space-between;
}

.summary-item {
  flex: 1 1 120px;
  min-width: 120px;
  background: var(--kpi-surface-3);
  border: 1px solid var(--kpi-border);
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-item span {
  font-size: 13px;
  color: var(--kpi-text-muted-2);
}

.summary-item strong {
  font-size: 18px;
  color: var(--kpi-text-secondary);
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-graph {
  font-size: 14px;
  color: var(--kpi-text-muted);
  font-weight: 500;
}

.summary-hours {
  font-size: 18px;
  color: var(--kpi-text-secondary);
  font-weight: 600;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 13px;
  background: var(--kpi-plan-future-bg);
  color: var(--kpi-primary);
  border: 1px solid var(--kpi-plan-future-border);
}

.status-chip.shift-sufficient {
  background: var(--kpi-success-bg);
  color: var(--kpi-success-text);
  border: 1px solid var(--kpi-success-border);
}

.status-chip.shift-insufficient {
  background: var(--kpi-error-bg);
  color: var(--kpi-error-text);
  border: 1px solid var(--kpi-error-border);
}

.status-chip.shift-unclosed {
  background: var(--kpi-unclosed-bg);
  color: var(--kpi-unclosed-text);
  border: 1px solid var(--kpi-unclosed-border);
}

.status-chip.shift-unclosed-today {
  background: var(--kpi-unclosed-today-bg);
  color: var(--kpi-unclosed-today-text);
  border: 1px solid var(--kpi-unclosed-today-border);
}

.status-chip.shift-planned-no-fact {
  background: var(--kpi-critical-bg);
  color: var(--kpi-error-text);
  border: 1px solid var(--kpi-critical-border);
}

.status-chip.shift-fact-no-plan {
  background: var(--kpi-plan-future-bg);
  color: var(--kpi-primary);
  border: 1px solid var(--kpi-plan-future-border);
}

.status-chip.shift-compensation {
  background: var(--kpi-compensation-bg);
  color: var(--kpi-primary);
  border: 1px solid var(--kpi-compensation-border);
}

.status-chip.has-plan {
  background: var(--kpi-plan-future-bg);
  color: var(--kpi-primary);
  border: 1px solid var(--kpi-plan-future-border);
}

.status-chip.mini {
  font-size: 12px;
  padding: 2px 8px;
}

.report-item {
  border: 1px solid var(--kpi-border);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  background: var(--kpi-bg);
  word-break: break-word;
}

.report-item:last-child {
  margin-bottom: 0;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--kpi-border);
  gap: 8px;
  flex-wrap: wrap;
}

.report-type {
  font-weight: 600;
  color: var(--kpi-text);
  font-size: clamp(13px, calc(13px + (14 - 13) * ((100vw - 320px) / (1920 - 320))), 14px);
}

.report-date {
  font-size: clamp(11px, calc(11px + (12 - 11) * ((100vw - 320px) / (1920 - 320))), 12px);
  color: var(--kpi-text-muted-2);
  white-space: nowrap;
}

.report-data {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.report-data .info-row {
  padding: 6px 0;
}

.report-data .info-label {
  min-width: 100px;
  font-size: clamp(12px, calc(12px + (13 - 12) * ((100vw - 320px) / (1920 - 320))), 13px);
}

.report-data .info-value {
  font-size: clamp(12px, calc(12px + (13 - 12) * ((100vw - 320px) / (1920 - 320))), 13px);
}

/* Responsive styles */
@media (min-width: 1200px) {
  .modern-calendar {
    width: 100%;
    max-width: calc(7 * 110px + 6 * 4px + 40px);
    padding: 16px;
    margin: 0 0 16px 0;
  }

  .calendar-grid {
    gap: 4px;
    max-width: calc(7 * 110px + 6 * 4px);
    margin: 0 auto;
  }

  .calendar-weekdays {
    gap: 4px;
    max-width: calc(7 * 110px + 6 * 4px);
    margin: 0 auto;
    margin-bottom: 8px;
  }

  .calendar-day {
    min-height: 90px;
    padding: 6px 4px;
  }

  .day-number {
    width: 24px;
    height: 24px;
    min-width: 24px;
    min-height: 24px;
    aspect-ratio: 1;
    top: 6px;
    right: 6px;
    font-size: 12px;
    flex-shrink: 0;
  }

  .slots-wrapper {
    margin-top: 12px;
    gap: 6px;
  }

  .time-slot,
  .fact-slot {
    border-radius: 3px;
    padding: 1px 3px;
    font-size: 10px;
  }
}

@media (max-width: 600px) {
  .modal-summary {
    gap: 8px;
    margin: 0 0 12px 0;
  }

  .summary-item {
    flex: 1 1 calc(50% - 4px);
    min-width: calc(50% - 4px);
    padding: 8px 10px;
  }

  .kpi-day-modal-sections {
    gap: 10px;
  }

  .modal-section {
    padding: 10px 12px;
    gap: 6px;
  }

  .section-title {
    font-size: 14px;
    margin-bottom: 4px;
  }

  .info-row {
    padding: 6px 0;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .info-row .info-label {
    min-width: auto;
    font-size: 13px;
  }

  .info-row .info-value {
    text-align: left;
    font-size: 14px;
  }

  .report-item {
    padding: 10px;
    margin-bottom: 10px;
  }

  .report-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .report-date {
    font-size: 11px;
  }

  .modern-calendar {
    padding: 12px 8px;
    max-width: calc(100vw - 16px);
    margin: 0px 8px 30px 8px;
    border-radius: 10px;
    overflow: hidden;
    min-width: 300px;
  }

  .calendar-wrapper {
    max-width: 100%;
    overflow: hidden;
    -webkit-overflow-scrolling: touch;
    max-width: 100vw;
    overflow-x: hidden;
  }

  .calendar-header {
    margin-bottom: 12px;
    flex-wrap: wrap;
    gap: 6px;
    padding-inline: 8px;
  }

  .nav-btn {
    width: 30px;
    height: 30px;
    touch-action: manipulation;
  }

  .calendar-weekdays {
    gap: 3px;
    margin-bottom: 10px;
  }

  .weekday {
    padding: 6px 0;
  }

  .calendar-grid {
    gap: 3px;
    max-width: calc(100vw - 16px);
    overflow-x: hidden;
    min-width: 260px;
    box-sizing: border-box;
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }

  .calendar-day {
    min-height: 45px;
    padding: 3px 2px;
    border-radius: 6px;
    touch-action: manipulation;
    max-width: 100%;
    box-sizing: border-box;
    min-width: 30px;
    aspect-ratio: 1;
  }

  .day-number {
    position: absolute;
    top: 3px;
    right: 3px;
    width: 22px;
    height: 22px;
    min-width: 22px;
    min-height: 22px;
    aspect-ratio: 1;
    flex-shrink: 0;
    font-size: clamp(
      11px,
      calc(6px + (8 - 6) * ((100vw - 320px) / (1920 - 320))),
      8px
    );
  }

  .slots-wrapper {
    margin-top: 4px;
    gap: 3px;
  }

  .time-slot,
  .fact-slot {
    line-height: 1.15;
    padding: 2px 3px;
    border-radius: 3px;
    font-size: clamp(
      7px,
      calc(7px + (9 - 7) * ((100vw - 320px) / (1920 - 320))),
      9px
    );
    max-width: 100%;
    word-wrap: break-word;
  }
}

@media (max-width: 480px) {
  .kpi-day-modal-heading {
    font-size: 16px;
  }

  .modal-summary {
    gap: 6px;
  }

  .summary-item {
    flex: 1 1 100%;
    min-width: 100%;
    padding: 8px;
  }

  .modal-section {
    padding: 8px 10px;
  }

  .section-title {
    font-size: 13px;
  }

  .info-row {
    padding: 5px 0;
  }

  .info-label {
    font-size: 12px;
  }

  .info-value {
    font-size: 13px;
  }

  .report-item {
    padding: 8px;
  }

  .calendar-day {
    justify-content: flex-start;
    align-items: stretch;
    min-height: 48px;
    padding: 4px;
    gap: 4px;
  }

  .day-number {
    position: relative;
    top: auto;
    right: auto;
    margin-left: auto;
    margin-bottom: 2px;
    min-width: 22px;
    min-height: 22px;
    aspect-ratio: 1;
    flex-shrink: 0;
  }

  .slots-wrapper {
    margin-top: 0;
    width: 100%;
    gap: 2px;
  }

  .time-slot,
  .fact-slot {
    font-size: clamp(
      7px,
      calc(7px + (8 - 7) * ((100vw - 320px) / (1920 - 320))),
      8px
    );
    text-align: left;
    padding: 2px;
  }

  .plan-hours {
    display: none;
  }
}

@media (max-width: 360px) {
  .modern-calendar {
    padding: 10px 6px;
    margin: 0px 2px 20px 2px;
    border-radius: 6px;
    max-width: calc(100vw - 4px);
  }

  .calendar-header {
    margin-bottom: 10px;
    flex-wrap: wrap;
    gap: 4px;
    padding-inline: 6px;
  }

  .nav-btn {
    width: 28px;
    height: 28px;
    touch-action: manipulation;
  }

  .calendar-grid {
    gap: 1px;
    min-width: 240px;
    max-width: calc(100vw - 8px);
    overflow-x: hidden;
    box-sizing: border-box;
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }

  .calendar-day {
    padding: 1px 0px 0px 0px;
    min-height: 35px;
    border-radius: 4px;
    max-width: 100%;
    box-sizing: border-box;
    min-width: 25px;
    aspect-ratio: 1;
  }

  .calendar-weekdays {
    gap: 2px;
    margin-bottom: 8px;
  }

  .day-number {
    width: 22px;
    height: 22px;
    min-width: 22px;
    min-height: 22px;
    aspect-ratio: 1;
    flex-shrink: 0;
    font-size: clamp(
      8px,
      calc(8px + (10 - 8) * ((100vw - 320px) / (1920 - 320))),
      10px
    );
  }

  .slots-wrapper {
    gap: 2px;
  }

  .time-slot,
  .fact-slot {
    padding: 1px 2px;
    border-radius: 2px;
    font-size: clamp(
      6px,
      calc(6px + (8 - 6) * ((100vw - 320px) / (1920 - 320))),
      8px
    );
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
}

@media (max-width: 320px) {
  .modern-calendar {
    padding: 8px 4px;
    margin: 0px 1px 15px 1px;
    border-radius: 5px;
    max-width: calc(100vw - 2px);
  }

  .calendar-header {
    margin-bottom: 8px;
    flex-wrap: wrap;
    gap: 3px;
    padding-inline: 4px;
  }

  .nav-btn {
    width: 26px;
    height: 26px;
    touch-action: manipulation;
  }

  .calendar-grid {
    gap: 1px;
    min-width: 220px;
    max-width: calc(100vw - 4px);
    overflow-x: hidden;
    box-sizing: border-box;
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }

  .calendar-day {
    padding: 1px 0px 0px 0px;
    min-height: 30px;
    border-radius: 3px;
    max-width: 100%;
    box-sizing: border-box;
    min-width: 22px;
    aspect-ratio: 1;
  }

  .calendar-weekdays {
    gap: 1px;
    margin-bottom: 6px;
  }

  .day-number {
    width: 22px;
    height: 22px;
    min-width: 22px;
    min-height: 22px;
    aspect-ratio: 1;
    flex-shrink: 0;
    font-size: clamp(
      11px,
      calc(6px + (8 - 6) * ((100vw - 320px) / (1920 - 320))),
      8px
    );
  }

  .slots-wrapper {
    gap: 1px;
  }

  .time-slot,
  .fact-slot {
    padding: 0 2px;
    border-radius: 2px;
  }
}
</style>
