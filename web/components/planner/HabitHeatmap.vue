<template>
  <div class="habit">
    <div class="habit__stats">
      <div class="habit__stat">
        <strong>{{ stats.streak }}</strong>
        <span>подряд вовремя</span>
      </div>
      <div class="habit__stat">
        <strong>{{ stats.on_time_rate }}%</strong>
        <span>вовремя</span>
      </div>
      <div class="habit__stat">
        <strong>{{ stats.total }}</strong>
        <span>всего поливов</span>
      </div>
    </div>
    <div class="habit__grid" role="img" :aria-label="`Поливы за 12 недель: ${recentCount}`">
      <span
        v-for="cell in cells"
        :key="cell.date"
        class="habit__cell"
        :class="{ 'habit__cell--on': cell.count > 0, 'habit__cell--pad': cell.pad }"
        :title="cell.date"
      />
    </div>
    <div class="habit__legend">
      <span>12 недель назад</span>
      <span>сегодня</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlantStats } from '~/stores/plants'
import { parseIsoDate } from '~/utils/dates'

const props = defineProps<{ stats: PlantStats }>()

const cells = computed(() => {
  const list = props.stats.heatmap
  if (!list.length) return []
  const firstDow = (parseIsoDate(list[0].date).getDay() + 6) % 7
  const pad = Array.from({ length: firstDow }, (_, i) => ({ date: `pad-${i}`, count: 0, pad: true }))
  return [...pad, ...list.map((c) => ({ ...c, pad: false }))]
})

const recentCount = computed(() => props.stats.heatmap.reduce((s, c) => s + c.count, 0))
</script>

<style scoped>
.habit__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 14px;
}
.habit__stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.habit__stat strong {
  font-size: 22px;
  font-weight: 800;
  color: #2e7d32;
  font-variant-numeric: tabular-nums;
}
.habit__stat span {
  font-size: 12px;
  color: #7b868c;
}
.habit__grid {
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: repeat(7, 1fr);
  gap: 4px;
}
.habit__cell {
  aspect-ratio: 1;
  border-radius: 4px;
  background: #eef0f2;
}
.habit__cell--on {
  background: #43a047;
}
.habit__cell--pad {
  visibility: hidden;
}
.habit__legend {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 11px;
  color: #9aa5ad;
}
</style>
