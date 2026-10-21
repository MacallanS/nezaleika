<script setup>
import { ref, onMounted } from 'vue'
import { useNotification } from '~/stores/notification'
import { storeToRefs } from 'pinia'

const NotificationShow = ref(false)
const notificationStore = useNotification()
const { notifications } = storeToRefs(notificationStore)

onMounted(async () => {
  await notificationStore.fetchNotifications()
})

const clearAll = async () => {
  await notificationStore.clearAllNotifications()
}

const deleteNotification = async (id) => {
  await notificationStore.removeNotification(id)
}
</script>

<template>
  <div>
    <i class="pi pi-bell" @click="NotificationShow = true" />

    <Drawer
      v-model:visible="NotificationShow"
      header="Оповещения"
      position="right"
      class="notification-drawer"
    >
      <div class="notification-header-bar" v-if="notifications && notifications.length">
        <button class="clear-all-btn" @click="clearAll">Очистить всё</button>
      </div>

      <div class="notification-wrapper">
        <div
          v-for="item in notifications"
          :key="item.id"
          :class="['notification', 'notification-' + item.severity]"
        >
          <div class="notification-header">
            <i
              v-if="item.severity === 'success'"
              class="pi pi-check"
              style="color: var(--russ-success)"
            ></i>
            <i
              v-else-if="item.severity === 'info'"
              class="pi pi-info-circle"
              style="color: var(--russ-accent-light)"
            ></i>
            <i
              v-else-if="item.severity === 'warn'"
              class="pi pi-exclamation-triangle"
              style="color: var(--russ-warning)"
            ></i>
            <i
              v-else-if="item.severity === 'error'"
              class="pi pi-times-circle"
              style="color: var(--russ-error)"
            ></i>
            <i
              v-else-if="item.severity === 'secondary'"
              class="pi pi-circle"
              style="color: var(--russ-text-tertiary)"
            ></i>
            <i
              v-else-if="item.severity === 'contrast'"
              class="pi pi-circle-fill"
              style="color: var(--russ-text-quaternary)"
            ></i>
            <i
              v-else
              class="pi pi-bell"
              style="color: var(--russ-text-tertiary)"
            ></i>

            <div class="notification-title" v-html="item.summary"></div>

            <i
              class="pi pi-times remove_icon"
              @click="deleteNotification(item.id)"
            ></i>
          </div>

          <div class="notification-content" v-html="item.detail"></div>
        </div>
        
        <div v-if="!notifications || !notifications.length" class="no-notifications">
          Нет уведомлений
        </div>
      </div>
    </Drawer>
  </div>
</template>

<style scoped>
.notification-drawer {
  width: 30rem !important;
}

.notification-wrapper .notification {
  margin-bottom: 15px;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 2px 8px var(--russ-shadow-color);
  transition: all 0.2s ease;
}

.notification-wrapper .notification:hover {
  
  box-shadow: 0 4px 12px var(--russ-shadow-color);
}

.notification-success {
  background-color: var(--russ-success-light);
  border: 1px solid var(--russ-success);
  border-left: 4px solid var(--russ-success);
}

.notification-info {
  background-color: var(--russ-info-light);
  border: 1px solid var(--russ-accent-light);
  border-left: 4px solid var(--russ-accent-light);
}

.notification-warn {
  background-color: var(--russ-warning-light);
  border: 1px solid var(--russ-warning);
  border-left: 4px solid var(--russ-warning);
}

.notification-error {
  background-color: var(--russ-error-light);
  border: 1px solid var(--russ-error);
  border-left: 4px solid var(--russ-error);
}

.notification-secondary {
  background-color: var(--russ-bg-disabled);
  border: 1px solid var(--russ-text-tertiary);
  border-left: 4px solid var(--russ-text-tertiary);
}

.notification-contrast {
  background-color: var(--russ-bg-dark);
  border: 1px solid var(--russ-text-secondary);
  border-left: 4px solid var(--russ-text-secondary);
}

.notification-contrast .notification-title {
  color: var(--russ-text-inverse);
}

.notification-contrast .notification-content {
  color: var(--russ-text-light);
}

.notification-header {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}

.remove_icon {
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  color: var(--russ-text-tertiary);
}

.remove_icon:hover {
  background-color: var(--russ-bg-disabled);
  color: var(--russ-text-secondary);
}

.notification-title {
  flex: 1;
  font-size: 16px;
  font-weight: 500;
  color: var(--russ-text-primary);
}

.notification-content {
  font-size: 14px;
  color: var(--russ-text-secondary);
}

.notification-header-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.clear-all-btn {
  background: transparent;
  color: var(--russ-primary);
  border: 1px solid var(--russ-primary);
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
}

.clear-all-btn:hover {
  background-color: var(--russ-primary);
  color: var(--russ-text-inverse);
}

.no-notifications {
  color: var(--russ-text-quaternary);
  text-align: center;
  padding: 20px;
  font-size: 14px;
}
</style>
