<template>
  <section v-if="current" class="widget">
    <div
      class="widget__bg"
      :style="current.photo_url ? { backgroundImage: `url(${current.photo_url})` } : undefined"
    />
    <div class="widget__overlay nz-gradient-overlay" />
    <div v-if="list.length > 1" class="widget__dots">
      <button
        v-for="(_, i) in list"
        :key="i"
        type="button"
        class="dot"
        :class="{ active: i === index }"
        :aria-label="`Растение ${i + 1}`"
        @click="index = i"
      />
    </div>
    <div class="widget__content">
      <p class="widget__label">Следующий полив</p>
      <h2 class="widget__title">{{ current.name }}</h2>
      <p class="widget__species">{{ current.species_name }}</p>
      <p class="widget__status">{{ statusLabel }}</p>
      <p class="widget__hint">{{ current.season_hint }}</p>
      <div class="widget__actions">
        <AuthRRButton class="widget__btn" :disabled="loading" @click="$emit('water', current.id)">
          Полил
        </AuthRRButton>
        <button type="button" class="widget__snooze" :disabled="loading" @click="$emit('snooze', current.id)">
          Завтра
        </button>
      </div>
    </div>
  </section>
  <section v-else class="widget widget--empty">
    <p>Всё полито — можно отдохнуть</p>
    <NuxtLink to="/plants/add">Добавить цветок</NuxtLink>
  </section>
</template>

<script setup lang="ts">
import { AuthRRButton } from 'bibli/shared/ui/rr'
import type { FeedPlant } from '~/stores/plants'

const props = defineProps<{
  plants: FeedPlant[]
  loading?: boolean
}>()

defineEmits<{ water: [id: number]; snooze: [id: number] }>()

const index = ref(0)
const list = computed(() => props.plants)
const current = computed(() => list.value[index.value] ?? list.value[0] ?? null)

watch(
  () => props.plants.map((p) => p.id).join(','),
  () => {
    index.value = 0
  },
)

const statusLabel = computed(() => {
  const p = current.value
  if (!p) return ''
  if (p.status === 'overdue') return `Просрочено на ${Math.abs(p.days_until)} дн.`
  if (p.status === 'due_today') return 'Полить сегодня'
  if (p.status === 'due_soon') return `Скоро: через ${p.days_until} дн.`
  return `Следующий полив через ${p.days_until} дн.`
})
</script>

<style scoped>
.widget {
  position: relative;
  margin: 12px 16px 0;
  border-radius: 20px;
  overflow: hidden;
  min-height: 200px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
.widget__bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #a5d6a7, #2e7d32);
  background-size: cover;
  background-position: center;
}
.widget__overlay {
  position: absolute;
  inset: 0;
}
.widget__dots {
  position: absolute;
  top: 12px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 8px;
  z-index: 2;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.45);
  padding: 0;
}
.dot.active {
  background: #fff;
  transform: scale(1.15);
}
.widget__content {
  position: relative;
  padding: 20px;
  color: #fff;
}
.widget__label {
  margin: 0;
  font-size: 12px;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.widget__title {
  margin: 6px 0 0;
  font-size: 24px;
}
.widget__species {
  margin: 4px 0 0;
  opacity: 0.85;
}
.widget__status {
  margin: 12px 0 0;
  font-weight: 700;
  font-size: 16px;
}
.widget__hint {
  margin: 4px 0 16px;
  font-size: 13px;
  opacity: 0.9;
}
.widget__actions {
  display: flex;
  gap: 10px;
  align-items: stretch;
}
.widget__btn {
  flex: 1;
}
.widget__snooze {
  flex: 0 0 auto;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-weight: 600;
  font-size: 14px;
}
.widget--empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #e8f5e9;
  color: #2e7d32;
  font-weight: 600;
  min-height: 120px;
}
.widget--empty a {
  color: #1b5e20;
  font-weight: 700;
}
</style>
