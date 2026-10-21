<template>
  <div class="notifications-container" v-if="latestNotification">
    <Transition name="notification">
      <div
        v-if="latestNotification"
        class="notification"
        :class="latestNotification.severity"
      >
        <div class="notification-content">
          <div class="notification-title">{{ latestNotification.summary }}</div>
          <div class="notification-message">{{ latestNotification.detail }}</div>
        </div>
        <button class="notification-close" @click="hideNotification(latestNotification.id)">
          <i class="pi pi-times"></i>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, computed } from 'vue'
import { useNotification } from '~/stores/notification'
import { storeToRefs } from 'pinia'

const notificationStore = useNotification()
const { visibleNotifications } = storeToRefs(notificationStore)
const hideTimeouts = ref(new Map())

const latestNotification = computed(() => {
  return visibleNotifications.value[0] || null
})

onMounted(async () => {
  if (latestNotification.value) {
    setupAutoHide(latestNotification.value.id)
  }
})

onUnmounted(() => {
  hideTimeouts.value.forEach(timeout => clearTimeout(timeout))
  hideTimeouts.value.clear()
})

const hideNotification = (id) => {
  notificationStore.hideNotification(id)
  if (hideTimeouts.value.has(id)) {
    clearTimeout(hideTimeouts.value.get(id))
    hideTimeouts.value.delete(id)
  }
}

const setupAutoHide = (id) => {
  if (hideTimeouts.value.has(id)) {
    clearTimeout(hideTimeouts.value.get(id))
  }
  
  const timeout = setTimeout(() => {
    hideNotification(id)
  }, 3000)
  
  hideTimeouts.value.set(id, timeout)
}

watch(() => notificationStore.notifications, (newNotifications) => {
  if (newNotifications && newNotifications.length > 0) {
    const latest = newNotifications[0]
    if (!visibleNotifications.value.some(n => n.id === latest.id)) {
      notificationStore.visibleNotifications.unshift(latest)
      setupAutoHide(latest.id)
    }
  }
}, { deep: true })

watch(latestNotification, (newNotification) => {
  if (newNotification && !hideTimeouts.value.has(newNotification.id)) {
    setupAutoHide(newNotification.id)
  }
})
</script>

<style scoped>
.notifications-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
  pointer-events: none;
}

.notification {
  background: var(--russ-bg);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: flex-start;
  gap: 12px;
  animation: slideIn 0.3s ease-out;
  pointer-events: auto;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: 600;
  margin-bottom: 4px;
  font-size: clamp(
    14px,
    calc(14px + (16 - 14) * ((100vw - 320px) / (1920 - 320))),
    16px
  );
}

.notification-message {
  color: var(--russ-text-tertiary);
  font-size: clamp(
    12px,
    calc(12px + (14 - 12) * ((100vw - 320px) / (1920 - 320))),
    14px
  );
}

.notification-close {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--russ-text-tertiary);
  transition: color 0.2s;
}

.notification-close:hover {
  color: var(--russ-text-primary);
}

.notification.success {
  border-left: 4px solid var(--russ-success);
}

.notification.error {
  border-left: 4px solid var(--russ-error);
}

.notification.warning {
  border-left: 4px solid var(--russ-warning);
}

.notification.info {
  border-left: 4px solid var(--russ-info);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.notification-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style> 