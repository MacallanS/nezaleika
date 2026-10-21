<template>
  <div class="tt-feed" :class="{ 'tt-feed--empty': !items.length }">
    <Swiper
      v-if="items.length"
      direction="vertical"
      :modules="modules"
      :slides-per-view="1"
      :space-between="0"
      :speed="320"
      :resistance-ratio="0.72"
      :threshold="6"
      :mousewheel="{ forceToAxis: true, sensitivity: 0.85 }"
      :touch-release-on-edges="true"
      class="tt-feed__swiper"
      @swiper="onSwiperReady"
      @slide-change="onSlideChange"
    >
      <SwiperSlide v-for="(item, slideIndex) in items" :key="item.id">
        <article
          class="tt-slide"
          :class="{ 'tt-slide--pop': popId === item.id }"
          @click="onSlideClick(item)"
        >
          <div
            class="tt-slide__bg"
            :style="item.photo_url ? { backgroundImage: `url(${item.photo_url})` } : undefined"
          />
          <div class="tt-slide__shade tt-slide__shade--top" />
          <div class="tt-slide__shade tt-slide__shade--bottom" />

          <Transition name="tt-burst">
            <div v-if="burstId === item.id" class="tt-burst" aria-hidden="true">
              <span class="tt-burst__drop">💧</span>
            </div>
          </Transition>

          <aside class="tt-rail" @click.stop>
            <button
              type="button"
              class="tt-rail__btn"
              :disabled="loadingId === item.id"
              aria-label="Полил"
              @click="onWater(item)"
            >
              <span class="tt-rail__icon tt-rail__icon--water" />
              <span class="tt-rail__label">Полил</span>
            </button>
            <button
              type="button"
              class="tt-rail__btn"
              aria-label="Напомнить завтра"
              @click="$emit('snooze', item.id)"
            >
              <span class="tt-rail__icon tt-rail__icon--snooze" />
              <span class="tt-rail__label">Завтра</span>
            </button>
            <NuxtLink :to="`/plants/${item.id}`" class="tt-rail__btn" aria-label="Подробнее">
              <span class="tt-rail__icon tt-rail__icon--info" />
              <span class="tt-rail__label">Инфо</span>
            </NuxtLink>
          </aside>

          <div class="tt-caption">
            <RrStatusBadge :label="badgeLabel(item)" :tone="badgeTone(item)" />
            <h2 class="tt-caption__title">{{ item.name }}</h2>
            <p class="tt-caption__species">@{{ speciesHandle(item) }} · {{ item.species_name }}</p>
            <p class="tt-caption__due">{{ dueText(item) }}</p>
            <p v-if="item.room" class="tt-caption__meta">{{ item.room }}</p>
            <p class="tt-caption__hint">{{ item.season_hint }}</p>
          </div>

          <p v-if="slideIndex === activeIndex && items.length > 1" class="tt-swipe-hint">
            Свайп вверх
          </p>
        </article>
      </SwiperSlide>
    </Swiper>

    <div v-else class="tt-empty">
      <p class="tt-empty__title">Лента пуста</p>
      <p class="tt-empty__sub">Всё полито — добавьте растение или откройте «Все»</p>
      <NuxtLink to="/plants/add" class="tt-empty__link">Добавить цветок</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Swiper as SwiperInstance } from 'swiper'
import { Mousewheel } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/css'
import { RrStatusBadge } from 'bibli/shared/ui/rr'
import type { FeedPlant } from '~/stores/plants'

const props = defineProps<{
  items: FeedPlant[]
  focusPlantId?: number | null
}>()

const emit = defineEmits<{ water: [id: number]; snooze: [id: number]; activeChange: [id: number | null] }>()

const modules = [Mousewheel]
const loadingId = ref<number | null>(null)
const popId = ref<number | null>(null)
const burstId = ref<number | null>(null)
const swiper = ref<SwiperInstance | null>(null)
const activeIndex = ref(0)
let lastTapAt = 0
let lastTapId: number | null = null

function onSwiperReady(instance: SwiperInstance) {
  swiper.value = instance
  activeIndex.value = instance.activeIndex
  slideToFocus()
  emitActive()
}

function onSlideChange(instance: SwiperInstance) {
  activeIndex.value = instance.activeIndex
  emitActive()
}

function emitActive() {
  const item = props.items[activeIndex.value]
  emit('activeChange', item?.id ?? null)
}

function slideToFocus() {
  const id = props.focusPlantId
  if (!id || !swiper.value) return
  const i = props.items.findIndex((p) => p.id === id)
  if (i >= 0) swiper.value.slideTo(i, 0)
}

watch(() => props.focusPlantId, slideToFocus)
watch(
  () => props.items.map((p) => p.id).join(','),
  () => nextTick(slideToFocus),
)

function slideNext() {
  swiper.value?.slideNext()
}

defineExpose({ slideNext, slideToPlant: (id: number) => {
  const i = props.items.findIndex((p) => p.id === id)
  if (i >= 0) swiper.value?.slideTo(i, 280)
} })

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

function speciesHandle(item: FeedPlant) {
  const base = item.species_name.split(/\s+/)[0] || 'plant'
  return base.toLowerCase().replace(/[^a-zа-яё0-9]/gi, '')
}

function dueText(item: FeedPlant) {
  if (item.status === 'overdue') return `Просрочено на ${Math.abs(item.days_until)} дн.`
  if (item.status === 'due_today') return 'Полить сегодня'
  return `Через ${item.days_until} дн. · до ${item.next_due}`
}

function onSlideClick(item: FeedPlant) {
  const now = Date.now()
  if (lastTapId === item.id && now - lastTapAt < 320) {
    onWater(item, true)
    lastTapAt = 0
    lastTapId = null
    return
  }
  lastTapAt = now
  lastTapId = item.id
}

async function onWater(item: FeedPlant, fromDoubleTap = false) {
  loadingId.value = item.id
  popId.value = item.id
  if (fromDoubleTap) {
    burstId.value = item.id
    setTimeout(() => {
      burstId.value = null
    }, 700)
  }
  emit('water', item.id)
  if (import.meta.client && 'vibrate' in navigator) {
    navigator.vibrate(fromDoubleTap ? [8, 40, 12] : 12)
  }
  setTimeout(() => {
    popId.value = null
    loadingId.value = null
  }, 450)
}
</script>

<style scoped>
.tt-feed {
  position: relative;
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
  max-width: 100vw;
  overflow: hidden;
  background: #000;
}
.tt-feed--empty {
  display: flex;
  align-items: center;
  justify-content: center;
}
.tt-feed__swiper {
  width: 100%;
  height: 100%;
}
.tt-slide {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #0d1f12;
  transition: transform 0.28s ease, opacity 0.28s ease;
}
.tt-slide--pop {
  transform: scale(0.985);
}
.tt-slide__bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(165deg, #2e7d32 0%, #0d3d14 55%, #051408 100%);
  background-size: cover;
  background-position: center;
  transform: scale(1.02);
}
.tt-slide__shade {
  position: absolute;
  left: 0;
  right: 0;
  pointer-events: none;
}
.tt-slide__shade--top {
  top: 0;
  height: 140px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.55) 0%, transparent 100%);
}
.tt-slide__shade--bottom {
  bottom: 0;
  height: 55%;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.88) 0%, transparent 100%);
}
.tt-rail {
  position: absolute;
  right: 10px;
  bottom: calc(88px + env(safe-area-inset-bottom, 0px));
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}
.tt-rail__btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  border: none;
  background: none;
  color: #fff;
  text-decoration: none;
  padding: 0;
  min-width: 52px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.tt-rail__btn:disabled {
  opacity: 0.5;
}
.tt-rail__icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: block;
  position: relative;
}
.tt-rail__icon--water::after {
  content: '';
  position: absolute;
  inset: 12px;
  background: radial-gradient(circle at 50% 35%, #81d4fa 0%, #29b6f6 45%, #0277bd 100%);
  border-radius: 50% 50% 45% 45%;
  transform: rotate(-12deg);
}
.tt-rail__icon--snooze::after {
  content: '⏰';
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}
.tt-rail__icon--info::after {
  content: 'i';
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 800;
  font-style: italic;
}
.tt-rail__label {
  font-size: 11px;
  font-weight: 600;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
}
.tt-caption {
  position: absolute;
  left: 16px;
  right: 76px;
  bottom: calc(20px + env(safe-area-inset-bottom, 0px));
  z-index: 2;
  color: #fff;
  text-align: left;
}
.tt-caption__title {
  margin: 10px 0 0;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.15;
}
.tt-caption__species {
  margin: 6px 0 0;
  font-size: 14px;
  font-weight: 600;
  opacity: 0.92;
}
.tt-caption__due {
  margin: 10px 0 0;
  font-size: 15px;
  font-weight: 700;
}
.tt-caption__meta {
  margin: 4px 0 0;
  font-size: 13px;
  opacity: 0.85;
}
.tt-caption__hint {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.35;
  opacity: 0.8;
  max-width: 92%;
}
.tt-swipe-hint {
  position: absolute;
  left: 50%;
  bottom: calc(8px + env(safe-area-inset-bottom, 0px));
  transform: translateX(-50%);
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.55);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  animation: tt-hint-pulse 2s ease-in-out infinite;
  pointer-events: none;
}
@keyframes tt-hint-pulse {
  0%,
  100% {
    opacity: 0.45;
    transform: translateX(-50%) translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateX(-50%) translateY(-4px);
  }
}
.tt-burst {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.tt-burst__drop {
  font-size: 88px;
  filter: drop-shadow(0 8px 24px rgba(41, 182, 246, 0.6));
  animation: tt-burst-pop 0.65s ease-out forwards;
}
@keyframes tt-burst-pop {
  0% {
    transform: scale(0.2);
    opacity: 0;
  }
  40% {
    transform: scale(1.15);
    opacity: 1;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}
.tt-burst-enter-active {
  transition: opacity 0.15s;
}
.tt-burst-leave-active {
  transition: opacity 0.2s;
}
.tt-burst-enter-from,
.tt-burst-leave-to {
  opacity: 0;
}
.tt-empty {
  text-align: center;
  padding: 24px;
  color: #e8f5e9;
}
.tt-empty__title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}
.tt-empty__sub {
  margin: 8px 0 0;
  opacity: 0.8;
}
.tt-empty__link {
  display: inline-block;
  margin-top: 20px;
  padding: 12px 20px;
  border-radius: 999px;
  background: #2e7d32;
  color: #fff;
  font-weight: 700;
  text-decoration: none;
}
</style>
