<template>
  <div class="nz-page nz-page--wide cal">
    <Teleport v-if="headerActionsActive" :to="`#${headerActionsId}`">
      <div class="cal__mode" role="tablist" aria-label="Вид календаря">
        <button
          type="button"
          role="tab"
          :aria-selected="mode === 'month'"
          :class="{ 'is-active': mode === 'month' }"
          @click="mode = 'month'"
        >
          Месяц
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="mode === 'week'"
          :class="{ 'is-active': mode === 'week' }"
          @click="mode = 'week'"
        >
          Неделя
        </button>
      </div>
    </Teleport>

    <div class="cal__toolbar">
      <button type="button" class="cal__nav" aria-label="Назад" @click="shift(-1)">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3L5 8l5 5" /></svg>
      </button>
      <button v-if="selected !== todayIso" type="button" class="cal__today" @click="goToday">К сегодня</button>
      <button type="button" class="cal__nav" aria-label="Вперёд" @click="shift(1)">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3l5 5-5 5" /></svg>
      </button>
    </div>

    <div class="cal__layout">
      <div class="cal__board nz-card">
        <MonthGrid
          v-if="mode === 'month'"
          :month="month"
          :selected="selected"
          :today="todayIso"
          :days="days"
          :plants="plants.calendar?.plants"
          @select="select"
          @shift="shift"
        />
        <WeekStrip
          v-else
          :week-start="weekStart"
          :selected="selected"
          :today="todayIso"
          :days="days"
          @select="select"
          @shift="shift"
        />
        <div class="cal__legend" aria-hidden="true">
          <span><i class="cal__dot cal__dot--done" />полито</span>
          <span><i class="cal__dot cal__dot--planned" />по плану</span>
          <span><i class="cal__dot cal__dot--overdue" />просрочено</span>
        </div>
      </div>

      <div class="cal__agenda">
        <div class="cal__day-head">
          <h2 class="cal__day-title">{{ mode === 'week' ? 'Эта неделя' : 'Поливы месяца' }}</h2>
        </div>

        <div v-if="loading && !plants.calendar" class="cal__placeholder">Загружаем…</div>
        <ScheduleAgenda
          v-else-if="plants.calendar"
          :days="days"
          :plants="plants.calendar.plants"
          :from="agendaFrom"
          :to="agendaTo"
          :today="todayIso"
          :highlight="selected"
          :pending="plants.pending"
          @check="onCheck"
          @uncheck="unwater"
          @open="open"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MonthGrid from '~/components/planner/MonthGrid.vue'
import ScheduleAgenda from '~/components/planner/ScheduleAgenda.vue'
import WeekStrip from '~/components/planner/WeekStrip.vue'
import { addDays, formatMonthYear, isoDate, parseIsoDate, startOfWeek } from '~/utils/dates'

const plants = usePlantsStore()
const { water, unwater } = useWateringActions()

const now = new Date()
const todayIso = computed(() => plants.calendar?.today ?? isoDate(now))
const mode = ref<'month' | 'week'>('month')
const selected = ref(isoDate(now))
const month = ref(new Date(now.getFullYear(), now.getMonth(), 1))
const weekStart = ref(startOfWeek(now))
const loading = ref(true)

const range = computed(() => {
  if (mode.value === 'week') {
    return { from: isoDate(weekStart.value), to: isoDate(addDays(weekStart.value, 6)) }
  }
  const start = startOfWeek(month.value)
  return { from: isoDate(start), to: isoDate(addDays(start, 41)) }
})

const days = computed(() => plants.calendar?.days ?? {})

const title = computed(() => {
  const base = mode.value === 'week' ? addDays(weekStart.value, 3) : month.value
  return formatMonthYear(base)
})

const { headerActionsId, headerActionsActive } = usePageChrome(() => ({
  title: title.value,
  description: 'Календарь поливов',
}))

const agendaFrom = computed(() => (mode.value === 'week' ? range.value.from : isoDate(month.value)))
const agendaTo = computed(() => {
  if (mode.value === 'week') return range.value.to
  const m = month.value
  return isoDate(new Date(m.getFullYear(), m.getMonth() + 1, 0))
})

function select(iso: string) {
  selected.value = iso
  const d = parseIsoDate(iso)
  if (mode.value === 'month' && d.getMonth() !== month.value.getMonth()) {
    month.value = new Date(d.getFullYear(), d.getMonth(), 1)
  }
  weekStart.value = startOfWeek(d)
  void nextTick(() => {
    document.getElementById(`day-${iso}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function shift(delta: number) {
  if (mode.value === 'week') {
    weekStart.value = addDays(weekStart.value, 7 * delta)
    selected.value = isoDate(addDays(parseIsoDate(selected.value), 7 * delta))
    return
  }
  month.value = new Date(month.value.getFullYear(), month.value.getMonth() + delta, 1)
}

function goToday() {
  select(todayIso.value)
  const d = parseIsoDate(todayIso.value)
  month.value = new Date(d.getFullYear(), d.getMonth(), 1)
}

watch(mode, (m) => {
  const d = parseIsoDate(selected.value)
  if (m === 'week') weekStart.value = startOfWeek(d)
  else month.value = new Date(d.getFullYear(), d.getMonth(), 1)
})

async function load() {
  try {
    await plants.fetchCalendar(range.value.from, range.value.to)
  } finally {
    loading.value = false
  }
}

watch(range, load)
onMounted(load)

function onCheck(id: number, iso: string, past: boolean) {
  if (past) void water(id, new Date(`${iso}T12:00:00`).toISOString())
  else void water(id)
}

function open(id: number) {
  void navigateTo(`/plants/${id}`)
}
</script>

<style scoped>
.cal {
  padding-bottom: 24px;
}
.cal__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}
.cal__nav {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 999px;
  background: var(--rr-backgrounds-primary, #fff);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.cal__nav svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: #101012;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.cal__today {
  border: none;
  background: #e8f5e9;
  color: #2e7d32;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  padding: 8px 12px;
  border-radius: 999px;
  cursor: pointer;
}
.cal__mode {
  display: flex;
  padding: 2px;
  border-radius: 10px;
  background: #e5e9e7;
}
.cal__mode button {
  border: none;
  background: none;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 8px;
  color: #5f6b70;
  cursor: pointer;
}
.cal__mode button.is-active {
  background: #fff;
  color: #1c2326;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}
.cal__layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.cal__board {
  padding: 10px 0 8px;
}
.cal__agenda {
  min-width: 0;
}
.cal__legend {
  display: flex;
  justify-content: center;
  gap: 14px;
  padding: 8px 12px 0;
  font-size: 11.5px;
  color: #7b868c;
}
.cal__legend span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.cal__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.cal__dot--done { background: #43a047; }
.cal__dot--planned { background: #42a5f5; }
.cal__dot--overdue { background: #e53935; }
.cal__day-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 0 0 8px;
  min-height: 30px;
}
.cal__day-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #101012;
}
.cal__placeholder {
  margin: 0 0 12px;
  font-size: 14px;
  color: #7b868c;
}
.cal__agenda :deep(.day) {
  margin-inline: 0;
}
.cal__agenda :deep(.day__head) {
  background: var(--rr-backgrounds-quaternary, #f2f3f7);
}

@media (min-width: 1025px) {
  .cal__layout {
    display: grid;
    grid-template-columns: minmax(420px, 1.1fr) minmax(360px, 0.9fr);
    align-items: start;
    gap: 20px;
  }
  .cal__board {
    position: sticky;
    top: 8px;
    padding: 16px 8px 12px;
  }
}
</style>
