<template>
  <div class="task" :class="[`task--${tone}`, { 'task--done': done, 'task--open': offset < 0 }]">
    <div class="task__actions" aria-hidden="true">
      <button v-if="canSnooze" type="button" class="task__action task__action--snooze" tabindex="-1" @click="onSnooze">
        Завтра
      </button>
      <button type="button" class="task__action task__action--open" tabindex="-1" @click="onOpen">
        Открыть
      </button>
    </div>

    <div
      class="task__body"
      :style="{ transform: `translateX(${offset}px)` }"
      @touchstart.passive="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <span v-if="!checkable" class="task__check task__check--static" aria-hidden="true" />
      <button
        v-else
        type="button"
        class="task__check"
        :class="{ 'task__check--busy': busy }"
        :aria-label="done ? `Отменить полив: ${plant.name}` : `Полил: ${plant.name}`"
        :aria-pressed="done"
        @click.stop="onCheck"
      >
        <svg v-if="done" viewBox="0 0 24 24" class="task__tick" aria-hidden="true">
          <path d="M6 12.5l4 4 8-9" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <button type="button" class="task__main" @click="onOpen">
        <span class="task__title">{{ plant.name }}</span>
        <span class="task__meta">
          <span v-if="dueLabel" class="task__due">{{ dueLabel }}</span>
          <span v-if="plant.room">{{ plant.room }}</span>
          <span>раз в {{ pluralDays(plant.interval_days) }}</span>
        </span>
      </button>

      <span v-if="doneBy" class="task__who" :title="`Полил(а): ${doneBy}`">{{ doneBy.slice(0, 1) }}</span>
      <span
        class="task__thumb"
        :style="plant.photo_url ? { backgroundImage: `url(${plant.photo_url})` } : undefined"
        aria-hidden="true"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlantInfo } from '~/stores/plants'
import { pluralDays } from '~/utils/dates'

const props = withDefaults(
  defineProps<{
    plant: PlantInfo
    done?: boolean
    doneBy?: string
    dueLabel?: string
    tone?: 'overdue' | 'today' | 'normal'
    busy?: boolean
    checkable?: boolean
    snoozable?: boolean
  }>(),
  { done: false, doneBy: '', dueLabel: '', tone: 'normal', busy: false, checkable: true, snoozable: false },
)

const emit = defineEmits<{ check: []; uncheck: []; snooze: []; open: [] }>()

const ACTION_WIDTH = 84
const canSnooze = computed(() => props.snoozable && !props.done)
const actionsWidth = computed(() => ACTION_WIDTH * (canSnooze.value ? 2 : 1))
const offset = ref(0)
let startX = 0
let startY = 0
let startOffset = 0
let tracking: 'x' | 'y' | null = null

function onTouchStart(e: TouchEvent) {
  startX = e.touches[0].clientX
  startY = e.touches[0].clientY
  startOffset = offset.value
  tracking = null
}

function onTouchMove(e: TouchEvent) {
  const dx = e.touches[0].clientX - startX
  const dy = e.touches[0].clientY - startY
  if (!tracking) {
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
    tracking = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
  }
  if (tracking !== 'x') return
  e.preventDefault()
  offset.value = Math.max(-actionsWidth.value, Math.min(0, startOffset + dx))
}

function onTouchEnd() {
  if (tracking === 'x') offset.value = offset.value < -actionsWidth.value / 2 ? -actionsWidth.value : 0
  tracking = null
}

function close() {
  offset.value = 0
}

function onCheck() {
  if (props.busy) return
  close()
  if (props.done) emit('uncheck')
  else emit('check')
}

function onSnooze() {
  close()
  emit('snooze')
}

function onOpen() {
  if (offset.value < 0) {
    close()
    return
  }
  emit('open')
}
</script>

<style scoped>
.task {
  position: relative;
  overflow: hidden;
  background: #fff;
}
.task + .task .task__body::before {
  content: '';
  position: absolute;
  top: 0;
  left: 56px;
  right: 0;
  height: 1px;
  background: #eef0f2;
}
.task__actions {
  position: absolute;
  inset: 0 0 0 auto;
  display: flex;
}
.task__action {
  width: 84px;
  border: none;
  color: #fff;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
.task__action--snooze {
  background: #f9a825;
}
.task__action--open {
  background: #607d8b;
}
.task__body {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 60px;
  padding: 8px 14px 8px 16px;
  background: #fff;
  transition: transform 0.2s ease;
  touch-action: pan-y;
}
.task__check {
  flex: 0 0 auto;
  width: 26px;
  height: 26px;
  padding: 0;
  border-radius: 50%;
  border: 2px solid #9aa5ad;
  background: #fff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.18s, border-color 0.18s, transform 0.18s;
  -webkit-tap-highlight-color: transparent;
}
.task__check:active {
  transform: scale(0.88);
}
.task--today .task__check {
  border-color: #2e7d32;
}
.task--overdue .task__check {
  border-color: #d32f2f;
}
.task--done .task__check {
  border-color: #2e7d32;
  background: #2e7d32;
}
.task__check--static {
  border-style: dashed;
  cursor: default;
}
.task__check--busy {
  opacity: 0.5;
}
.task__tick {
  width: 18px;
  height: 18px;
}
.task__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  text-align: left;
  color: inherit;
  cursor: pointer;
}
.task__title {
  max-width: 100%;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.25;
  color: #1c2326;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s;
}
.task--done .task__title {
  color: #9aa5ad;
  text-decoration: line-through;
}
.task__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  font-size: 12.5px;
  color: #7b868c;
}
.task__due {
  font-weight: 700;
  color: #2e7d32;
}
.task--overdue .task__due {
  color: #d32f2f;
}
.task--done .task__due {
  color: #9aa5ad;
}
.task__who {
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e3f2fd;
  color: #1565c0;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.task__thumb {
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #c8e6c9, #66bb6a) center / cover;
}
.task--done .task__thumb {
  opacity: 0.55;
}
</style>
