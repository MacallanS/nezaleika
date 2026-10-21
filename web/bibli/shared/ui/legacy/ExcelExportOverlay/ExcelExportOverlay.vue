<template>
  <Teleport to="body" :disabled="embedded" defer>
    <Transition name="excel-export-fade">
      <div
        v-if="active"
        class="excel-export-overlay"
        :class="{ 'excel-export-overlay--embedded': embedded }"
        :style="embedded ? undefined : { zIndex: OVERLAY_Z_INDEX }"
        role="status"
        aria-live="polite"
        aria-busy="true"
        :aria-label="stageTitle"
      >
        <div class="excel-export-card">
          <div class="excel-export-visual" aria-hidden="true">
            <span class="excel-export-ring" />
            <span class="excel-export-ring excel-export-ring--late" />
            <span class="excel-export-icon">
              <i class="pi pi-file-excel" />
            </span>
          </div>

          <Transition name="excel-export-stage" mode="out-in">
            <div :key="stageIndex" class="excel-export-copy">
              <h3 class="excel-export-title">{{ stageTitle }}</h3>
              <p class="excel-export-subtitle">{{ stageHint }}</p>
            </div>
          </Transition>

          <div class="excel-export-bar" aria-hidden="true">
            <span class="excel-export-bar-fill" />
          </div>

          <p class="excel-export-elapsed">{{ elapsedLabel }}</p>
          <p v-if="showPatienceHint" class="excel-export-patience">
            Обычно это занимает до минуты. Если зависает — проверьте интернет или VPN.
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const STAGES = [
  {
    title: 'Собираем данные',
    hint: 'Готовим строки отчёта для Excel',
  },
  {
    title: 'Формируем файл',
    hint: 'Сервер собирает таблицу — можно подождать',
  },
  {
    title: 'Почти готово',
    hint: 'Файл вот-вот откроется в новой вкладке',
  },
] as const

const STAGE_INTERVAL_MS = 4500
const PATIENCE_HINT_AFTER_MS = 12_000
/** Выше BaseModal (10000) и bottom sheet; inline style — надёжнее CSS v-bind + Teleport. */
const OVERLAY_Z_INDEX = 100050

const props = withDefaults(
  defineProps<{
    active: boolean
    /** Внутри BaseModal (#overlay) — всегда поверх итогов. */
    embedded?: boolean
  }>(),
  { embedded: false },
)

const stageIndex = ref(0)
const elapsedSec = ref(0)

let stageTimer: ReturnType<typeof setInterval> | null = null
let elapsedTimer: ReturnType<typeof setInterval> | null = null
let startedAt = 0

const stageTitle = computed(() => STAGES[stageIndex.value]?.title ?? STAGES[0].title)
const stageHint = computed(() => STAGES[stageIndex.value]?.hint ?? STAGES[0].hint)
const showPatienceHint = computed(() => elapsedSec.value >= Math.round(PATIENCE_HINT_AFTER_MS / 1000))

const elapsedLabel = computed(() => {
  const sec = elapsedSec.value
  if (sec < 1) return 'Старт выгрузки…'
  if (sec < 60) return `Идёт ${sec} с`
  const min = Math.floor(sec / 60)
  const rest = sec % 60
  return `Идёт ${min} мин ${rest.toString().padStart(2, '0')} с`
})

function clearTimers() {
  if (stageTimer) {
    clearInterval(stageTimer)
    stageTimer = null
  }
  if (elapsedTimer) {
    clearInterval(elapsedTimer)
    elapsedTimer = null
  }
}

function startProgress() {
  clearTimers()
  stageIndex.value = 0
  elapsedSec.value = 0
  startedAt = Date.now()

  stageTimer = setInterval(() => {
    stageIndex.value = Math.min(stageIndex.value + 1, STAGES.length - 1)
  }, STAGE_INTERVAL_MS)

  elapsedTimer = setInterval(() => {
    elapsedSec.value = Math.floor((Date.now() - startedAt) / 1000)
  }, 1000)
}

watch(
  () => props.active,
  (active) => {
    if (active) {
      startProgress()
    } else {
      clearTimers()
      stageIndex.value = 0
      elapsedSec.value = 0
    }
  },
  { immediate: true },
)

onBeforeUnmount(clearTimers)
</script>

<style scoped>
.excel-export-overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom));
  background:
    radial-gradient(ellipse 80% 60% at 50% 40%, rgba(33, 62, 137, 0.22), transparent 70%),
    rgba(15, 23, 42, 0.42);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.excel-export-overlay--embedded {
  position: absolute;
  z-index: 50;
  border-radius: inherit;
  padding: 16px;
}

.excel-export-card {
  width: min(100%, 360px);
  padding: 28px 24px 22px;
  border-radius: 22px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 247, 255, 0.96));
  border: 1px solid rgba(33, 62, 137, 0.12);
  box-shadow:
    0 24px 48px rgba(15, 23, 42, 0.22),
    0 2px 0 rgba(255, 255, 255, 0.8) inset;
  text-align: center;
}

.excel-export-visual {
  position: relative;
  width: 88px;
  height: 88px;
  margin: 0 auto 18px;
  display: grid;
  place-items: center;
}

.excel-export-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: var(--russ-primary, #213e89);
  border-right-color: rgba(33, 62, 137, 0.25);
  animation: excel-export-spin 1.1s linear infinite;
}

.excel-export-ring--late {
  inset: 8px;
  border-top-color: rgba(33, 62, 137, 0.45);
  border-right-color: transparent;
  animation-duration: 1.7s;
  animation-direction: reverse;
}

.excel-export-icon {
  position: relative;
  z-index: 1;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: linear-gradient(145deg, #e8edff, #d7e0ff);
  color: var(--russ-primary, #213e89);
  box-shadow: 0 8px 18px rgba(33, 62, 137, 0.18);
  animation: excel-export-pulse 2s ease-in-out infinite;
}

.excel-export-icon i {
  font-size: 1.45rem;
}

.excel-export-copy {
  min-height: 64px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.excel-export-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--russ-text, #0f172a);
  line-height: 1.25;
}

.excel-export-subtitle {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.4;
  color: var(--russ-text-secondary, #64748b);
}

.excel-export-bar {
  position: relative;
  height: 6px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(33, 62, 137, 0.1);
  margin-bottom: 12px;
}

.excel-export-bar-fill {
  position: absolute;
  inset: 0 auto 0 0;
  width: 42%;
  border-radius: inherit;
  background: linear-gradient(
    90deg,
    var(--russ-primary, #213e89),
    #4f6ec8,
    var(--russ-primary, #213e89)
  );
  background-size: 200% 100%;
  animation: excel-export-bar 1.4s ease-in-out infinite;
}

.excel-export-elapsed {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--russ-primary, #213e89);
}

.excel-export-patience {
  margin: 10px 0 0;
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--russ-text-muted, #94a3b8);
}

.excel-export-fade-enter-active,
.excel-export-fade-leave-active {
  transition: opacity 0.22s ease;
}

.excel-export-fade-enter-active .excel-export-card,
.excel-export-fade-leave-active .excel-export-card {
  transition: transform 0.22s ease, opacity 0.22s ease;
}

.excel-export-fade-enter-from,
.excel-export-fade-leave-to {
  opacity: 0;
}

.excel-export-fade-enter-from .excel-export-card,
.excel-export-fade-leave-to .excel-export-card {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

.excel-export-stage-enter-active,
.excel-export-stage-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.excel-export-stage-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.excel-export-stage-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@keyframes excel-export-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes excel-export-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.04);
  }
}

@keyframes excel-export-bar {
  0% {
    left: -42%;
    background-position: 0% 50%;
  }
  100% {
    left: 100%;
    background-position: 100% 50%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .excel-export-ring,
  .excel-export-ring--late,
  .excel-export-icon,
  .excel-export-bar-fill {
    animation: none;
  }

  .excel-export-bar-fill {
    left: 0;
    width: 70%;
  }
}
</style>
