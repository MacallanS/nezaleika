<template>
  <div ref="wrapperRef" class="time-picker-wrapper" :class="{ 'is-embedded': embedded }">
    <label v-if="label && !embedded" class="time-picker-label">{{ label }}</label>

    <div
      class="time-picker-input"
      :class="{ 'is-focused': isOpen, 'is-disabled': disabled }"
      @click="!disabled && toggle()"
    >
      <span class="time-display" :class="{ placeholder: !displayValue }">
        {{ displayValue || placeholder }}
      </span>
      <span class="clock-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" />
          <path d="M12 7V12L15.5 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </span>
    </div>

    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="dropdownRef"
        class="time-dropdown"
        :style="dropdownStyles"
        @click.stop
      >
        <div class="time-grid">
          <div class="time-col time-col--hours">
            <div class="time-col-title">Часы</div>
            <button
              v-for="h in hours"
              :key="`h-${h}`"
              type="button"
              class="time-option"
              :class="{ selected: h === selectedHour }"
              @click="setHour(h)"
            >
              {{ h }}
            </button>
          </div>
          <div class="time-col time-col--minutes">
            <div class="time-col-title">Минуты</div>
            <button
              v-for="m in minutes"
              :key="`m-${m}`"
              type="button"
              class="time-option"
              :class="{ selected: m === selectedMinute }"
              @click="setMinute(m)"
            >
              {{ m }}
            </button>
          </div>
        </div>

        <div v-if="!embedded" class="time-footer">
          <button type="button" class="time-footer-btn" @click="setNow">Сейчас</button>
          <button type="button" class="time-footer-btn clear" @click="clear">Очистить</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { buildFixedFloatingStyles, computeFloatingPlacement, getMobileFiltersBounds } from 'bibli/shared/utils'

const props = defineProps<{
  modelValue?: string
  label?: string
  placeholder?: string
  disabled?: boolean
  step?: number
  embedded?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  complete: []
}>()

const isOpen = ref(false)
const wrapperRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const dropdownStyles = ref<Record<string, string | number>>({})

const parsed = computed(() => {
  const value = String(props.modelValue || '')
  const match = value.match(/^(\d{2}):(\d{2})$/)
  if (!match) return { hour: '09', minute: '00' }
  return { hour: match[1], minute: match[2] }
})

const selectedHour = computed(() => parsed.value.hour)
const selectedMinute = computed(() => parsed.value.minute)
const displayValue = computed(() => (props.modelValue || '').trim())
const placeholder = computed(() => props.placeholder || 'Выберите время')
const embedded = computed(() => Boolean(props.embedded))

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const minuteStep = computed(() => {
  const sec = Number(props.step ?? 300)
  const minutes = Math.max(1, Math.floor(sec / 60))
  return minutes
})
const minutes = computed(() => {
  const list: string[] = []
  for (let i = 0; i < 60; i += minuteStep.value) {
    list.push(String(i).padStart(2, '0'))
  }
  if (!list.includes(selectedMinute.value)) list.push(selectedMinute.value)
  return list.sort((a, b) => Number(a) - Number(b))
})

function emitTime(hour: string, minute: string) {
  emit('update:modelValue', `${hour}:${minute}`)
}

function setHour(hour: string) {
  emitTime(hour, selectedMinute.value)
}

function setMinute(minute: string) {
  emitTime(selectedHour.value, minute)
  emit('complete')
  isOpen.value = false
}

function setNow() {
  const d = new Date()
  emitTime(String(d.getHours()).padStart(2, '0'), String(d.getMinutes()).padStart(2, '0'))
  emit('complete')
  isOpen.value = false
}

function clear() {
  emit('update:modelValue', '')
  isOpen.value = false
}

function calculatePosition() {
  if (!wrapperRef.value) return
  const rect = wrapperRef.value.getBoundingClientRect()
  const estimatedHeight = 420
  const gap = 8
  const sidePadding = 8

  const filtersBounds = getMobileFiltersBounds(wrapperRef.value)
  const placementResult = computeFloatingPlacement(rect, {
    estimatedHeight,
    maxHeight: estimatedHeight,
    padding: sidePadding,
    minWidth: Math.min(300, Math.max(rect.width, 220)),
    containerRect: filtersBounds,
  })

  dropdownStyles.value = {
    ...buildFixedFloatingStyles(rect, placementResult, {
      padding: gap,
      containerRect: filtersBounds,
    }),
    width: `${Math.min(300, placementResult.width)}px`,
  }
}

function toggle() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    nextTick(calculatePosition)
  }
}

function onOutsideClick(event: MouseEvent) {
  const target = event.target as Node | null
  if (!isOpen.value || !target) return
  if (wrapperRef.value?.contains(target)) return
  if (dropdownRef.value?.contains(target)) return
  isOpen.value = false
}

function onResize() {
  if (isOpen.value) calculatePosition()
}

onMounted(() => {
  document.addEventListener('mousedown', onOutsideClick)
  window.addEventListener('resize', onResize)
  window.addEventListener('scroll', onResize, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onOutsideClick)
  window.removeEventListener('resize', onResize)
  window.removeEventListener('scroll', onResize, true)
})
</script>

<style scoped>
.time-picker-wrapper { width: 100%; position: relative; }
.time-picker-wrapper.is-embedded .time-picker-input {
  background: var(--russ-input-bg);
  box-shadow: none;
  border: 1px solid var(--russ-border);
}
.time-picker-wrapper.is-embedded .time-dropdown {
  margin-top: 2px;
}
.time-picker-label { display: block; margin-bottom: 4px; color: var(--russ-text-secondary); font-size: 11px; font-weight: 600; }
.time-picker-input {
  width: 100%;
  padding: 0 var(--filter-control-padding-x, 12px);
  border: 1.5px solid var(--russ-border);
  border-radius: var(--filter-control-radius, 10px);
  height: var(--ui-control-height, var(--filter-control-height, 40px));
  min-height: var(--ui-control-height, var(--filter-control-height, 40px));
  background: var(--russ-bg-quaternary);
  box-shadow: 0 1px 4px var(--russ-shadow-accent-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}
.time-picker-input:hover:not(.is-disabled) { border-color: var(--russ-border-light); }
.time-picker-input.is-focused { border-color: var(--russ-input-border-focus); box-shadow: inset 0 0 0 3px var(--russ-shadow-accent-light); background: var(--russ-input-bg); }
.time-picker-input.is-disabled { opacity: .6; cursor: not-allowed; background: var(--russ-input-bg-disabled); }
.time-display {
  font-family: var(--filter-control-font-family, var(--russ-font-family));
  font-size: var(--filter-control-font-size, 14px);
  font-weight: var(--filter-control-font-weight, 500);
  line-height: var(--filter-control-line-height, 1.2);
  color: var(--russ-text-primary);
}
.time-display.placeholder { color: var(--filter-control-placeholder-color, var(--russ-text-quaternary)); }
.clock-icon { color: var(--russ-text-tertiary); display: inline-flex; }
.time-dropdown { background: var(--russ-input-bg); border: 1.5px solid var(--russ-border); border-radius: 12px; box-shadow: 0 8px 24px var(--russ-shadow-color); padding: 10px; overflow: auto; overscroll-behavior: contain; }
.time-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; width: 100%; }
.time-col { width: 100%; max-height: 172px; overflow: auto; border: 1px solid var(--russ-border); border-radius: 8px; padding: 4px; background: var(--russ-bg); scrollbar-width: thin; scrollbar-color: var(--russ-border-light) transparent; }
.time-col-title {
  position: sticky;
  top: -4px;
  z-index: 3;
  font-size: 11px;
  font-weight: 700;
  color: var(--russ-text-secondary);
  margin: 0 0 6px;
  padding: 8px 4px 6px;
  background: var(--russ-bg);
  border-bottom: 1px solid var(--russ-border);
  box-shadow: 0 2px 0 var(--russ-bg);
}
.time-option { width: 100%; border: 0; background: transparent; padding: 3px; border-radius: 4px; text-align: center; cursor: pointer; color: var(--russ-text-primary); font-size: 11px; line-height: 1.15; }
.time-option:hover { background: var(--russ-bg-hover); }
.time-option.selected { background: var(--russ-primary); color: var(--russ-text-inverse); font-weight: 600; }
.time-col--hours { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; align-content: start; }
.time-col--hours .time-col-title { grid-column: 1 / -1; margin-bottom: 4px; }
.time-col--minutes { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; align-content: start; }
.time-col--minutes .time-col-title { grid-column: 1 / -1; margin-bottom: 4px; }
.time-col::-webkit-scrollbar { width: 6px; height: 6px; }
.time-col::-webkit-scrollbar-thumb { background: var(--russ-border-light); border-radius: 999px; }
.time-col::-webkit-scrollbar-track { background: transparent; }
.time-footer { display: flex; gap: 6px; margin-top: 8px; }
.time-footer-btn { flex: 1; border: 1px solid var(--russ-border); border-radius: 8px; background: var(--russ-bg); padding: 7px 8px; cursor: pointer; color: var(--russ-text-secondary); font-weight: 600; font-size: 12px; }
.time-footer-btn:hover { border-color: var(--russ-primary); color: var(--russ-primary); }
.time-footer-btn.clear:hover { border-color: var(--russ-error); color: var(--russ-error); }
</style>
