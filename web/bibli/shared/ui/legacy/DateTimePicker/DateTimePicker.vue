<template>
  <div ref="wrapperRef" class="date-time-picker">
    <label v-if="label" class="date-time-picker__label">{{ label }}</label>

    <div
      class="date-time-picker__input"
      :class="{ 'is-open': isOpen, 'is-disabled': disabled }"
      @click="!disabled && toggle()"
    >
      <span class="date-time-picker__value" :class="{ placeholder: !displayValue }">
        {{ displayValue || placeholder }}
      </span>
      <span class="date-time-picker__icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
    </div>

    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="dropdownRef"
        class="date-time-picker__dropdown"
        :style="dropdownStyles"
        @click.stop
      >
        <div class="date-time-picker__section">
          <div class="date-time-picker__section-title">Дата</div>

          <div class="date-time-picker__calendar">
            <div class="date-time-picker__calendar-header">
              <button class="date-time-picker__nav-btn" @click="previousMonth" type="button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
              <div class="date-time-picker__month-year">{{ monthYearLabel }}</div>
              <button class="date-time-picker__nav-btn" @click="nextMonth" type="button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
            </div>

            <div class="date-time-picker__weekdays">
              <div v-for="day in weekdays" :key="day" class="date-time-picker__weekday">{{ day }}</div>
            </div>

            <div class="date-time-picker__days">
              <button
                v-for="day in calendarDays"
                :key="day.key"
                type="button"
                class="date-time-picker__day"
                :class="{
                  'is-other-month': day.isOtherMonth,
                  'is-today': day.isToday,
                  'is-selected': day.isSelected
                }"
                @click="selectDate(day.date)"
              >
                {{ day.day }}
              </button>
            </div>
          </div>
        </div>

        <div class="date-time-picker__section date-time-picker__section--time">
          <div class="date-time-picker__section-title">Время</div>
          <TimePicker v-model="draftTime" :step="step" :embedded="true" @complete="completeDateTimeSelection" />
        </div>

        <div class="date-time-picker__actions">
          <button type="button" class="date-time-picker__btn" @click="setNow">Сейчас</button>
          <button type="button" class="date-time-picker__btn clear" @click="clear">Очистить</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { TimePicker } from '../TimePicker'
import { buildFixedFloatingStyles, computeFloatingPlacement, getMobileFiltersBounds } from 'bibli/shared/utils'

const props = withDefaults(defineProps<{
  modelValue?: string
  label?: string
  disabled?: boolean
  step?: number
  placeholder?: string
}>(), {
  modelValue: '',
  label: '',
  disabled: false,
  step: 300,
  placeholder: 'Выберите дату и время',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isOpen = ref(false)
const wrapperRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const dropdownStyles = ref<Record<string, string | number>>({})

const draftDate = ref('')
const draftTime = ref('09:00')
const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())

const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const monthYearLabel = computed(() => {
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
  ]
  return `${monthNames[currentMonth.value]} ${currentYear.value}`
})

const selectedDateObj = computed(() => {
  const m = draftDate.value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  if (Number.isNaN(date.getTime())) return null
  date.setHours(0, 0, 0, 0)
  return date
})

const calendarDays = computed(() => {
  const days: Array<{
    key: string
    day: number
    date: Date
    isOtherMonth: boolean
    isToday: boolean
    isSelected: boolean
  }> = []

  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1))

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    date.setHours(0, 0, 0, 0)

    const isOtherMonth = date.getMonth() !== currentMonth.value
    const isToday = date.getTime() === today.getTime()
    const isSelected = selectedDateObj.value ? date.getTime() === selectedDateObj.value.getTime() : false

    days.push({
      key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
      day: date.getDate(),
      date: new Date(date),
      isOtherMonth,
      isToday,
      isSelected,
    })
  }

  return days
})

function splitValue(value: string) {
  const source = String(value || '').trim()
  const m = source.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})$/)
  if (m) return { date: m[1], time: m[2] }
  return { date: '', time: '' }
}

const displayValue = computed(() => {
  const { date, time } = splitValue(props.modelValue || '')
  if (!date || !time) return ''
  return `${formatDateRu(date)} ${time}`
})

function formatDateRu(ymd: string) {
  const [y, m, d] = ymd.split('-')
  if (!y || !m || !d) return ymd
  return `${d}.${m}.${y}`
}

function todayYmd() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function syncDraftFromModel() {
  const { date, time } = splitValue(props.modelValue || '')
  draftDate.value = date || todayYmd()
  draftTime.value = time || '09:00'
  syncCalendarToDraft()
}

function calculatePosition() {
  if (!wrapperRef.value) return
  const rect = wrapperRef.value.getBoundingClientRect()
  const estimatedHeight = 560
  const gap = 8
  const sidePadding = 8

  const filtersBounds = getMobileFiltersBounds(wrapperRef.value)
  const placementResult = computeFloatingPlacement(rect, {
    estimatedHeight,
    maxHeight: estimatedHeight,
    padding: sidePadding,
    minWidth: Math.min(340, Math.max(rect.width, 260)),
    containerRect: filtersBounds,
  })

  dropdownStyles.value = {
    ...buildFixedFloatingStyles(rect, placementResult, {
      padding: gap,
      containerRect: filtersBounds,
    }),
    width: `${Math.min(340, placementResult.width)}px`,
  }
}

function toggle() {
  if (isOpen.value) {
    isOpen.value = false
    return
  }
  syncDraftFromModel()
  isOpen.value = true
  nextTick(calculatePosition)
}

function apply() {
  emit('update:modelValue', `${draftDate.value} ${draftTime.value || '00:00'}`)
}

function syncCalendarToDraft() {
  const m = draftDate.value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return
  currentYear.value = Number(m[1])
  currentMonth.value = Number(m[2]) - 1
}

function selectDate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  draftDate.value = `${y}-${m}-${d}`
  currentYear.value = y
  currentMonth.value = date.getMonth()
}

function previousMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value -= 1
    return
  }
  currentMonth.value -= 1
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value += 1
    return
  }
  currentMonth.value += 1
}

function clear() {
  emit('update:modelValue', '')
  isOpen.value = false
}

function setNow() {
  const now = new Date()
  draftDate.value = todayYmd()
  draftTime.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  syncCalendarToDraft()
}

function completeDateTimeSelection() {
  if (!draftDate.value) {
    draftDate.value = todayYmd()
  }
  apply()
  isOpen.value = false
}

function onOutside(event: MouseEvent) {
  const target = event.target as Node | null
  if (!isOpen.value || !target) return
  if (wrapperRef.value?.contains(target)) return
  if (dropdownRef.value?.contains(target)) return
  const targetElement = target as Element
  if (targetElement?.closest?.('.time-dropdown')) return
  apply()
  isOpen.value = false
}

function onResize() {
  if (isOpen.value) calculatePosition()
}

watch(() => props.modelValue, () => {
  if (!isOpen.value) return
  syncDraftFromModel()
})

onMounted(() => {
  document.addEventListener('mousedown', onOutside)
  window.addEventListener('resize', onResize)
  window.addEventListener('scroll', onResize, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onOutside)
  window.removeEventListener('resize', onResize)
  window.removeEventListener('scroll', onResize, true)
})
</script>

<style scoped>
.date-time-picker { width: 100%; }
.date-time-picker__label { display: block; margin-bottom: 4px; color: var(--russ-text-secondary); font-size: 11px; font-weight: 600; }
.date-time-picker__input { width: 100%; padding: 0 var(--filter-control-padding-x, 12px); border: 1.5px solid var(--russ-border); border-radius: var(--filter-control-radius, 10px); height: var(--ui-control-height, var(--filter-control-height, 40px)); min-height: var(--ui-control-height, var(--filter-control-height, 40px)); background: var(--russ-bg-quaternary); box-shadow: 0 1px 4px var(--russ-shadow-accent-light); display: flex; align-items: center; justify-content: space-between; cursor: pointer; }
.date-time-picker__input:hover:not(.is-disabled) { border-color: var(--russ-border-light); }
.date-time-picker__input.is-open { border-color: var(--russ-input-border-focus); box-shadow: inset 0 0 0 3px var(--russ-shadow-accent-light); background: var(--russ-input-bg); }
.date-time-picker__input.is-disabled { opacity: .6; cursor: not-allowed; background: var(--russ-input-bg-disabled); }
.date-time-picker__value { font-family: var(--filter-control-font-family, var(--russ-font-family)); font-size: var(--filter-control-font-size, 14px); font-weight: var(--filter-control-font-weight, 500); line-height: var(--filter-control-line-height, 1.2); color: var(--russ-text-primary); }
.date-time-picker__value.placeholder { color: var(--filter-control-placeholder-color, var(--russ-text-quaternary)); }
.date-time-picker__icon { color: var(--russ-text-tertiary); display: inline-flex; }
.date-time-picker__dropdown { background: var(--russ-input-bg); border: 1.5px solid var(--russ-border); border-radius: 12px; box-shadow: 0 8px 24px var(--russ-shadow-color); padding: 10px; overflow: auto; overscroll-behavior: contain; }
.date-time-picker__section { margin-bottom: 8px; }
.date-time-picker__section:last-child { margin-bottom: 0; }
.date-time-picker__section-title { font-size: 12px; font-weight: 700; color: var(--russ-text-secondary); margin-bottom: 6px; }
.date-time-picker__calendar { border: 1px solid var(--russ-border); border-radius: 10px; padding: 6px; background: var(--russ-text-inverse); }
.date-time-picker__calendar-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.date-time-picker__nav-btn { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: 1px solid var(--russ-border); border-radius: 8px; background: var(--russ-text-inverse); color: var(--russ-text-secondary); cursor: pointer; }
.date-time-picker__nav-btn:hover { border-color: var(--russ-primary); color: var(--russ-primary); }
.date-time-picker__month-year { font-size: 12px; font-weight: 600; color: var(--russ-text-primary); }
.date-time-picker__weekdays { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-bottom: 4px; }
.date-time-picker__weekday { text-align: center; font-size: 10px; font-weight: 700; color: var(--russ-text-secondary); padding: 3px 2px; }
.date-time-picker__days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
.date-time-picker__day { border: 0; background: transparent; border-radius: 7px; min-height: 24px; font-size: 11px; color: var(--russ-text-primary); cursor: pointer; }
.date-time-picker__day:hover:not(.is-other-month) { background: var(--russ-bg-hover); }
.date-time-picker__day.is-other-month { color: var(--russ-text-quaternary); }
.date-time-picker__day.is-today { background: var(--russ-bg-blue-lighter); color: var(--russ-primary); font-weight: 600; }
.date-time-picker__day.is-selected { background: var(--russ-primary); color: var(--russ-text-inverse); font-weight: 600; }
.date-time-picker__section--time {
  border: 1px solid var(--russ-border);
  border-radius: 10px;
  padding: 6px;
  background: var(--russ-bg-quaternary);
}
.date-time-picker__section--time .date-time-picker__section-title {
  margin-bottom: 8px;
}
.date-time-picker__actions { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 6px; }
.date-time-picker__btn { border: 1px solid var(--russ-border); border-radius: 8px; background: var(--russ-text-inverse); padding: 7px 8px; cursor: pointer; color: var(--russ-text-secondary); font-size: 12px; font-weight: 600; }
.date-time-picker__btn:hover { border-color: var(--russ-primary); color: var(--russ-primary); }
.date-time-picker__btn.clear:hover { border-color: var(--russ-input-error); color: var(--russ-input-error); }
</style>
