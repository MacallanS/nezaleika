<template>
  <div class="nz-page plist">
    <header class="plist__head">
      <h1>Растения</h1>
      <NuxtLink to="/plants/add" class="plist__add" aria-label="Добавить растение">+</NuxtLink>
    </header>

    <div class="plist__search">
      <input v-model="query" type="search" placeholder="Поиск по имени, виду, комнате" aria-label="Поиск" />
    </div>

    <p v-if="loaded && !plants.list.length" class="plist__empty">
      Пока пусто. <NuxtLink to="/plants/add">Добавьте первый цветок</NuxtLink>
    </p>
    <p v-else-if="loaded && !groups.length" class="plist__empty">Ничего не нашлось</p>

    <section v-for="g in groups" :key="g.room" class="plist__group">
      <h2 class="plist__room">
        {{ g.room }} <span>{{ g.items.length }}</span>
      </h2>
      <ul class="plist__list">
        <li v-for="p in g.items" :key="p.id">
          <NuxtLink :to="`/plants/${p.id}`" class="row">
            <span
              class="row__thumb"
              :style="p.photo_url ? { backgroundImage: `url(${p.photo_url})` } : undefined"
              aria-hidden="true"
            />
            <span class="row__body">
              <strong>{{ p.name }}</strong>
              <span>{{ p.species_detail?.name_ru }} · раз в {{ pluralDays(p.interval_days) }}</span>
            </span>
            <span class="row__status" :class="`row__status--${p.status}`">{{ statusText(p) }}</span>
          </NuxtLink>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { PlantDetail } from '~/stores/plants'
import { formatDayMonth, pluralDays } from '~/utils/dates'

const NO_ROOM = 'Без комнаты'

const plants = usePlantsStore()
const query = ref('')
const loaded = ref(false)

onMounted(async () => {
  try {
    await plants.fetchList()
  } finally {
    loaded.value = true
  }
})

const groups = computed(() => {
  const q = query.value.trim().toLowerCase()
  const filtered = plants.list.filter(
    (p) =>
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.room.toLowerCase().includes(q) ||
      (p.species_detail?.name_ru ?? '').toLowerCase().includes(q),
  )
  const map = new Map<string, PlantDetail[]>()
  for (const p of filtered) {
    const room = p.room.trim() || NO_ROOM
    if (!map.has(room)) map.set(room, [])
    map.get(room)!.push(p)
  }
  return [...map.entries()]
    .sort(([a], [b]) => (a === NO_ROOM ? 1 : b === NO_ROOM ? -1 : a.localeCompare(b, 'ru')))
    .map(([room, items]) => ({ room, items: items.sort((a, b) => a.days_until - b.days_until) }))
})

function statusText(p: PlantDetail) {
  if (p.status === 'overdue') return 'Просрочено'
  if (p.status === 'due_today') return 'Сегодня'
  if (p.days_until === 1) return 'Завтра'
  return formatDayMonth(p.next_due)
}
</script>

<style scoped>
.plist {
  min-height: 100%;
  padding-bottom: 24px;
  background: #f4f6f5;
}
.plist__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(env(safe-area-inset-top, 0px) + 18px) 20px 10px;
}
.plist__head h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.plist__add {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #2e7d32;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  line-height: 1;
  text-decoration: none;
}
.plist__search {
  padding: 0 12px 12px;
}
.plist__search input {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 14px;
  border: none;
  border-radius: 12px;
  background: #e5e9e7;
  font: inherit;
  font-size: 15px;
}
.plist__empty {
  padding: 24px 20px;
  color: #7b868c;
}
.plist__empty a {
  color: #2e7d32;
  font-weight: 700;
}
.plist__room {
  margin: 8px 24px 6px;
  font-size: 13px;
  font-weight: 700;
  color: #7b868c;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.plist__room span {
  margin-left: 4px;
  color: #b0b8bd;
}
.plist__list {
  list-style: none;
  margin: 0 12px 12px;
  padding: 0;
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
}
.plist__list li + li .row {
  border-top: 1px solid #eef0f2;
}
.row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 64px;
  padding: 8px 14px;
  color: inherit;
  text-decoration: none;
}
.row__thumb {
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #c8e6c9, #66bb6a) center / cover;
}
.row__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.row__body strong {
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.row__body span {
  font-size: 12.5px;
  color: #7b868c;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.row__status {
  flex: 0 0 auto;
  font-size: 12.5px;
  font-weight: 700;
  color: #7b868c;
}
.row__status--overdue {
  color: #d32f2f;
}
.row__status--due_today {
  color: #2e7d32;
}
</style>
