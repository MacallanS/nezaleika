<template>
  <section v-if="plant" class="widget">
    <div
      class="widget__bg"
      :style="plant.photo_url ? { backgroundImage: `url(${plant.photo_url})` } : undefined"
    />
    <div class="widget__overlay nz-gradient-overlay" />
    <div class="widget__content">
      <p class="widget__label">Следующий полив</p>
      <h2 class="widget__title">{{ plant.name }}</h2>
      <p class="widget__species">{{ plant.species_name }}</p>
      <p class="widget__status">{{ statusLabel }}</p>
      <p class="widget__hint">{{ plant.season_hint }}</p>
      <AuthRRButton class="widget__btn" :disabled="loading" @click="$emit('water')">
        Полил
      </AuthRRButton>
    </div>
  </section>
  <section v-else class="widget widget--empty">
    <p>Всё полито — можно отдохнуть</p>
  </section>
</template>

<script setup lang="ts">
import { AuthRRButton } from 'bibli/shared/ui/rr'
import type { FeedPlant } from '~/stores/plants'

const props = defineProps<{
  plant: FeedPlant | null
  loading?: boolean
}>()

defineEmits<{ water: [] }>()

const statusLabel = computed(() => {
  const p = props.plant
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
.widget__btn {
  width: 100%;
}
.widget--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e8f5e9;
  color: #2e7d32;
  font-weight: 600;
  min-height: 120px;
}
</style>
