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
      <h2 class="cal__day-title">{{ dayTitle }}</h2>
      <button v-if="selected !== todayIso" type="button" class="cal__today" @click="goToday">К сегодня</button>
    </div>

    <div v-if="loading && !plants.calendar" class="cal__placeholder">Загружаем…</div>

    <template v-else>
      <p v-if="isEmptyDay" class="cal__placeholder">
        {{ isFuture ? 'На этот день поливов не запланировано' : 'В этот день ничего не поливали' }}
      </p>

      <TaskSection v-if="overdue.length" :title="isToday ? 'Просрочено' : 'Пропущено'" :count="overdue.length" tone="overdue">
        <TaskRow
          v-for="id in overdue"
          :key="`o-${id}`"
          :plant="plant(id)"
          tone="overdue"
          :due-label="isToday ? 'нужно полить' : 'было запланировано'"
          :busy="plants.pending[id]"
          @check="waterOn(id)"
          @open="open(id)"
        />
      </TaskSection>

      <TaskSection v-if="planned.length" :title="isToday ? 'Полить сегодня' : 'По плану'" :count="planned.length">
        <TaskRow
          v-for="id in planned"
          :key="`p-${id}`"
          :plant="plant(id)"
          :tone="isToday ? 'today' : 'normal'"
          :checkable="isToday"
          :busy="plants.pending[id]"
          @check="waterOn(id)"
          @open="open(id)"
        />
      </TaskSection>

      <TaskSection v-if="done.length" title="Полито" :count="done.length" tone="done">
        <TaskRow
          v-for="d in done"
          :key="`d-${d.watering_id}`"
          :plant="plant(d.plant_id)"
          done
          :done-by="d.watered_by_name"
          :due-label="`${formatTime(d.watered_at)}${d.watered_by_name ? ` · ${d.watered_by_name}` : ''}`"
          @uncheck="unwater(d.watering_id)"
          @open="open(d.plant_id)"
        />
      </TaskSection>

      <TaskSection
        v-if="isPast && others.length"
        title="Отметить полив за этот день"
        :count="others.length"
        :default-open="false"
      >
        <TaskRow
          v-for="id in others"
          :key="`r-${id}`"
          :plant="plant(id)"
          :busy="plants.pending[id]"
          @check="waterOn(id)"
          @open="open(id)"
        />
      </TaskSection>
    </template>
  </div>
</template>

<script setup lang="ts">
import MonthGrid from '~/components/planner/MonthGrid.vue'
import TaskRow from '~/components/planner/TaskRow.vue'
import TaskSection from '~/components/planner/TaskSection.vue'
import WeekStrip from '~/components/planner/WeekStrip.vue'
import type { PlantInfo } from '~/stores/plants'
import {
  addDays,
  formatDayMonth,
  formatMonthYear,
  formatTime,
  formatWeekday,
  isoDate,
  parseIsoDate,
  startOfWeek,
} from '~/utils/dates'

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

const isToday = computed(() => selected.value === todayIso.value)
const isPast = computed(() => selected.value < todayIso.value)
const isFuture = computed(() => selected.value > todayIso.value)

const dayTitle = computed(() => {
  if (isToday.value) return `Сегодня, ${formatDayMonth(selected.value)}`
  return `${formatWeekday(selected.value)}, ${formatDayMonth(selected.value)}`
})

const day = computed(() => days.value[selected.value])
const done = computed(() => day.value?.done ?? [])
const doneIds = computed(() => new Set(done.value.map((d) => d.plant_id)))
const overdue = computed(() => [...new Set(day.value?.overdue ?? [])].filter((id) => !doneIds.value.has(id)))
const planned = computed(() => (isPast.value ? [] : (day.value?.planned ?? []).filter((id) => !doneIds.value.has(id))))
const others = computed(() => {
  const shown = new Set([...doneIds.value, ...overdue.value])
  return Object.keys(plants.calendar?.plants ?? {})
    .map(Number)
    .filter((id) => !shown.has(id))
})
const isEmptyDay = computed(() => !done.value.length && !overdue.value.length && !planned.value.length)

const fallbackPlant: PlantInfo = {
  id: 0,
  name: '…',
  species_name: '',
  room: '',
  photo_url: null,
  interval_days: 0,
  last_watered_at: null,
  last_watered_by: '',
}

function plant(id: number): PlantInfo {
  return plants.calendar?.plants[String(id)] ?? { ...fallbackPlant, id }
}

function select(iso: string) {
  selected.value = iso
  const d = parseIsoDate(iso)
  if (mode.value === 'month' && d.getMonth() !== month.value.getMonth()) {
    month.value = new Date(d.getFullYear(), d.getMonth(), 1)
  }
  weekStart.value = startOfWeek(d)
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

function waterOn(id: number) {
  if (isPast.value) {
    void water(id, new Date(`${selected.value}T12:00:00`).toISOString())
  } else {
    void water(id)
  }
}

function open(id: number) {
  void navigateTo(`/plants/${id}`)
}
</script>

<style scoped>
.cal {
  min-height: 100%;
  padding-bottom: 24px;
  background: #f4f6f5;
}
.cal__head {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: calc(env(safe-area-inset-top, 0px) + 14px) 12px 8px;
}
.cal__title {
  margin: 0 2px;
  white-space: nowrap;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #1c2326;
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
  margin: 0 12px;
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
  margin: 18px 16px 10px 20px;
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
