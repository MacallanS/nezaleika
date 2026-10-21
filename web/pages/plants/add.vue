<template>
  <div class="nz-page add">
    <header class="head">
      <NuxtLink to="/plants">← Назад</NuxtLink>
      <h1>{{ step === 1 ? 'Выберите вид' : 'Ваш цветок' }}</h1>
    </header>

    <div v-if="step === 1" class="step">
      <AuthRRField label="Поиск">
        <AuthRRInputText v-model="query" placeholder="Монстера, фикус…" @input="searchSpecies" />
      </AuthRRField>
      <ul class="species-list">
        <li v-for="s in species" :key="s.id">
          <button type="button" class="species-item" @click="selectSpecies(s)">
            <strong>{{ s.name_ru }}</strong>
            <span>{{ s.name_lat }}</span>
          </button>
        </li>
      </ul>
    </div>

    <form v-else class="step" @submit.prevent="submit">
      <p class="picked">{{ selected?.name_ru }}</p>
      <AuthRRField label="Имя у вас дома">
        <AuthRRInputText v-model="name" required />
      </AuthRRField>
      <AuthRRField label="Дата добавления">
        <input v-model="addedDate" type="date" class="date-input" required />
      </AuthRRField>
      <AuthRRField label="Фото">
        <input type="file" accept="image/*" capture="environment" @change="onFile" />
        <div v-if="preview" class="preview" :style="{ backgroundImage: `url(${preview})` }" />
      </AuthRRField>
      <AuthRRButton type="submit" :disabled="saving" class="submit">Сохранить</AuthRRButton>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'bibli/shared/ui/legacy/Toast'
import { AuthRRButton, AuthRRField, AuthRRInputText } from 'bibli/shared/ui/rr'
import { ensureAuth, getApi } from '~/utils/api'

const toast = useToast()
const plantsStore = usePlantsStore()

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
const addedDate = ref(new Date().toISOString().slice(0, 10))
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
  if (!selected.value) return
  saving.value = true
  try {
    await ensureAuth()
    const api = getApi()
    const addedAt = new Date(`${addedDate.value}T12:00:00`).toISOString()
    const form = new FormData()
    form.append('name', name.value)
    form.append('species_id', String(selected.value.id))
    form.append('added_at', addedAt)
    if (photoFile.value) form.append('photo', photoFile.value)
    const { data } = await api.post('/api/plants/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    await plantsStore.refreshFeed()
    toast.success(`${name.value} добавлен в коллекцию`)
    await navigateTo(`/?plant=${data.id}`)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.head {
  padding: 16px;
}
.head a {
  color: #2e7d32;
  text-decoration: none;
  font-weight: 600;
}
.head h1 {
  margin: 8px 0 0;
  font-size: 22px;
}
.step {
  padding: 0 16px 24px;
}
.species-list {
  list-style: none;
  margin: 16px 0 0;
  padding: 0;
  max-height: 60vh;
  overflow: auto;
}
.species-item {
  width: 100%;
  text-align: left;
  padding: 14px 12px;
  border: none;
  border-bottom: 1px solid #eee;
  background: #fff;
  cursor: pointer;
}
.species-item strong {
  display: block;
}
.species-item span {
  font-size: 12px;
  color: #888;
}
.picked {
  font-weight: 700;
  color: #2e7d32;
}
.date-input {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #ddd;
  font: inherit;
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
