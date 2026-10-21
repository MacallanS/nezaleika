<template>
  <Teleport to="body">
    <div class="nz-toast-host" aria-live="polite">
      <TransitionGroup name="nz-toast">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="nz-toast"
          :class="`nz-toast--${msg.severity}`"
          role="status"
        >
          <span class="nz-toast__icon" aria-hidden="true">
            <template v-if="msg.severity === 'success'">✓</template>
            <template v-else-if="msg.severity === 'error'">!</template>
            <template v-else-if="msg.severity === 'warn'">!</template>
            <template v-else>i</template>
          </span>
          <div class="nz-toast__body">
            <p class="nz-toast__summary">{{ msg.summary }}</p>
            <p v-if="msg.detail" class="nz-toast__detail">{{ msg.detail }}</p>
          </div>
          <button type="button" class="nz-toast__close" aria-label="Закрыть" @click="dismiss(msg.id)">
            ×
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { toastMessages, removeToast } from 'bibli/shared/ui/legacy/Toast/toastState'
import type { ToastMessage } from 'bibli/shared/ui/legacy/Toast/types'

const messages = computed(() => toastMessages.value)
const timers = new Map<string, ReturnType<typeof setTimeout>>()

function clearTimer(id: string) {
  const t = timers.get(id)
  if (t) {
    clearTimeout(t)
    timers.delete(id)
  }
}

function dismiss(id: string) {
  clearTimer(id)
  removeToast(id)
}

function arm(msg: ToastMessage) {
  if (msg.life <= 0 || timers.has(msg.id)) return
  timers.set(
    msg.id,
    setTimeout(() => {
      timers.delete(msg.id)
      removeToast(msg.id)
    }, msg.life),
  )
}

watch(
  messages,
  (list) => {
    const ids = new Set(list.map((m) => m.id))
    for (const id of [...timers.keys()]) {
      if (!ids.has(id)) clearTimer(id)
    }
    list.forEach(arm)
  },
  { immediate: true, deep: true },
)

onBeforeUnmount(() => {
  for (const id of [...timers.keys()]) clearTimer(id)
})
</script>

<style scoped>
.nz-toast-host {
  position: fixed;
  z-index: 1200;
  left: 50%;
  bottom: calc(76px + env(safe-area-inset-bottom, 0px) + 12px);
  width: min(420px, calc(100vw - 24px));
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}
@media (min-width: 1025px) {
  .nz-toast-host {
    bottom: 24px;
  }
}
.nz-toast {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 12px 12px 14px;
  border-radius: 14px;
  background: #101012;
  color: #fff;
  box-shadow: 0 12px 32px rgba(16, 16, 18, 0.28);
}
.nz-toast__icon {
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  background: #2e7d32;
  color: #fff;
}
.nz-toast--error .nz-toast__icon,
.nz-toast--warn .nz-toast__icon {
  background: #c62828;
}
.nz-toast--warn .nz-toast__icon {
  background: #f9a825;
  color: #101012;
}
.nz-toast--info .nz-toast__icon {
  background: #1565c0;
}
.nz-toast__body {
  flex: 1;
  min-width: 0;
}
.nz-toast__summary {
  margin: 0;
  font-size: 14px;
  font-weight: 650;
  line-height: 1.35;
}
.nz-toast__detail {
  margin: 2px 0 0;
  font-size: 13px;
  line-height: 1.35;
  color: rgba(255, 255, 255, 0.72);
}
.nz-toast__close {
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}
.nz-toast-enter-active,
.nz-toast-leave-active {
  transition: transform 0.22s ease, opacity 0.22s ease;
}
.nz-toast-enter-from,
.nz-toast-leave-to {
  transform: translateY(14px);
  opacity: 0;
}
.nz-toast-move {
  transition: transform 0.22s ease;
}
</style>
