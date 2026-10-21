<template>
  <span class="dots" aria-hidden="true">
    <span v-for="(kind, i) in dots" :key="i" class="dot" :class="`dot--${kind}`" />
  </span>
</template>

<script setup lang="ts">
import type { CalendarDay } from '~/stores/plants'

const props = defineProps<{ day?: CalendarDay; isPast?: boolean }>()

const MAX_DOTS = 3

const dots = computed(() => {
  const d = props.day
  if (!d) return []
  const out: string[] = []
  d.done.forEach(() => out.push('done'))
  d.overdue.forEach(() => out.push('overdue'))
  if (!props.isPast) d.planned.forEach(() => out.push('planned'))
  return out.slice(0, MAX_DOTS)
})
</script>

<style scoped>
.dots {
  display: flex;
  gap: 3px;
  height: 5px;
}
.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}
.dot--done {
  background: #43a047;
}
.dot--overdue {
  background: #e53935;
}
.dot--planned {
  background: #42a5f5;
}
</style>
