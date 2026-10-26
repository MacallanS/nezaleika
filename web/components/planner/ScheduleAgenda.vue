<template>
  <div class="board">
    <section v-if="overdue.length" class="day">
      <header class="day__head day__head--overdue">
        <h2>Просрочено</h2>
        <span class="day__count">{{ overdue.length }}</span>
      </header>
      <div class="day__list">
        <div class="day__list-inner">
          <TaskRow
            v-for="row in overdue"
            :key="row.key"
            :plant="plant(row.plantId)"
            tone="overdue"
            snoozable
            due-label="просрочено"
            :checkable="row.checkable"
            :busy="pending[row.plantId]"
            @check="$emit('check', row.plantId, today, false)"
            @snooze="$emit('snooze', row.plantId)"
            @open="$emit('open', row.plantId)"
          />
        </div>
      </div>
    </section>

    <section
      v-for="group in groups"
      :id="`day-${group.iso}`"
      :key="group.iso"
      class="day"
      :class="{ 'day--on': group.iso === highlight }"
    >
      <header class="day__head" :class="{ 'day__head--today': group.iso === today }">
        <h2>{{ group.title }}</h2>
        <span v-if="group.aside" class="day__count">{{ group.aside }}</span>
      </header>
      <div class="day__list">
        <div class="day__list-inner">
          <TaskRow
            v-for="row in group.rows"
            :key="row.key"
            :plant="plant(row.plantId)"
            :done="row.done"
            :done-by="row.doneBy"
            :tone="row.tone"
            :snoozable="row.snoozable"
            :checkable="row.checkable"
            :undoable="row.done && canUndo(row.wateringId)"
            :due-label="rowLabel(row)"
            :busy="pending[row.plantId]"
            @check="$emit('check', row.plantId, group.iso, row.past)"
            @uncheck="row.wateringId != null && $emit('uncheck', row.wateringId)"
            @snooze="$emit('snooze', row.plantId)"
            @open="$emit('open', row.plantId)"
          />
        </div>
      </div>
    </section>

    <p v-if="!overdue.length && !groups.length" class="board__empty">На эти дни поливов нет</p>
  </div>
</template>

<script setup lang="ts">
import type { CalendarDay, PlantInfo } from '~/stores/plants'
import { buildBoard, type BoardRow } from '~/utils/scheduleBoard'
import TaskRow from './TaskRow.vue'

const props = withDefaults(
  defineProps<{
    days: Record<string, CalendarDay>
    plants: Record<string, PlantInfo>
    from: string
    to: string
    today: string
    highlight?: string
    snoozed?: number[]
    overdueBanner?: boolean
    pending?: Record<number, boolean>
  }>(),
  { highlight: '', snoozed: () => [], overdueBanner: false, pending: () => ({}) },
)

defineEmits<{
  check: [plantId: number, iso: string, past: boolean]
  uncheck: [wateringId: number]
  snooze: [plantId: number]
  open: [plantId: number]
}>()

const { canUndo } = useWateringActions()
const undo = useUndoState()

const board = computed(() => {
  void undo.value
  return buildBoard({
    days: props.days,
    from: props.from,
    to: props.to,
    today: props.today,
    snoozed: props.snoozed,
    overdueBanner: props.overdueBanner,
  })
})
const overdue = computed(() => board.value.overdue)
const groups = computed(() => board.value.groups)

const fallback: PlantInfo = {
  id: 0,
  category: 'other',
  name: '…',
  species_name: '',
  room: '',
  photo_url: null,
  interval_days: 0,
  last_watered_at: null,
  last_watered_by: '',
}

function plant(id: number): PlantInfo {
  return props.plants[String(id)] ?? { ...fallback, id }
}

function rowLabel(row: BoardRow): string {
  // День уже в заголовке секции; время (часто фиктивные 12:00) не показываем
  if (row.done) return ''
  return row.dueLabel
}
</script>

<style scoped>
.board {
  padding-bottom: 8px;
}
.day {
  margin: 0 0 12px;
  scroll-margin-top: 8px;
}
.day__head {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 4px 6px;
  background: var(--rr-backgrounds-quaternary, #f2f3f7);
}
.day__head h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #1c2326;
}
.day__head--today h2 {
  color: #2e7d32;
}
.day__head--overdue h2 {
  color: #d32f2f;
}
.day__count {
  font-size: 13px;
  font-weight: 600;
  color: #7b868c;
}
.day__head--overdue .day__count {
  color: #d32f2f;
}
.day__list {
  /* Рамка и клип на разных узлах — иначе overflow+radius режут бордер пикселями */
  background: #fff;
  border-radius: 16px;
  border: 2px solid transparent;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
}
.day__list-inner {
  border-radius: 14px;
  overflow: hidden;
  isolation: isolate;
  background: #fff;
}
.day--on .day__list {
  border-color: #2e7d32;
  box-shadow: none;
}
.board__empty {
  margin: 8px 20px 16px;
  font-size: 14px;
  color: #7b868c;
}
</style>
