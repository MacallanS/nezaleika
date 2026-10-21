<template>
  <div class="feed-wrap" :class="{ 'feed-wrap--full': fullscreen }">
    <Swiper
      v-if="items.length"
      direction="vertical"
      :slides-per-view="1"
      class="feed-swiper"
      @swiper="onSwiperReady"
    >
      <SwiperSlide v-for="item in items" :key="item.id">
        <article class="slide" :class="{ 'slide--pop': popId === item.id }">
          <div
            class="slide__bg"
            :style="item.photo_url ? { backgroundImage: `url(${item.photo_url})` } : undefined"
          />
          <div class="slide__overlay nz-gradient-overlay" />
          <div class="slide__body">
            <RrStatusBadge :label="badgeLabel(item)" :tone="badgeTone(item)" />
            <h2>{{ item.name }}</h2>
            <p class="slide__species">{{ item.species_name }}</p>
            <p class="slide__due">{{ dueText(item) }}</p>
            <p class="slide__hint">{{ item.season_hint }}</p>
            <div class="slide__actions">
              <AuthRRButton :disabled="loadingId === item.id" @click="onWater(item)">
                Полил
              </AuthRRButton>
              <NuxtLink :to="`/plants/${item.id}`" class="slide__link">Подробнее</NuxtLink>
            </div>
          </div>
        </article>
      </SwiperSlide>
    </Swiper>
    <div v-else class="feed-empty">
      <p>Всё полито</p>
      <NuxtLink to="/plants/add">Добавить цветок</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Swiper as SwiperInstance } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/css'
import { AuthRRButton, RrStatusBadge } from 'bibli/shared/ui/rr'
import type { FeedPlant } from '~/stores/plants'

const props = defineProps<{
  items: FeedPlant[]
  fullscreen?: boolean
  focusPlantId?: number | null
}>()
const emit = defineEmits<{ water: [id: number] }>()

const loadingId = ref<number | null>(null)
const popId = ref<number | null>(null)
const swiper = ref<SwiperInstance | null>(null)

function onSwiperReady(instance: SwiperInstance) {
  swiper.value = instance
  slideToFocus()
}

function slideToFocus() {
  const id = props.focusPlantId
  if (!id || !swiper.value) return
  const i = props.items.findIndex((p) => p.id === id)
  if (i >= 0) swiper.value.slideTo(i, 0)
}

watch(() => props.focusPlantId, slideToFocus)
watch(() => props.items, () => nextTick(slideToFocus))

function badgeLabel(item: FeedPlant) {
  if (item.status === 'overdue') return 'Просрочено'
  if (item.status === 'due_today') return 'Сегодня'
  if (item.status === 'due_soon') return 'Скоро'
  return 'Норма'
}

function badgeTone(item: FeedPlant) {
  if (item.status === 'overdue') return 'danger'
  if (item.status === 'due_today') return 'warning'
  if (item.status === 'due_soon') return 'info'
  return 'success'
}

function dueText(item: FeedPlant) {
  if (item.status === 'overdue') return `Просрочено на ${Math.abs(item.days_until)} дн.`
  if (item.status === 'due_today') return 'Полить сегодня'
  return `Через ${item.days_until} дн. · до ${item.next_due}`
}

async function onWater(item: FeedPlant) {
  loadingId.value = item.id
  popId.value = item.id
  emit('water', item.id)
  if (import.meta.client && 'vibrate' in navigator) {
    navigator.vibrate(12)
  }
  setTimeout(() => {
    popId.value = null
    loadingId.value = null
  }, 450)
}
</script>

<style scoped>
.feed-wrap {
  margin-top: 12px;
  height: calc(100dvh - 320px - 72px);
  min-height: 360px;
}
.feed-wrap--full {
  position: fixed;
  inset: 0;
  z-index: 40;
  margin: 0;
  height: 100dvh;
  padding-bottom: env(safe-area-inset-bottom, 0);
  background: #000;
}
.feed-wrap--full .feed-swiper {
  margin: 0;
  border-radius: 0;
  height: 100%;
}
.feed-swiper {
  height: 100%;
  border-radius: 20px;
  margin: 0 16px;
  overflow: hidden;
}
.slide {
  position: relative;
  height: 100%;
  min-height: 360px;
  transition: transform 0.35s ease, opacity 0.35s ease;
}
.slide--pop {
  transform: scale(0.97);
  opacity: 0.85;
}
.slide__bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, #81c784, #1b5e20);
  background-size: cover;
  background-position: center;
}
.slide__overlay {
  position: absolute;
  inset: 0;
}
.slide__body {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20px;
  padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
  color: #fff;
}
.slide__body h2 {
  margin: 10px 0 0;
  font-size: 28px;
}
.slide__species {
  margin: 4px 0;
  opacity: 0.9;
}
.slide__due {
  font-weight: 700;
  margin: 8px 0 0;
}
.slide__hint {
  font-size: 13px;
  opacity: 0.85;
}
.slide__actions {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 16px;
}
.slide__link {
  color: #fff;
  text-decoration: underline;
  font-weight: 600;
}
.feed-empty {
  text-align: center;
  padding: 48px 16px;
  color: #2e7d32;
}
.feed-empty a {
  display: inline-block;
  margin-top: 12px;
  font-weight: 700;
}
</style>
