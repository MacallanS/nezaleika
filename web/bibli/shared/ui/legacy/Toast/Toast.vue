<template>
  <Teleport to="body">
    <div class="russ-toast-container" :class="positionClass">
      <TransitionGroup name="russ-toast" tag="div" class="russ-toast-list">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="russ-toast-item"
          :class="[msg.severity]"
          role="alert"
        >
          <div class="russ-toast-icon" :class="msg.severity" aria-hidden="true">
            <span v-if="msg.severity === 'success'">✓</span>
            <span v-else-if="msg.severity === 'error'">✕</span>
            <span v-else-if="msg.severity === 'warn'">!</span>
            <span v-else>i</span>
          </div>
          <div class="russ-toast-content">
            <div v-if="msg.summary" class="russ-toast-summary">{{ msg.summary }}</div>
            <div v-if="msg.detail" class="russ-toast-detail">{{ msg.detail }}</div>
          </div>
          <button
            type="button"
            class="russ-toast-close"
            aria-label="Закрыть"
            @click="remove(msg.id)"
          >
            ×
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch, onUnmounted } from 'vue'
import { toastMessages, removeToast } from './toastState'
import type { ToastMessage } from './types'

const props = withDefaults(
  defineProps<{
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  }>(),
  { position: 'bottom-right' }
)

const positionClass = computed(() => `position-${props.position}`)

const messages = computed(() => toastMessages.value)

const lifeTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

function clearLifeTimeout(id: string) {
  const t = lifeTimeouts.get(id)
  if (t) {
    clearTimeout(t)
    lifeTimeouts.delete(id)
  }
}

function scheduleRemove(msg: ToastMessage) {
  if (msg.life <= 0) return
  clearLifeTimeout(msg.id)
  const t = setTimeout(() => {
    removeToast(msg.id)
    lifeTimeouts.delete(msg.id)
  }, msg.life)
  lifeTimeouts.set(msg.id, t)
}

function remove(id: string) {
  clearLifeTimeout(id)
  removeToast(id)
}

watch(
  messages,
  (list) => {
    list.forEach((msg) => {
      if (msg.life > 0 && !lifeTimeouts.has(msg.id)) {
        scheduleRemove(msg)
      }
    })
  },
  { immediate: true, deep: true }
)

onUnmounted(() => {
  lifeTimeouts.forEach((t) => clearTimeout(t))
  lifeTimeouts.clear()
})
</script>

<style scoped>
.russ-toast-container {
  position: fixed;
  z-index: 100000000000;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: min(400px, calc(100vw - 2rem));
  pointer-events: none;
}
.russ-toast-container.position-bottom-right {
  bottom: 1.25rem;
  right: 1.25rem;
}
.russ-toast-container.position-bottom-left {
  bottom: 1.25rem;
  left: 1.25rem;
}
.russ-toast-container.position-top-right {
  top: 1.25rem;
  right: 1.25rem;
}
.russ-toast-container.position-top-left {
  top: 1.25rem;
  left: 1.25rem;
}
.russ-toast-container.position-top-center {
  top: 1.25rem;
  left: 50%;
  transform: translateX(-50%);
}
.russ-toast-container.position-bottom-center {
  bottom: 1.25rem;
  left: 50%;
  transform: translateX(-50%);
}

.russ-toast-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.russ-toast-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1rem 1rem 0.875rem;
  background: var(--russ-bg);
  border-radius: 10px;
  box-shadow: 0 4px 16px var(--russ-shadow-color);
  border-left: 4px solid var(--russ-neutral);
  pointer-events: auto;
  font-size: clamp(13px, calc(13px + (15 - 13) * ((100vw - 320px) / (1920 - 320))), 15px);
}

.russ-toast-item.success {
  border-left-color: var(--russ-success);
}
.russ-toast-item.error {
  border-left-color: var(--russ-error);
}
.russ-toast-item.warn {
  border-left-color: var(--russ-warning);
}
.russ-toast-item.info {
  border-left-color: var(--russ-info);
}

.russ-toast-icon {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--russ-text-inverse);
}
.russ-toast-icon.success {
  background: var(--russ-success);
}
.russ-toast-icon.error {
  background: var(--russ-error);
}
.russ-toast-icon.warn {
  background: var(--russ-warning);
}
.russ-toast-icon.info {
  background: var(--russ-info);
}

.russ-toast-content {
  flex: 1;
  min-width: 0;
}

.russ-toast-summary {
  font-weight: 600;
  color: var(--russ-text-primary);
  margin-bottom: 0.25rem;
  line-height: 1.3;
}

.russ-toast-detail {
  color: var(--russ-text-secondary);
  font-size: 0.9375em;
  line-height: 1.4;
}

.russ-toast-close {
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--russ-text-tertiary);
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, background 0.15s;
}
.russ-toast-close:hover {
  color: var(--russ-text-primary);
  background: var(--russ-bg-tertiary);
}

/* TransitionGroup */
.russ-toast-enter-active,
.russ-toast-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.russ-toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}
.russ-toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
.russ-toast-move {
  transition: transform 0.25s ease;
}
</style>
