<template>
  <div class="nz-page plants-list">
    <header class="head">
      <h1>Мои растения</h1>
      <NuxtLink to="/plants/add" class="fab">+</NuxtLink>
    </header>
    <div v-if="!plants.list.length" class="empty">
      <p>Пока пусто — добавьте первый цветок</p>
      <NuxtLink to="/plants/add">Добавить</NuxtLink>
    </div>
    <ul v-else class="grid">
      <li v-for="p in plants.list" :key="p.id">
        <NuxtLink :to="`/plants/${p.id}`" class="card">
          <div
            class="card__img"
            :style="p.photo_url ? { backgroundImage: `url(${p.photo_url})` } : undefined"
          />
          <div class="card__body">
            <strong>{{ p.name }}</strong>
            <span>{{ statusText(p) }}</span>
          </div>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { PlantDetail } from '~/stores/plants'

const plants = usePlantsStore()

onMounted(() => {
  plants.fetchList()
  plants.refreshFeed()
})

function statusText(p: PlantDetail) {
  if (p.status === 'overdue') return 'Просрочено'
  if (p.status === 'due_today') return 'Сегодня'
  if (p.status === 'due_soon') return 'Скоро'
  return `Через ${p.days_until} дн.`
}
</script>

<style scoped>
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
}
.head h1 {
  margin: 0;
}
.fab {
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background: #2e7d32;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  text-decoration: none;
  line-height: 1;
}
.grid {
  list-style: none;
  margin: 0;
  padding: 0 16px 16px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.card {
  display: block;
  text-decoration: none;
  color: inherit;
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}
.card__img {
  height: 120px;
  background: linear-gradient(135deg, #c8e6c9, #66bb6a);
  background-size: cover;
  background-position: center;
}
.card__body {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}
.card__body span {
  color: #666;
}
.empty {
  text-align: center;
  padding: 48px 16px;
}
</style>
