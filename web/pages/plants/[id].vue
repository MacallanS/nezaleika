<template>
  <div class="nz-page detail">
    <div v-if="!plant" class="detail__loading">Загружаем…</div>

    <template v-else>
      <label class="detail__hero" :class="{ 'detail__hero--empty': !plant.photo_url }">
        <img
          v-if="plant.photo_url"
          class="detail__photo"
          :src="plant.photo_url"
          :alt="plant.name"
        />
        <div
          v-else
          class="detail__empty-photo"
          :style="{ backgroundImage: `url(${illustrationForCategory(plant.category || plant.species_detail?.category)})` }"
          aria-hidden="true"
        >
          <span>Нет фото — рисунок вида</span>
        </div>
        <input type="file" accept="image/*" class="detail__file" @change="onPhoto" />
        <span class="detail__hero-hint">{{ plant.photo_url ? 'Сменить фото' : 'Добавить фото' }}</span>
      </label>

      <section class="card">
        <h1 class="detail__name">{{ plant.name }}</h1>
        <p class="detail__species">
          {{ plant.species_detail?.name_ru }}<template v-if="plant.room"> · {{ plant.room }}</template>
        </p>
        <p class="detail__due" :class="`detail__due--${plant.status}`">{{ dueText }}</p>
        <p class="detail__hint">{{ plant.season_hint }}</p>

        <button
          type="button"
          class="detail__water"
          :class="{ 'detail__water--done': !canWaterNow }"
          :disabled="busy || !canWaterNow"
          @click="waterNow"
        >
          {{ waterButtonLabel }}
        </button>

        <div class="detail__past">
          <input v-model="pastDate" type="date" class="detail__date" :max="todayIso" aria-label="Дата полива" />
          <button type="button" class="detail__past-btn" :disabled="!pastDate || busy" @click="waterPast">
            Записать за дату
          </button>
        </div>
      </section>

      <section v-if="stats" class="card">
        <h2 class="card__title">Привычка</h2>
        <HabitHeatmap :stats="stats" />
      </section>

      <section class="card card--flush">
        <h2 class="card__title card__title--pad">История</h2>
        <p v-if="!waterings.length" class="detail__empty">Поливов ещё не было</p>
        <ul v-else class="history">
          <li v-for="w in waterings" :key="w.id" class="history__row">
            <span class="history__dot" aria-hidden="true" />
            <div class="history__text">
              <strong>{{ formatWatered(w.watered_at) }}</strong>
              <span v-if="w.watered_by_name">{{ w.watered_by_name }}</span>
            </div>
            <button
              type="button"
              class="history__del"
              :aria-label="`Удалить полив ${formatWatered(w.watered_at)}`"
              @click="removeWatering(w.id)"
            >
              ×
            </button>
          </li>
        </ul>
      </section>

      <section class="card">
        <h2 class="card__title">Настройки</h2>
        <form class="edit" @submit.prevent="save">
          <p v-if="plant.species_detail" class="detail__species-line">
            Вид: <strong>{{ plant.species_detail.name_ru }}</strong>
          </p>
          <AuthRRInputText
            v-model="form.name"
            label="Кличка"
            :placeholder="plant.species_detail?.name_ru || 'Как зовёте дома'"
          />
          <AuthRRInputText v-model="form.room" label="Где стоит" placeholder="Кухня, спальня…" />
          <AuthRRInputText v-model="form.note" label="Заметка" />
          <AuthRRButton type="submit" class="edit__save" :disabled="saving">
            {{ saving ? 'Сохраняем…' : 'Сохранить' }}
          </AuthRRButton>
        </form>
        <p v-if="plant.species_detail?.care_hint" class="detail__care">{{ plant.species_detail.care_hint }}</p>
        <button type="button" class="detail__remove" @click="removePlant">Удалить растение</button>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { AuthRRButton, AuthRRInputText } from 'bibli/shared/ui/rr'
import HabitHeatmap from '~/components/planner/HabitHeatmap.vue'
import type { PlantDetail, PlantStats, WateringRecord } from '~/stores/plants'
import { ensureAuth, getApi } from '~/utils/api'
import { formatDayMonth, isoDate, pluralDays, relativeDayLabel } from '~/utils/dates'
import { illustrationForCategory } from '~/utils/plantIllustrations'
import { notify } from '~/utils/toast'

const route = useRoute()
const router = useRouter()
const plants = usePlantsStore()
const { water, unwater } = useWateringActions()

const id = computed(() => Number(route.params.id))
const plant = ref<PlantDetail | null>(null)

usePageChrome(
  () => ({
    title: plant.value?.name || 'Растение',
    description: plant.value?.species_detail?.name_ru || '',
    childPage: true,
    parentTitle: 'Растения',
    parentTo: '/plants',
  }),
  { onBack: () => goBack() },
)
const stats = ref<PlantStats | null>(null)
const waterings = ref<WateringRecord[]>([])
const busy = ref(false)
const saving = ref(false)
const pastDate = ref('')
const todayIso = isoDate(new Date())
const form = reactive({ name: '', room: '', note: '' })

const wateredToday = computed(() => waterings.value.some((w) => isoDate(new Date(w.watered_at)) === todayIso))

const canWaterNow = computed(() => {
  const p = plant.value
  if (!p || wateredToday.value) return false
  return p.status === 'overdue' || p.status === 'due_today'
})

const waterButtonLabel = computed(() => {
  if (wateredToday.value) return 'Полито сегодня'
  if (!plant.value) return 'Полил сейчас'
  if (plant.value.status === 'overdue' || plant.value.status === 'due_today') return 'Полил сейчас'
  return `Следующий полив ${formatDayMonth(plant.value.next_due)}`
})

const dueText = computed(() => {
  const p = plant.value
  if (!p) return ''
  if (p.status === 'overdue') return `Просрочено на ${pluralDays(-p.days_until)}`
  if (p.status === 'due_today') return 'Полить сегодня'
  return `Следующий полив: ${relativeDayLabel(p.next_due, todayIso).toLowerCase()} (${formatDayMonth(p.next_due)})`
})

async function load() {
  const [p, s, w] = await Promise.all([
    plants.fetchPlant(id.value),
    plants.fetchStats(id.value),
    plants.fetchWaterings(id.value),
  ])
  plant.value = p
  stats.value = s
  waterings.value = w
  form.name = p.name
  form.room = p.room
  form.note = p.note
}

onMounted(() => {
  load().catch(() => notify('Не удалось загрузить растение', 'error'))
})

watch(
  () => plants.agenda,
  () => {
    if (plant.value) void load()
  },
)

function formatWatered(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function run(fn: () => Promise<unknown>) {
  busy.value = true
  try {
    await fn()
  } finally {
    busy.value = false
  }
}

function waterNow() {
  void run(() => water(id.value))
}

function waterPast() {
  if (!pastDate.value) return
  const iso = new Date(`${pastDate.value}T12:00:00`).toISOString()
  void run(async () => {
    await water(id.value, iso)
    pastDate.value = ''
  })
}

function removeWatering(wateringId: number) {
  if (!confirm('Удалить эту запись полива?')) return
  void run(() => unwater(wateringId))
}

async function onPhoto(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const body = new FormData()
  body.append('photo', file)
  try {
    await ensureAuth()
    const { data } = await getApi().post<PlantDetail>(`/api/plants/${id.value}/photo/`, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    plant.value = data
    void plants.refreshAll()
    notify('Фото обновлено')
  } catch {
    notify('Не удалось загрузить фото', 'error')
  }
}

async function save() {
  if (saving.value) return
  saving.value = true
  try {
    await ensureAuth()
    const nickname = form.name.trim()
    const { data } = await getApi().patch<PlantDetail>(`/api/plants/${id.value}/`, {
      name: nickname || plant.value?.species_detail?.name_ru || form.name,
      room: form.room.trim(),
      note: form.note.trim(),
    })
    plant.value = data
    form.name = data.name
    void plants.refreshAll()
    notify('Сохранено')
  } catch {
    notify('Не удалось сохранить', 'error')
  } finally {
    saving.value = false
  }
}

async function removePlant() {
  if (!plant.value || !confirm(`Удалить «${plant.value.name}» вместе с историей поливов?`)) return
  try {
    await ensureAuth()
    await getApi().delete(`/api/plants/${id.value}/`)
    void plants.refreshAll()
    await router.replace('/plants')
  } catch {
    notify('Не удалось удалить', 'error')
  }
}

function goBack() {
  if (window.history.length > 1) router.back()
  else void router.replace('/')
}
</script>

<style scoped>
.detail {
  max-width: 760px;
  padding-bottom: 28px;
}
.detail__loading {
  padding: 32px 20px;
  color: #7b868c;
}
.detail__hero {
  position: relative;
  display: block;
  height: 240px;
  margin: 0 0 12px;
  border-radius: 20px;
  overflow: hidden;
  background: #e8f0ea;
  cursor: pointer;
}
.detail__hero--empty {
  background: linear-gradient(160deg, #e8f5e9 0%, #c8e6c9 55%, #a5d6a7 100%);
}
.detail__photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.detail__empty-photo {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 48px;
  color: #1b5e20;
  font-size: 14px;
  font-weight: 700;
  pointer-events: none;
  background-color: #e8f0ea;
  background-size: cover;
  background-position: center;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
}
.detail__species-line {
  margin: 0 0 8px;
  font-size: 14px;
  color: #7b868c;
}
.detail__species-line strong {
  color: #2e7d32;
}
.detail__file {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
.detail__hero-hint {
  position: absolute;
  left: 50%;
  bottom: 16px;
  transform: translateX(-50%);
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(16, 24, 40, 0.72);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  pointer-events: none;
  white-space: nowrap;
}
.detail__hero:not(.detail__hero--empty) .detail__hero-hint {
  left: auto;
  right: 12px;
  transform: none;
}
.card {
  margin: 0 0 12px;
  padding: 16px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
}
.card--flush {
  padding: 0 0 6px;
}
.card__title {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 800;
}
.card__title--pad {
  padding: 16px 16px 0;
  margin-bottom: 6px;
}
.detail__name {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.detail__species {
  margin: 4px 0 0;
  color: #7b868c;
  font-size: 14px;
}
.detail__due {
  margin: 12px 0 0;
  font-size: 15px;
  font-weight: 700;
  color: #2e7d32;
}
.detail__due--overdue {
  color: #d32f2f;
}
.detail__hint {
  margin: 4px 0 0;
  font-size: 13px;
  color: #7b868c;
}
.detail__water {
  width: 100%;
  margin-top: 14px;
  padding: 14px;
  border: none;
  border-radius: 14px;
  background: #2e7d32;
  color: #fff;
  font: inherit;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}
.detail__water--done {
  background: #e8f5e9;
  color: #2e7d32;
  font-size: 14px;
}
.detail__water:disabled {
  opacity: 0.6;
}
.detail__past {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.detail__date {
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid #dfe4e1;
  border-radius: 12px;
  font: inherit;
  background: #fff;
}
.detail__past-btn {
  padding: 10px 12px;
  border: none;
  border-radius: 12px;
  background: #eef3ef;
  color: #2e7d32;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}
.detail__past-btn:disabled {
  opacity: 0.5;
}
.detail__empty {
  margin: 0;
  padding: 4px 16px 12px;
  color: #7b868c;
  font-size: 14px;
}
.history {
  list-style: none;
  margin: 0;
  padding: 0;
}
.history__row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 52px;
  padding: 6px 8px 6px 16px;
  border-top: 1px solid #eef0f2;
}
.history__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #43a047;
}
.history__text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 14px;
}
.history__text span {
  font-size: 12.5px;
  color: #7b868c;
}
.history__del {
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  color: #9aa5ad;
  font-size: 22px;
  cursor: pointer;
}
.edit {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.edit__save {
  width: 100%;
}
.detail__care {
  margin: 14px 0 0;
  font-size: 13px;
  line-height: 1.45;
  color: #5f6b70;
}
.detail__remove {
  width: 100%;
  margin-top: 14px;
  padding: 12px;
  border: none;
  border-radius: 12px;
  background: #fdecea;
  color: #c62828;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}
</style>
