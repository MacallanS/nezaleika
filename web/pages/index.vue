<template>
  <div class="nz-page today">
    <header class="today__head">
      <div class="today__titles">
        <h1>Сегодня</h1>
        <p>{{ todayLabel }}</p>
      </div>
      <div class="ring" :aria-label="`Полито ${doneCount} из ${totalToday}`">
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
        <span class="ring__text">{{ doneCount }}/{{ totalToday }}</span>
      </div>
    </header>

    <div v-if="!agenda && loading" class="today__skeleton">
      <div v-for="i in 4" :key="i" class="today__skeleton-row" />
    </div>

    <div v-else-if="agenda && !plantCount" class="today__empty">
      <div class="today__empty-art" aria-hidden="true">🪴</div>
      <p class="today__empty-title">Пока нет растений</p>
      <p class="today__empty-sub">Добавьте первый цветок — и здесь появится график полива</p>
      <NuxtLink to="/plants/add" class="today__cta">Добавить растение</NuxtLink>
    </div>

    <template v-else-if="agenda">
      <div v-if="!todo.length" class="today__allset">
        <span class="today__allset-icon" aria-hidden="true">✓</span>
        <div>
          <strong>Всё полито</strong>
          <p>{{ nextHint }}</p>
        </div>
      </div>

      <TaskSection v-if="overdue.length" title="Просрочено" :count="overdue.length" tone="overdue">
        <TaskRow
          v-for="item in overdue"
          :key="item.plant_id"
          :plant="plant(item.plant_id)"
          tone="overdue"
          :due-label="`просрочено на ${pluralDays(-item.days_until)}`"
          :busy="plants.pending[item.plant_id]"
          @check="water(item.plant_id)"
          @snooze="snooze(item.plant_id)"
          @open="open(item.plant_id)"
        />
      </TaskSection>

      <TaskSection v-if="dueToday.length" title="Сегодня" :count="dueToday.length">
        <TaskRow
          v-for="item in dueToday"
          :key="item.plant_id"
          :plant="plant(item.plant_id)"
          tone="today"
          :busy="plants.pending[item.plant_id]"
          @check="water(item.plant_id)"
          @snooze="snooze(item.plant_id)"
          @open="open(item.plant_id)"
        />
      </TaskSection>

      <TaskSection v-if="tomorrow.length" title="Завтра" :count="tomorrow.length">
        <TaskRow
          v-for="item in tomorrow"
          :key="item.plant_id"
          :plant="plant(item.plant_id)"
          :due-label="item.snoozed ? 'отложено' : ''"
          :busy="plants.pending[item.plant_id]"
          @check="water(item.plant_id)"
          @open="open(item.plant_id)"
        />
      </TaskSection>

      <TaskSection v-if="week.length" title="Следующие 7 дней" :count="week.length">
        <TaskRow
          v-for="item in week"
          :key="item.plant_id"
          :plant="plant(item.plant_id)"
          :due-label="relativeDayLabel(item.due, agenda.today)"
          :busy="plants.pending[item.plant_id]"
          @check="water(item.plant_id)"
          @open="open(item.plant_id)"
        />
      </TaskSection>

      <TaskSection v-if="later.length" title="Позже" :count="later.length" :default-open="false">
        <TaskRow
          v-for="item in later"
          :key="item.plant_id"
          :plant="plant(item.plant_id)"
          :due-label="formatDayMonth(item.due)"
          :busy="plants.pending[item.plant_id]"
          @check="water(item.plant_id)"
          @open="open(item.plant_id)"
        />
      </TaskSection>

      <TaskSection v-if="agenda.done_today.length" title="Выполнено сегодня" :count="agenda.done_today.length" tone="done">
        <TaskRow
          v-for="d in agenda.done_today"
          :key="`done-${d.watering_id}-${d.plant_id}`"
          :plant="plant(d.plant_id)"
          done
          :done-by="d.watered_by_name"
          :due-label="`${formatTime(d.watered_at)}${d.watered_by_name ? ` · ${d.watered_by_name}` : ''}`"
          @uncheck="unwater(d.watering_id)"
          @open="open(d.plant_id)"
        />
      </TaskSection>
    </template>
  </div>
</template>

<script setup lang="ts">
import TaskRow from '~/components/planner/TaskRow.vue'
import TaskSection from '~/components/planner/TaskSection.vue'
import type { AgendaItem, PlantInfo } from '~/stores/plants'
import {
  formatDayMonth,
  formatTime,
  formatWeekday,
  isoDate,
  pluralDays,
  relativeDayLabel,
} from '~/utils/dates'

const RING = 2 * Math.PI * 18

const plants = usePlantsStore()
const { water, unwater } = useWateringActions()
const { isSnoozed, snoozeUntilTomorrow } = useWateringSnooze()
const loading = ref(true)
const snoozeTick = ref(0)

const agenda = computed(() => plants.agenda)
const plantCount = computed(() => Object.keys(agenda.value?.plants ?? {}).length)

const todayIso = computed(() => agenda.value?.today ?? isoDate(new Date()))
const todayLabel = computed(() => `${formatDayMonth(todayIso.value)}, ${formatWeekday(todayIso.value).toLowerCase()}`)

function notSnoozed(items: AgendaItem[]) {
  void snoozeTick.value
  return items.filter((i) => !isSnoozed(i.plant_id))
}
function snoozedOnly(items: AgendaItem[]) {
  void snoozeTick.value
  return items.filter((i) => isSnoozed(i.plant_id))
}

const overdue = computed(() => notSnoozed(agenda.value?.sections.overdue ?? []))
const dueToday = computed(() => notSnoozed(agenda.value?.sections.today ?? []))
const tomorrow = computed(() => {
  const s = agenda.value?.sections
  if (!s) return []
  const moved = snoozedOnly([...s.overdue, ...s.today]).map((i) => ({ ...i, snoozed: true }))
  return [...moved, ...s.tomorrow.map((i) => ({ ...i, snoozed: false }))]
})
const week = computed(() => agenda.value?.sections.week ?? [])
const later = computed(() => agenda.value?.sections.later ?? [])

const todo = computed(() => [...overdue.value, ...dueToday.value])
const doneCount = computed(() => agenda.value?.done_today.length ?? 0)
const totalToday = computed(() => doneCount.value + todo.value.length)
const progress = computed(() => (totalToday.value ? doneCount.value / totalToday.value : 1))

const nextHint = computed(() => {
  const next = tomorrow.value[0] ?? week.value[0] ?? later.value[0]
  if (!next || !agenda.value) return 'Отдыхайте'
  const name = plant(next.plant_id).name
  return `Дальше: ${name} — ${relativeDayLabel(next.due, agenda.value.today).toLowerCase()}`
})

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
  return plants.plantById(id) ?? { ...fallbackPlant, id }
}

function snooze(id: number) {
  snoozeUntilTomorrow(id)
  snoozeTick.value++
}

function open(id: number) {
  void navigateTo(`/plants/${id}`)
}

async function load() {
  try {
    await plants.fetchAgenda()
  } finally {
    loading.value = false
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
  padding: calc(env(safe-area-inset-top, 0px) + 18px) 20px 14px;
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
  width: 48px;
  height: 48px;
}
.ring svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}
.ring__track,
.ring__value {
  fill: none;
  stroke-width: 4;
}
.ring__track {
  stroke: #e1e6e3;
}
.ring__value {
  stroke: #2e7d32;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.4s ease;
}
.ring__text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  color: #2e7d32;
  font-variant-numeric: tabular-nums;
}
.today__allset {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 12px 12px;
  padding: 14px 16px;
  border-radius: 16px;
  background: #e8f5e9;
  color: #1b5e20;
}
.today__allset-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #2e7d32;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}
.today__allset strong {
  font-size: 15px;
}
.today__allset p {
  margin: 2px 0 0;
  font-size: 13px;
  opacity: 0.8;
}
.today__empty {
  text-align: center;
  padding: 48px 24px;
}
.today__empty-art {
  font-size: 64px;
}
.today__empty-title {
  margin: 12px 0 0;
  font-size: 20px;
  font-weight: 800;
}
.today__empty-sub {
  margin: 6px 0 0;
  color: #7b868c;
}
.today__cta {
  display: inline-block;
  margin-top: 20px;
  padding: 12px 22px;
  border-radius: 999px;
  background: #2e7d32;
  color: #fff;
  font-weight: 700;
  text-decoration: none;
}
.today__skeleton {
  margin: 0 12px;
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
}
.today__skeleton-row {
  height: 60px;
  border-bottom: 1px solid #eef0f2;
  background: linear-gradient(90deg, #fff 0%, #f1f3f2 50%, #fff 100%);
  background-size: 200% 100%;
  animation: nz-shimmer 1.2s infinite;
}
@keyframes nz-shimmer {
  to {
    background-position: -200% 0;
  }
}
</style>
