<template>
  <div class="nz-page nz-page--form add-page">
    <form class="add-page__body" @submit.prevent="submit">
      <SpeciesSearchField v-model="selected" />
      <AuthRRInputText
        v-model="name"
        label="Кличка"
        :placeholder="selected ? `${selected.name_ru} у окна` : 'Как зовёте дома'"
      />
      <AuthRRInputText v-model="room" label="Где стоит" placeholder="Кухня, спальня…" />
      <AuthRRField label="Когда последний раз поливали">
        <input v-model="lastWatered" type="date" class="date-input" :max="todayIso" required />
      </AuthRRField>
      <AuthRRField label="Фото">
        <input type="file" accept="image/*" capture="environment" @change="onFile" />
        <div v-if="preview" class="preview" :style="{ backgroundImage: `url(${preview})` }" />
        <div
          v-else-if="selected"
          class="preview preview--illus"
          :style="{ backgroundImage: `url(${illustrationForCategory(selected.category)})` }"
        />
      </AuthRRField>
      <AuthRRButton type="submit" :disabled="saving || !selected" class="submit">
        {{ saving ? 'Сохраняем…' : 'Сохранить' }}
      </AuthRRButton>
    </form>
  </div>
</template>

<script setup lang="ts">
import { AuthRRButton, AuthRRField, AuthRRInputText } from 'bibli/shared/ui/rr'
import SpeciesSearchField, { type SpeciesOption } from '~/components/plants/SpeciesSearchField.vue'
import { ensureAuth, getApi } from '~/utils/api'
import { isoDate } from '~/utils/dates'
import { illustrationForCategory } from '~/utils/plantIllustrations'
import { notify } from '~/utils/toast'

const plantsStore = usePlantsStore()
const router = useRouter()

const selected = ref<SpeciesOption | null>(null)
const name = ref('')
const todayIso = isoDate(new Date())
const room = ref('')
const lastWatered = ref(todayIso)
const photoFile = ref<File | null>(null)
const preview = ref('')
const saving = ref(false)

usePageChrome(
  () => ({
    title: 'Новый цветок',
    childPage: true,
    parentTitle: 'Растения',
    parentTo: '/plants',
  }),
  {
    onBack: () => {
      if (window.history.length > 1) router.back()
      else void router.replace('/plants')
    },
  },
)

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
    const displayName = name.value.trim() || selected.value.name_ru
    const form = new FormData()
    form.append('name', displayName)
    form.append('room', room.value.trim())
    form.append('species_id', String(selected.value.id))
    form.append('added_at', wateredAt.toISOString())
    if (photoFile.value) form.append('photo', photoFile.value)
    const { data } = await api.post<{ id: number }>('/api/plants/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const watered = lastWatered.value === todayIso ? new Date() : wateredAt
    let wateringSaved = true
    try {
      await api.post(`/api/plants/${data.id}/waterings/`, { watered_at: watered.toISOString() })
    } catch {
      wateringSaved = false
    }
    await plantsStore.fetchAgenda().catch(() => undefined)
    await router.replace('/')
    if (wateringSaved) notify(`${displayName} добавлен`)
    else notify(`${displayName} добавлен, но полив не записался — отметьте его в карточке`, 'warn')
  } catch {
    notify('Не удалось сохранить растение', 'error')
    saving.value = false
  }
}
</script>

<style scoped>
.add-page__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: 24px;
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
.preview--illus {
  background-color: #e8f0ea;
}
.submit {
  width: 100%;
  margin-top: 16px;
}
</style>
