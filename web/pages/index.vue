<template>
  <div class="nz-page home" :class="{ 'home--immersive': feedFull }">
    <header v-show="!feedFull" class="home__header">
      <div class="home__title-row">
        <h1>Полив</h1>
        <button type="button" class="home__full-btn" @click="feedFull = true">
          На весь экран
        </button>
      </div>
      <p v-if="plants.dashboard.overdue" class="banner">
        {{ plants.dashboard.overdue }} просрочено — не забудьте полить
      </p>
    </header>
    <WaterWidgetCard
      v-show="!feedFull"
      :plants="widgetPlants"
      :loading="watering"
      @water="onWater"
      @snooze="onSnooze"
    />
    <button
      v-if="feedFull"
      type="button"
      class="home__close-full"
      aria-label="Закрыть полноэкранный режим"
      @click="feedFull = false"
    >
      ✕
    </button>
    <WaterFeedSwiper
      :items="feedPlants"
      :fullscreen="feedFull"
      :focus-plant-id="focusPlantId"
      @water="onWater"
    />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const plants = usePlantsStore()
const { filterSnoozed, snoozeUntilTomorrow } = useWateringSnooze()
const watering = ref(false)
const feedFull = ref(false)
const focusPlantId = ref<number | null>(null)

const widgetPlants = computed(() => filterSnoozed(plants.widget))
const feedPlants = computed(() => filterSnoozed(plants.feed))

onMounted(async () => {
  await plants.refreshFeed()
  const q = route.query.plant
  if (q) {
    focusPlantId.value = Number(q)
    feedFull.value = true
  }
})

async function onWater(id: number) {
  watering.value = true
  try {
    await plants.waterPlant(id)
  } finally {
    watering.value = false
  }
}

function onSnooze(id: number) {
  snoozeUntilTomorrow(id)
  plants.refreshFeed()
}
</script>

<style scoped>
.home--immersive {
  padding-bottom: 0;
}
.home__header {
  padding: 16px 16px 0;
}
.home__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.home__header h1 {
  margin: 0;
  font-size: 28px;
}
.home__full-btn {
  border: none;
  background: #e8f5e9;
  color: #2e7d32;
  font-weight: 600;
  font-size: 13px;
  padding: 8px 12px;
  border-radius: 999px;
}
.home__close-full {
  position: fixed;
  top: calc(12px + env(safe-area-inset-top, 0px));
  right: 16px;
  z-index: 50;
  width: 40px;
  height: 40px;
  border-radius: 20px;
  border: none;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 18px;
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
