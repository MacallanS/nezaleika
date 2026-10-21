<template>
  <div v-if="plant" class="nz-page detail">
    <header class="head">
      <NuxtLink to="/plants">← Мои</NuxtLink>
      <h1>{{ plant.name }}</h1>
    </header>
    <div
      class="hero"
      :style="plant.photo_url ? { backgroundImage: `url(${plant.photo_url})` } : undefined"
    />
    <section class="panel">
      <p>{{ plant.species_detail?.name_ru }}</p>
      <p class="hint">{{ plant.season_hint }}</p>
      <AuthRRButton :disabled="watering" @click="waterToday">Полил сегодня</AuthRRButton>
      <AuthRRField label="Полив в прошлом">
        <input v-model="pastDate" type="date" class="date-input" :max="today" />
        <AuthRRButton class="mt" :disabled="!pastDate || watering" @click="waterPast">
          Записать
        </AuthRRButton>
      </AuthRRField>
    </section>
    <section class="panel">
      <h2>График</h2>
      <WateringChart v-if="schedule" :schedule="schedule" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { AuthRRButton, AuthRRField } from 'bibli/shared/ui/rr'
import { ensureAuth, getApi } from '~/utils/api'
import type { PlantDetail } from '~/stores/plants'
import WateringChart from '~/components/WateringChart.vue'

const route = useRoute()
const plants = usePlantsStore()
const plant = ref<PlantDetail | null>(null)
const schedule = ref<{ history: { date: string }[]; planned: { date: string }[] } | null>(null)
const watering = ref(false)
const pastDate = ref('')
const today = new Date().toISOString().slice(0, 10)

onMounted(async () => {
  const id = Number(route.params.id)
  plant.value = await plants.fetchPlant(id)
  await loadSchedule(id)
})

async function loadSchedule(id: number) {
  await ensureAuth()
  const { data } = await getApi().get(`/api/plants/${id}/schedule/`)
  schedule.value = data
}

async function waterToday() {
  await water(new Date().toISOString())
}

async function waterPast() {
  if (!pastDate.value) return
  await water(new Date(`${pastDate.value}T12:00:00`).toISOString())
}

async function water(iso: string) {
  watering.value = true
  try {
    const id = Number(route.params.id)
    await ensureAuth()
    await getApi().post(`/api/plants/${id}/waterings/`, { watered_at: iso })
    plant.value = await plants.fetchPlant(id)
    await loadSchedule(id)
    await plants.refreshFeed()
  } finally {
    watering.value = false
  }
}
</script>

<style scoped>
.head {
  padding: 16px;
}
.head a {
  color: #2e7d32;
  text-decoration: none;
}
.hero {
  height: 220px;
  background: linear-gradient(135deg, #a5d6a7, #2e7d32);
  background-size: cover;
  background-position: center;
}
.panel {
  padding: 16px;
  background: #fff;
  margin: 12px 16px;
  border-radius: 16px;
}
.hint {
  color: #666;
  font-size: 14px;
}
.date-input {
  width: 100%;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #ddd;
  margin-top: 8px;
}
.mt {
  margin-top: 8px;
  width: 100%;
}
</style>
