<template>
  <RrBottomSheet
    v-model="open"
    title="Когда полили?"
    :subtitle="plantName || undefined"
    height-mode="fit"
    placement="sheet"
  >
    <div class="water-date">
      <div class="water-date__chips" role="group" aria-label="Быстрый выбор">
        <button
          type="button"
          class="water-date__chip"
          :class="{ 'is-on': date === todayIso }"
          @click="date = todayIso"
        >
          Сегодня
        </button>
        <button
          type="button"
          class="water-date__chip"
          :class="{ 'is-on': date === yesterdayIso }"
          @click="date = yesterdayIso"
        >
          Вчера
        </button>
      </div>

      <label class="water-date__field">
        <span>Дата</span>
        <input v-model="date" type="date" class="water-date__input" :max="todayIso" />
      </label>

      <AuthRRButton type="button" :disabled="!date || date > todayIso" @click="confirm">
        Записать полив
      </AuthRRButton>
    </div>
  </RrBottomSheet>
</template>

<script setup lang="ts">
import { AuthRRButton, RrBottomSheet } from 'bibli/shared/ui/rr'
import { addDays, isoDate } from '~/utils/dates'

const open = defineModel<boolean>({ default: false })

const props = withDefaults(
  defineProps<{
    plantName?: string
    today?: string
    /** Prefill when opening; clamped to today or earlier. */
    initialDate?: string
  }>(),
  { plantName: '', today: '', initialDate: '' },
)

const emit = defineEmits<{ confirm: [isoDate: string] }>()

const todayIso = computed(() => props.today || isoDate(new Date()))
const yesterdayIso = computed(() => isoDate(addDays(new Date(parseToday()), -1)))

const date = ref(todayIso.value)

function parseToday(): Date {
  const [y, m, d] = todayIso.value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function resolveInitial(): string {
  const candidate = props.initialDate || todayIso.value
  return candidate > todayIso.value ? todayIso.value : candidate
}

watch(open, (v) => {
  if (v) date.value = resolveInitial()
})

function confirm() {
  if (!date.value || date.value > todayIso.value) return
  emit('confirm', date.value)
  open.value = false
}
</script>

<style scoped>
.water-date {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 4px 0 8px;
}
.water-date__chips {
  display: flex;
  gap: 8px;
}
.water-date__chip {
  flex: 1;
  border: none;
  border-radius: 12px;
  padding: 12px 10px;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  background: #eef2f0;
  color: #3d474b;
  cursor: pointer;
}
.water-date__chip.is-on {
  background: #e8f5e9;
  color: #1b5e20;
  box-shadow: inset 0 0 0 1px rgba(46, 125, 50, 0.28);
}
.water-date__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #5f6b70;
}
.water-date__input {
  height: 44px;
  border-radius: 12px;
  border: 1px solid #d7dde0;
  padding: 0 12px;
  font: inherit;
  font-size: 16px;
  color: #1c2326;
  background: #fff;
}
</style>
