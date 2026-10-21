<template>
  <div class="nz-page home">
    <header class="home__header">
      <h1>Полив</h1>
      <p v-if="plants.dashboard.overdue" class="banner">
        {{ plants.dashboard.overdue }} просрочено — не забудьте полить
      </p>
    </header>
    <WaterWidgetCard
      :plant="widgetPlant"
      :loading="watering"
      @water="waterWidget"
    />
    <WaterFeedSwiper :items="urgentFeed" @water="onWater" />
  </div>
</template>

<script setup lang="ts">
const plants = usePlantsStore()
const watering = ref(false)

const widgetPlant = computed(() => plants.widget[0] ?? null)
const urgentFeed = computed(() => plants.feed)

onMounted(() => plants.refreshFeed())

async function waterWidget() {
  const p = widgetPlant.value
  if (!p) return
  await onWater(p.id)
}

async function onWater(id: number) {
  watering.value = true
  try {
    await plants.waterPlant(id)
  } finally {
    watering.value = false
  }
}
</script>

<style scoped>
.home__header {
  padding: 16px 16px 0;
}
.home__header h1 {
  margin: 0;
  font-size: 28px;
}
.banner {
  margin: 8px 0 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: #ffebee;
  color: #b71c1c;
  font-weight: 600;
  font-size: 14px;
}
</style>
