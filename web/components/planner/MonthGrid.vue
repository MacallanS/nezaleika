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
        :aria-label="formatDayMonth(cell.iso)"
        :aria-pressed="cell.iso === selected"
        @click="$emit('select', cell.iso)"
      >
        <span class="month__num">{{ cell.day }}</span>
        <DayDots :day="days[cell.iso]" :is-past="cell.iso < today" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CalendarDay } from '~/stores/plants'
import { addDays, formatDayMonth, isoDate, startOfWeek } from '~/utils/dates'
import DayDots from './DayDots.vue'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const props = defineProps<{
  month: Date
  selected: string
  today: string
  days: Record<string, CalendarDay>
}>()

const emit = defineEmits<{ select: [iso: string]; shift: [delta: number] }>()

const cells = computed(() => {
  const first = new Date(props.month.getFullYear(), props.month.getMonth(), 1)
  const start = startOfWeek(first)
  return Array.from({ length: 42 }, (_, i) => {
    const d = addDays(start, i)
    return { iso: isoDate(d), day: d.getDate(), inMonth: d.getMonth() === first.getMonth() }
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
  gap: 3px;
  height: 48px;
  padding: 4px 0 0;
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
</style>
