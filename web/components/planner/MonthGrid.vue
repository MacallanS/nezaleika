<template>
  <div class="month">
    <div class="month__weekdays">
      <span v-for="w in WEEKDAYS" :key="w">{{ w }}</span>
    </div>
    <div class="month__grid" @touchstart.passive="onTouchStart" @touchend="onTouchEnd">
      <button
        v-for="cell in cells"
        :key="cell.iso"
        type="button"
        class="month__day"
        :class="{
          'month__day--muted': !cell.inMonth,
          'month__day--today': cell.iso === today,
          'month__day--selected': cell.iso === selected,
        }"
        :aria-label="cell.label"
        :aria-pressed="cell.iso === selected"
        @click="$emit('select', cell.iso)"
      >
        <span class="month__num">{{ cell.day }}</span>
        <span v-if="cell.names.length" class="month__names">
          <span class="month__chip" :class="`month__chip--${cell.tone}`">{{ cell.names[0] }}</span>
          <span v-if="cell.names.length > 1" class="month__more">+{{ cell.names.length - 1 }}</span>
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CalendarDay, PlantInfo } from '~/stores/plants'
import { addDays, formatDayMonth, isoDate, startOfWeek } from '~/utils/dates'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const props = defineProps<{
  month: Date
  selected: string
  today: string
  days: Record<string, CalendarDay>
  plants?: Record<string, PlantInfo>
}>()

const emit = defineEmits<{ select: [iso: string]; shift: [delta: number] }>()

function namesFor(iso: string): { names: string[]; tone: 'overdue' | 'planned' | 'done' } {
  const bucket = props.days[iso]
  if (!bucket) return { names: [], tone: 'planned' }
  const doneIds = new Set(bucket.done.map((item) => item.plant_id))
  const name = (id: number) => props.plants?.[String(id)]?.name
  const overdue = [...new Set(bucket.overdue)].filter((id) => !doneIds.has(id))
  const planned = iso >= props.today ? [...new Set(bucket.planned)].filter((id) => !doneIds.has(id)) : []
  const ids = [...overdue, ...planned.filter((id) => !overdue.includes(id)), ...bucket.done.map((item) => item.plant_id)]
  const tone: 'overdue' | 'planned' | 'done' = overdue.length ? 'overdue' : planned.length ? 'planned' : 'done'
  return { names: ids.map(name).filter((n): n is string => !!n), tone }
}

const cells = computed(() => {
  const first = new Date(props.month.getFullYear(), props.month.getMonth(), 1)
  const start = startOfWeek(first)
  return Array.from({ length: 42 }, (_, i) => {
    const d = addDays(start, i)
    const iso = isoDate(d)
    const info = namesFor(iso)
    return {
      iso,
      day: d.getDate(),
      inMonth: d.getMonth() === first.getMonth(),
      names: info.names,
      tone: info.tone,
      label: info.names.length ? `${formatDayMonth(iso)}: ${info.names.join(', ')}` : formatDayMonth(iso),
    }
  })
})

let startX = 0
let startY = 0
function onTouchStart(e: TouchEvent) {
  startX = e.touches[0].clientX
  startY = e.touches[0].clientY
}
function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - startX
  const dy = e.changedTouches[0].clientY - startY
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) emit('shift', dx < 0 ? 1 : -1)
}
</script>

<style scoped>
.month__weekdays,
.month__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}
.month__weekdays {
  padding: 0 8px 4px;
  font-size: 12px;
  font-weight: 600;
  color: #9aa5ad;
  text-align: center;
}
.month__grid {
  padding: 0 8px;
  row-gap: 2px;
  touch-action: pan-y;
}
.month__day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 0;
  min-height: 48px;
  height: auto;
  padding: 2px 1px 3px;
  overflow: hidden;
  border: none;
  background: none;
  font: inherit;
  color: #1c2326;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.month__num {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.month__day--muted {
  color: #c3cad0;
}
.month__day--today .month__num {
  color: #2e7d32;
  font-weight: 800;
}
.month__day--selected .month__num {
  background: #2e7d32;
  color: #fff;
}
.month__names {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  min-width: 0;
  min-height: 14px;
  padding: 0 1px;
}
.month__chip,
.month__more {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 9px;
  font-weight: 700;
  line-height: 1.2;
}
.month__chip--overdue {
  color: #d32f2f;
}
.month__chip--planned {
  color: #1565c0;
}
.month__chip--done {
  color: #2e7d32;
}
.month__more {
  color: #7b868c;
  font-weight: 600;
}
</style>
