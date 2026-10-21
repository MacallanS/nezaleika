<template>
  <div class="tt-home">
    <header class="tt-home__top">
      <FeedStoriesStrip
        :plants="widgetPlants"
        :active-id="activePlantId"
        @select="onStorySelect"
      />
      <div class="tt-home__tabs" role="tablist" aria-label="Режим ленты">
        <button
          type="button"
          role="tab"
          class="tt-home__tab"
          :class="{ 'tt-home__tab--active': feedMode === 'urgent' }"
          :aria-selected="feedMode === 'urgent'"
          @click="feedMode = 'urgent'"
        >
          Срочные
          <span v-if="urgentCount" class="tt-home__tab-badge">{{ urgentCount }}</span>
        </button>
        <button
          type="button"
          role="tab"
          class="tt-home__tab"
          :class="{ 'tt-home__tab--active': feedMode === 'all' }"
          :aria-selected="feedMode === 'all'"
          @click="feedMode = 'all'"
        >
          Все
        </button>
      </div>
    </header>

    <WaterFeedSwiper
      ref="feedRef"
      class="tt-home__feed"
      :items="feedPlants"
      :focus-plant-id="focusPlantId"
      @water="onWater"
      @snooze="onSnooze"
      @active-change="activePlantId = $event"
    />
  </div>
</template>

<script setup lang="ts">
import type { FeedPlant } from '~/stores/plants'

const route = useRoute()
const plants = usePlantsStore()
const { filterSnoozed, snoozeUntilTomorrow } = useWateringSnooze()

const feedRef = ref<{ slideNext: () => void; slideToPlant: (id: number) => void } | null>(null)
const feedMode = ref<'urgent' | 'all'>('urgent')
const focusPlantId = ref<number | null>(null)
const activePlantId = ref<number | null>(null)
const watering = ref(false)

const widgetPlants = computed(() => filterSnoozed(plants.widget))

const urgentCount = computed(
  () =>
    filterSnoozed(plants.feed).filter((p) =>
      ['overdue', 'due_today', 'due_soon'].includes(p.status),
    ).length,
)

function isUrgent(p: FeedPlant) {
  return p.status === 'overdue' || p.status === 'due_today' || p.status === 'due_soon'
}

const feedPlants = computed(() => {
  const base = filterSnoozed(plants.feed)
  if (feedMode.value === 'all') return base
  const urgent = base.filter(isUrgent)
  return urgent.length ? urgent : base
})

onMounted(async () => {
  await plants.refreshFeed()
  const q = route.query.plant
  if (q) {
    focusPlantId.value = Number(q)
    feedMode.value = 'all'
  }
})

function onStorySelect(id: number) {
  focusPlantId.value = id
  feedRef.value?.slideToPlant(id)
}

async function onWater(id: number) {
  if (watering.value) return
  watering.value = true
  try {
    await plants.waterPlant(id)
    await nextTick()
    feedRef.value?.slideNext()
  } finally {
    watering.value = false
  }
}

function onSnooze(id: number) {
  snoozeUntilTomorrow(id)
  plants.refreshFeed()
  feedRef.value?.slideNext()
}
</script>

<style scoped>
.tt-home {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background: #000;
}
.tt-home__feed {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
}
.tt-home__top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 5;
  padding-top: env(safe-area-inset-top, 0px);
  pointer-events: none;
}
.tt-home__top > * {
  pointer-events: auto;
}
.tt-home__tabs {
  display: flex;
  justify-content: center;
  gap: 28px;
  padding: 4px 16px 10px;
}
.tt-home__tab {
  position: relative;
  border: none;
  background: none;
  color: rgba(255, 255, 255, 0.55);
  font-size: 16px;
  font-weight: 700;
  padding: 6px 4px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.tt-home__tab--active {
  color: #fff;
}
.tt-home__tab--active::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 28px;
  height: 3px;
  margin-left: -14px;
  border-radius: 2px;
  background: #fff;
}
.tt-home__tab-badge {
  display: inline-block;
  margin-left: 6px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #c62828;
  color: #fff;
  font-size: 11px;
  line-height: 18px;
  vertical-align: middle;
}
</style>
