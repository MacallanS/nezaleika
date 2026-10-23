<template>
  <div class="nz-page plist">
    <Teleport v-if="headerActionsActive" :to="`#${headerActionsId}`">
      <NuxtLink to="/plants/add" class="nz-icon-btn" aria-label="Добавить растение">+</NuxtLink>
    </Teleport>

    <div class="plist__search">
      <RrSearchInput v-model="query" placeholder="Поиск по имени, виду, комнате" />
    </div>

    <p v-if="loaded && !plants.list.length" class="plist__empty">
      Пока пусто. <NuxtLink to="/plants/add">Добавьте первый цветок</NuxtLink>
    </p>
    <p v-else-if="loaded && !groups.length" class="plist__empty">Ничего не нашлось</p>

    <section v-for="g in groups" :key="g.room" class="plist__group">
      <h2 class="plist__room">
        {{ g.room }} <span>{{ g.items.length }}</span>
      </h2>
      <ul class="plist__list nz-card">
        <li v-for="p in g.items" :key="p.id">
          <NuxtLink :to="`/plants/${p.id}`" class="row">
            <PlantThumb
              class="row__thumb"
              :photo-url="p.photo_url"
              :category="p.category || p.species_detail?.category"
              :name="p.name"
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
import { RrSearchInput } from 'bibli/shared/ui/rr'
import PlantThumb from '~/components/plants/PlantThumb.vue'
import type { PlantDetail } from '~/stores/plants'
import { formatDayMonth, pluralDays } from '~/utils/dates'

const NO_ROOM = 'Без комнаты'

const plants = usePlantsStore()
const query = ref('')
const loaded = ref(false)

const { headerActionsId, headerActionsActive } = usePageChrome({
  title: 'Растения',
  description: 'Все цветы дома',
})

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
  padding-bottom: 24px;
}
.plist__search {
  margin-bottom: 12px;
}
.plist__empty {
  padding: 8px 0 16px;
  color: #7b868c;
}
.plist__empty a {
  color: #2e7d32;
  font-weight: 700;
}
.plist__room {
  margin: 8px 4px 6px;
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
  margin: 0 0 12px;
  padding: 0;
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
  pointer-events: none;
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

@media (min-width: 1025px) {
  .plist {
    max-width: 760px;
  }
}
</style>
