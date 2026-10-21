<template>
  <div class="chart-wrap">
    <Line :data="chartData" :options="options" />
  </div>
</template>

<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'vue-chartjs'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const props = defineProps<{
  schedule: {
    history: { date: string; type: string }[]
    planned: { date: string; type: string }[]
  }
}>()

const labels = computed(() => {
  const dates = new Set<string>()
  props.schedule.history.forEach((h) => dates.add(h.date))
  props.schedule.planned.slice(0, 12).forEach((p) => dates.add(p.date))
  return [...dates].sort()
})

const chartData = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      label: 'Факт',
      data: labels.value.map((d) =>
        props.schedule.history.some((h) => h.date === d) ? 1 : null,
      ),
      borderColor: '#2e7d32',
      backgroundColor: '#2e7d32',
      spanGaps: true,
    },
    {
      label: 'План',
      data: labels.value.map((d) =>
        props.schedule.planned.some((p) => p.date === d) ? 0.5 : null,
      ),
      borderColor: '#81c784',
      borderDash: [6, 4],
      spanGaps: true,
    },
  ],
}))

const options = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: { display: false, min: 0, max: 1.2 },
  },
  plugins: {
    legend: { position: 'bottom' as const },
  },
}
</script>

<style scoped>
.chart-wrap {
  height: 220px;
}
</style>
