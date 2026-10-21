<template>
  <div class="week" @touchstart.passive="onTouchStart" @touchend="onTouchEnd">
    <button
      v-for="cell in cells"
      :key="cell.iso"
      type="button"
      class="week__day"
      :class="{ 'week__day--today': cell.iso === today, 'week__day--selected': cell.iso === selected }"
      :aria-pressed="cell.iso === selected"
      @click="$emit('select', cell.iso)"
    >
      <span class="week__wd">{{ cell.weekday }}</span>
      <span class="week__num">{{ cell.day }}</span>
      <DayDots :day="days[cell.iso]" :is-past="cell.iso < today" />
    </button>
  </div>
</template>

<script setup lang="ts">
import type { CalendarDay } from '~/stores/plants'
import { addDays, formatWeekdayShort, isoDate } from '~/utils/dates'
import DayDots from './DayDots.vue'

const props = defineProps<{
  weekStart: Date
  selected: string
  today: string
  days: Record<string, CalendarDay>
}>()

const emit = defineEmits<{ select: [iso: string]; shift: [delta: number] }>()

const cells = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const d = addDays(props.weekStart, i)
    return { iso: isoDate(d), day: d.getDate(), weekday: formatWeekdayShort(d) }
  }),
)

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
.week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 0 8px;
  touch-action: pan-y;
}
.week__day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 4px 0 6px;
  border: none;
  background: none;
  font: inherit;
  color: #1c2326;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.week__wd {
  font-size: 12px;
  font-weight: 600;
  color: #9aa5ad;
  text-transform: capitalize;
}
.week__num {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.week__day--today .week__num {
  color: #2e7d32;
  font-weight: 800;
}
.week__day--selected .week__num {
  background: #2e7d32;
  color: #fff;
}
</style>
