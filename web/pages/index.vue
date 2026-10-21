<template>
  <div class="nz-page today">
    <header class="today__head">
      <div class="today__titles">
        <h1>График</h1>
        <p>{{ subtitle }}</p>
      </div>
      <div class="ring" :aria-label="`Полито ${doneToday} из ${totalToday}`">
        <svg viewBox="0 0 44 44" aria-hidden="true">
          <circle cx="22" cy="22" r="18" class="ring__track" />
          <circle
            cx="22"
            cy="22"
            r="18"
            class="ring__value"
            :stroke-dasharray="RING"
            :stroke-dashoffset="RING * (1 - progress)"
          />
        </svg>
        <span class="ring__text">{{ doneToday }}/{{ totalToday }}</span>
      </div>
    </header>

    <div v-if="!plants.calendar && loading" class="today__skeleton">
      <div v-for="i in 5" :key="i" class="today__skeleton-row" />
    </div>

    <div v-else-if="loaded && !plantCount" class="today__empty">
      <div class="today__empty-art" aria-hidden="true">🪴</div>
      <p class="today__empty-title">Пока нет растений</p>
      <p class="today__empty-sub">Добавьте цветок — здесь появится, в какой день его поливать</p>
      <NuxtLink to="/plants/add" class="today__cta">Добавить растение</NuxtLink>
    </div>

    <ScheduleAgenda
      v-else-if="plants.calendar"
      :days="plants.calendar.days"
      :plants="plants.calendar.plants"
      :from="range.from"
      :to="range.to"
      :today="todayIso"
      :snoozed="snoozedIds"
      overdue-banner
      :pending="plants.pending"
      @check="onCheck"
      @uncheck="unwater"
      @snooze="onSnooze"
      @open="open"
    />
  </div>
</template>

<script setup lang="ts">
import ScheduleAgenda from '~/components/planner/ScheduleAgenda.vue'
import { buildBoard } from '~/utils/scheduleBoard'
import { addDays, formatDayMonth, formatWeekday, isoDate, parseIsoDate } from '~/utils/dates'

const RING = 2 * Math.PI * 18

const plants = usePlantsStore()
const { water, unwater } = useWateringActions()
const { isSnoozed, snoozeUntilTomorrow } = useWateringSnooze()
const loading = ref(true)
const loaded = ref(false)
const snoozeTick = ref(0)

const todayIso = computed(() => plants.calendar?.today ?? isoDate(new Date()))
const range = computed(() => ({
  from: todayIso.value,
  to: isoDate(addDays(parseIsoDate(todayIso.value), 41)),
}))

const plantCount = computed(() => Object.keys(plants.calendar?.plants ?? {}).length)

const snoozedIds = computed(() => {
  void snoozeTick.value
  const ids = new Set<number>()
  for (const day of Object.values(plants.calendar?.days ?? {})) {
    for (const id of day.overdue ?? []) if (isSnoozed(id)) ids.add(id)
    for (const id of day.planned ?? []) if (isSnoozed(id)) ids.add(id)
  }
  return [...ids]
})

const board = computed(() => {
  const cal = plants.calendar
  if (!cal) return null
  return buildBoard({
    days: cal.days,
    from: range.value.from,
    to: range.value.to,
    today: todayIso.value,
    snoozed: snoozedIds.value,
    overdueBanner: true,
  })
})

const todayGroup = computed(() => board.value?.groups.find((g) => g.iso === todayIso.value))
const doneToday = computed(() => todayGroup.value?.rows.filter((r) => r.done).length ?? 0)
const todoToday = computed(() => {
  const openToday = todayGroup.value?.rows.filter((r) => !r.done).length ?? 0
  return openToday + (board.value?.overdue.length ?? 0)
})
const totalToday = computed(() => doneToday.value + todoToday.value)
const progress = computed(() => (totalToday.value ? doneToday.value / totalToday.value : 1))

const ahead = computed(() => {
  if (!board.value) return 0
  return board.value.overdue.length + board.value.groups.reduce((n, g) => n + g.rows.filter((r) => !r.done).length, 0)
})

const subtitle = computed(() => {
  const date = `${formatDayMonth(todayIso.value)}, ${formatWeekday(todayIso.value).toLowerCase()}`
  if (!plantCount.value) return date
  if (!ahead.value) return `${date} · всё полито`
  return `${date} · впереди ${ahead.value}`
})

function onSnooze(id: number) {
  snoozeUntilTomorrow(id)
  snoozeTick.value++
}

function onCheck(id: number, iso: string, past: boolean) {
  if (past) void water(id, new Date(`${iso}T12:00:00`).toISOString())
  else void water(id)
}

function open(id: number) {
  void navigateTo(`/plants/${id}`)
}

async function load() {
  try {
    await plants.fetchCalendar(range.value.from, range.value.to)
  } finally {
    loading.value = false
    loaded.value = true
  }
}

function onVisible() {
  if (document.visibilityState === 'visible') void load()
}

onMounted(() => {
  void load()
  document.addEventListener('visibilitychange', onVisible)
})
onBeforeUnmount(() => document.removeEventListener('visibilitychange', onVisible))
</script>

<style scoped>
.today {
  min-height: 100%;
  padding-bottom: 24px;
  background: #f4f6f5;
}
.today__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: calc(env(safe-area-inset-top, 0px) + 18px) 20px 8px;
}
.today__titles h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #1c2326;
}
.today__titles p {
  margin: 2px 0 0;
  font-size: 14px;
  color: #7b868c;
}
.ring {
  position: relative;
  width: 52px;
  height: 52px;
  flex: 0 0 auto;
}
.ring svg {
  transform: rotate(-90deg);
}
.ring__track {
  fill: none;
  stroke: #e3ebe4;
  stroke-width: 4;
}
.ring__value {
  fill: none;
  stroke: #2e7d32;
  stroke-width: 4;
  stroke-linecap: round;
}
.ring__text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  color: #1c2326;
}
.today__skeleton {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 16px;
}
.today__skeleton-row {
  height: 64px;
  border-radius: 14px;
  background: linear-gradient(90deg, #e7eeea, #f4f7f5, #e7eeea);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
}
@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}
.today__empty {
  margin: 28px 20px;
  padding: 28px 20px;
  border-radius: 18px;
  background: #fff;
  text-align: center;
}
.today__empty-art {
  font-size: 40px;
}
.today__empty-title {
  margin: 8px 0 4px;
  font-size: 18px;
  font-weight: 800;
  color: #1c2326;
}
.today__empty-sub {
  margin: 0;
  color: #7b868c;
  font-size: 14px;
}
.today__cta {
  display: inline-block;
  margin-top: 16px;
  padding: 12px 18px;
  border-radius: 999px;
  background: #2e7d32;
  color: #fff;
  font-weight: 700;
  text-decoration: none;
}
</style>
