<template>
  <div class="nz-page nz-page--wide today">
    <Teleport v-if="headerActionsActive" :to="`#${headerActionsId}`">
      <div class="nz-ring" :aria-label="`Полито ${doneToday} из ${totalToday}`">
        <svg viewBox="0 0 44 44" aria-hidden="true">
          <circle cx="22" cy="22" r="18" class="nz-ring__track" />
          <circle
            cx="22"
            cy="22"
            r="18"
            class="nz-ring__value"
            :stroke-dasharray="RING"
            :stroke-dashoffset="RING * (1 - progress)"
          />
        </svg>
        <span class="nz-ring__text">{{ doneToday }}/{{ totalToday }}</span>
      </div>
    </Teleport>

    <div v-if="!plants.calendar && loading" class="today__skeleton">
      <div v-for="i in 5" :key="i" class="today__skeleton-row" />
    </div>

    <div v-else-if="loaded && !plantCount" class="nz-card nz-card--pad today__empty">
      <p class="today__empty-title">Пока нет растений</p>
      <p class="nz-hint">Добавьте цветок — здесь появится, в какой день его поливать</p>
      <AuthRRButton class="today__cta" @click="navigateTo('/plants/add')">Добавить растение</AuthRRButton>
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
import { AuthRRButton } from 'bibli/shared/ui/rr'
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

const { headerActionsId, headerActionsActive } = usePageChrome(() => ({
  title: 'График',
  description: subtitle.value,
}))

function onSnooze(id: number) {
  snoozeUntilTomorrow(id)
  snoozeTick.value++
}

function onCheck(id: number, iso: string, past: boolean) {
  if (iso > todayIso.value) return
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
  padding-bottom: 24px;
}
.today__skeleton {
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  text-align: center;
  padding: 28px 20px;
}
.today__empty-title {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 700;
}
.today__cta {
  margin-top: 12px;
}
.today :deep(.day) {
  margin-inline: 0;
}
.today :deep(.day__head) {
  background: var(--rr-backgrounds-quaternary, #f2f3f7);
}
</style>
