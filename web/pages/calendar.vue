<template>
  <div class="nz-page cal">
    <header class="cal__head">
      <button type="button" class="cal__nav" aria-label="Назад" @click="shift(-1)">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3L5 8l5 5" /></svg>
      </button>
      <h1 class="cal__title">{{ title }}</h1>
      <button type="button" class="cal__nav" aria-label="Вперёд" @click="shift(1)">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3l5 5-5 5" /></svg>
      </button>
      <div class="cal__tools">
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
      </div>
    </header>

    <div class="cal__board">
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

    <div class="cal__day-head">
      <h2 class="cal__day-title">{{ mode === 'week' ? 'Эта неделя' : 'Поливы месяца' }}</h2>
      <button v-if="selected !== todayIso" type="button" class="cal__today" @click="goToday">К сегодня</button>
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
  min-height: 100%;
  padding-bottom: 24px;
}
.cal__head {
  position: sticky;
  top: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 40px;
  padding: calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px;
  background: #f2f3f7;
}
.cal__title {
  margin: 0 2px;
  white-space: nowrap;
  font-size: 24px;
  font-weight: 600;
  line-height: 32px;
  letter-spacing: -0.02em;
  color: #101012;
}
.cal__nav {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.cal__nav svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: #1c2326;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.cal__tools {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}
.cal__today {
  border: none;
  background: #e8f5e9;
  color: #2e7d32;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  padding: 6px 10px;
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
.cal__board {
  margin: 0 16px;
  padding: 10px 0 8px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
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
.cal__dot--done {
  background: #43a047;
}
.cal__dot--planned {
  background: #42a5f5;
}
.cal__dot--overdue {
  background: #e53935;
}
.cal__day-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 16px 16px 8px;
  min-height: 30px;
}
.cal__day-title {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #1c2326;
}
.cal__placeholder {
  margin: 0 20px 12px;
  font-size: 14px;
  color: #7b868c;
}
</style>
