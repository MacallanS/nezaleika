<template>
  <div class="nz-page nz-page--form add-page">
    <form class="add-page__form" @submit.prevent="submit">
      <section class="nz-card nz-card--pad add-page__card">
        <SpeciesSearchField v-model="selected" />
        <AuthRRInputText
          v-model="name"
          label="Кличка"
          :placeholder="selected ? `${selected.name_ru} у окна` : 'Как зовёте дома'"
        />
        <AuthRRInputText v-model="room" label="Где стоит" placeholder="Кухня, спальня…" />
        <AuthRRField label="Когда последний раз поливали">
          <input v-model="lastWatered" type="date" class="add-page__date" :max="todayIso" required />
        </AuthRRField>
      </section>

      <section class="nz-card nz-card--pad add-page__card">
        <p class="add-page__photo-label">Фото</p>
        <label class="add-page__photo" :class="{ 'add-page__photo--filled': !!coverUrl }">
          <input type="file" accept="image/*" class="add-page__file" @change="onFile" />
          <div
            v-if="coverUrl"
            class="add-page__cover"
            :style="{ backgroundImage: `url(${coverUrl})` }"
            aria-hidden="true"
          />
          <div v-else class="add-page__photo-empty">
            <span class="add-page__photo-icon" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 7.5A2.5 2.5 0 0 1 6.5 5h2.1l.7-1.4A1.5 1.5 0 0 1 10.6 3h2.8a1.5 1.5 0 0 1 1.3.7L15.4 5h2.1A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z"
                  stroke="currentColor"
                  stroke-width="1.5"
                />
                <circle cx="12" cy="12.5" r="3.2" stroke="currentColor" stroke-width="1.5" />
              </svg>
            </span>
            <strong>{{ selected ? 'Добавить своё фото' : 'Фото цветка' }}</strong>
            <span>{{ selected ? 'Или оставим рисунок вида' : 'Сначала выберите вид — появится рисунок' }}</span>
          </div>
          <span v-if="coverUrl" class="add-page__photo-badge">{{ photoFile ? 'Сменить' : 'Своё фото' }}</span>
        </label>
        <p v-if="selected && !photoFile" class="nz-hint">Пока без фото — покажем иллюстрацию вида.</p>
      </section>

      <AuthRRButton type="submit" :disabled="saving || !selected" class="add-page__submit">
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

const coverUrl = computed(() => {
  if (preview.value) return preview.value
  if (selected.value) return illustrationForCategory(selected.value.category)
  return ''
})

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
  if (preview.value) URL.revokeObjectURL(preview.value)
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

onBeforeUnmount(() => {
  if (preview.value) URL.revokeObjectURL(preview.value)
})
</script>

<style scoped>
.add-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 28px;
}
.add-page__form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.add-page__card {
  gap: 14px;
}
.add-page__date {
  width: 100%;
  min-height: 48px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--rr-color-border-subtle, #dedee3);
  background: var(--rr-color-bg-surface-secondary, #fff);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.06);
  font: inherit;
  font-size: 15px;
  color: var(--rr-labels-neutral-primary, #101012);
  box-sizing: border-box;
}
.add-page__date:focus {
  outline: 2px solid rgba(46, 125, 50, 0.35);
  outline-offset: 1px;
}
.add-page__photo-label {
  margin: 0;
  font-size: 12px;
  line-height: 16px;
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
}
.add-page__photo {
  position: relative;
  display: block;
  margin: 0;
  min-height: 180px;
  border-radius: 16px;
  overflow: hidden;
  background: #e8f0ea;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.add-page__photo--filled {
  background: #d7e6da;
}
.add-page__file {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}
.add-page__cover {
  position: absolute;
  inset: 0;
  background: center / cover no-repeat;
}
.add-page__photo-empty {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 180px;
  padding: 24px 16px;
  text-align: center;
  color: #3d5a40;
  pointer-events: none;
}
.add-page__photo-empty strong {
  font-size: 15px;
  font-weight: 700;
  color: #1c2326;
}
.add-page__photo-empty span:last-child {
  max-width: 240px;
  font-size: 13px;
  line-height: 18px;
  color: #5f6b70;
}
.add-page__photo-icon {
  display: inline-flex;
  margin-bottom: 4px;
  color: #2e7d32;
}
.add-page__photo-badge {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 3;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(16, 16, 18, 0.72);
  color: #fff;
  font-size: 12px;
  font-weight: 650;
  pointer-events: none;
}
.add-page__submit {
  width: 100%;
  margin-top: 4px;
}
</style>
