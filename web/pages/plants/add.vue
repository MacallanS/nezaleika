<template>
  <div class="nz-page nz-page--rr add-page">
    <AppPageHeaderRR
      :title="step === 1 ? 'Выберите вид' : 'Новый цветок'"
      child-page
      parent-title="Растения"
      parent-to="/plants"
    />

    <div v-if="step === 1" class="add-page__body">
      <AuthRRInputText v-model="query" label="Поиск" placeholder="Монстера, фикус…" @input="searchSpecies" />
      <ul class="species-list">
        <li v-for="s in species" :key="s.id">
          <button type="button" class="species-item" @click="selectSpecies(s)">
            <strong>{{ s.name_ru }}</strong>
            <span>{{ s.name_lat }}</span>
          </button>
        </li>
      </ul>
    </div>

    <form v-else class="add-page__body" @submit.prevent="submit">
      <p class="picked">{{ selected?.name_ru }}</p>
      <AuthRRInputText v-model="name" label="Имя у вас дома" required />
      <AuthRRInputText v-model="room" label="Где стоит" placeholder="Кухня, спальня…" />
      <AuthRRField label="Когда последний раз поливали">
        <input v-model="lastWatered" type="date" class="date-input" :max="todayIso" required />
      </AuthRRField>
      <AuthRRField label="Фото">
        <input type="file" accept="image/*" capture="environment" @change="onFile" />
        <div v-if="preview" class="preview" :style="{ backgroundImage: `url(${preview})` }" />
      </AuthRRField>
      <AuthRRButton type="submit" :disabled="saving" class="submit">
        {{ saving ? 'Сохраняем…' : 'Сохранить' }}
      </AuthRRButton>
    </form>
  </div>
</template>

<script setup lang="ts">
import { AppPageHeaderRR } from 'bibli/widgets/Layout/rr'
import { AuthRRButton, AuthRRField, AuthRRInputText } from 'bibli/shared/ui/rr'
import { ensureAuth, getApi } from '~/utils/api'
import { isoDate } from '~/utils/dates'
import { notify } from '~/utils/toast'

const plantsStore = usePlantsStore()
const router = useRouter()

interface Species {
  id: number
  name_ru: string
  name_lat: string
}

const step = ref(1)
const query = ref('')
const species = ref<Species[]>([])
const selected = ref<Species | null>(null)
const name = ref('')
const todayIso = isoDate(new Date())
const room = ref('')
const lastWatered = ref(todayIso)
const photoFile = ref<File | null>(null)
const preview = ref('')
const saving = ref(false)

async function searchSpecies() {
  await ensureAuth()
  const { data } = await getApi().get<{ results?: Species[] } | Species[]>('/api/species', {
    params: { q: query.value },
  })
  species.value = Array.isArray(data) ? data : (data.results ?? [])
}

onMounted(() => searchSpecies())

function selectSpecies(s: Species) {
  selected.value = s
  name.value = s.name_ru
  step.value = 2
}

function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  photoFile.value = file
  preview.value = URL.createObjectURL(file)
}

async function submit() {
  if (!selected.value || saving.value) return
  saving.value = true
  try {
    await ensureAuth()
    const api = getApi()
    const wateredAt = new Date(`${lastWatered.value}T12:00:00`)
    const form = new FormData()
    form.append('name', name.value.trim())
    form.append('room', room.value.trim())
    form.append('species_id', String(selected.value.id))
    form.append('added_at', wateredAt.toISOString())
    if (photoFile.value) form.append('photo', photoFile.value)
    const { data } = await api.post<{ id: number }>('/api/plants/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const watered = lastWatered.value === todayIso ? new Date() : wateredAt
    await api.post(`/api/plants/${data.id}/waterings/`, { watered_at: watered.toISOString() })
    await plantsStore.fetchAgenda()
    await router.replace('/')
    notify(`${name.value} добавлен`)
  } catch {
    notify('Не удалось сохранить растение', 'error')
    saving.value = false
  }
}
</script>

<style scoped>
.add-page {
  background: var(--rr-color-bg-surface-primary, #f2f3f7);
}
.add-page__body {
  padding: 0 16px 24px;
  max-width: 560px;
  margin: 0 auto;
}
.species-list {
  list-style: none;
  margin: 16px 0 0;
  padding: 0;
  max-height: calc(100dvh - 220px);
  overflow: auto;
  border-radius: 16px;
  background: var(--rr-color-bg-surface-secondary, #fff);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
.species-item {
  width: 100%;
  text-align: left;
  padding: 14px 16px;
  border: none;
  border-bottom: 1px solid var(--rr-color-border-subtle, #eee);
  background: transparent;
  cursor: pointer;
}
.species-item:last-child {
  border-bottom: none;
}
.species-item strong {
  display: block;
  font-size: 15px;
}
.species-item span {
  font-size: 12px;
  color: var(--rr-color-text-secondary, #888);
}
.picked {
  font-weight: 700;
  color: #2e7d32;
  margin: 0 0 8px;
}
.date-input {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--rr-color-border-subtle, #ddd);
  font: inherit;
  box-sizing: border-box;
  background: var(--rr-color-bg-surface-secondary, #fff);
}
.preview {
  margin-top: 12px;
  height: 160px;
  border-radius: 16px;
  background-size: cover;
  background-position: center;
}
.submit {
  width: 100%;
  margin-top: 16px;
}
</style>
