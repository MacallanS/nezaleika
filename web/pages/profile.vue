<template>
  <div class="nz-page nz-page--form profile">
    <section class="nz-card profile__hero">
      <div class="profile__avatar" aria-hidden="true">{{ initials }}</div>
      <div class="profile__who">
        <strong>{{ displayName }}</strong>
        <span>{{ auth.user?.username || 'семья' }}</span>
      </div>
    </section>

    <section class="nz-card" aria-label="Уведомления">
      <h2 class="nz-card__title">Уведомления</h2>
      <label class="nz-setting">
        <span>Напоминания</span>
        <input v-model="prefs.enabled" class="nz-switch" type="checkbox" @change="onSave" />
      </label>
      <label class="nz-setting" :class="{ 'is-off': !prefs.enabled }">
        <span>Время</span>
        <input
          v-model="prefs.remind_time"
          class="nz-time"
          type="time"
          :disabled="!prefs.enabled"
          @change="onSave"
        />
      </label>
      <button type="button" class="nz-setting" @click="openNotif">
        <span>Статус и push</span>
        <span class="profile__chev" aria-hidden="true">›</span>
      </button>
    </section>

    <section class="nz-card nz-card--pad profile__actions">
      <AuthRRButton v-if="pushSupported" @click="enablePush">Подключить на этом телефоне</AuthRRButton>
      <AuthRRButton variant="neutral-secondary" @click="testPush">Проверить уведомление</AuthRRButton>
      <p class="nz-hint">На iPhone сначала добавьте приложение на экран «Домой», потом включите напоминания.</p>
    </section>

    <section class="nz-card">
      <button type="button" class="nz-setting nz-setting--danger" @click="logout">Выйти</button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { AuthRRButton } from 'bibli/shared/ui/rr'
import { notify } from '~/utils/toast'

const auth = useAuthStore()
const { prefs, load, save } = useNotificationPrefs()
const { show: openNotif } = useNotificationsPanel()
const { supported: pushSupported, subscribe, sendTest } = useWebPush()

const displayName = computed(() => auth.user?.first_name || auth.user?.username || 'Профиль')
const initials = computed(() => (displayName.value.trim().slice(0, 1) || 'Н').toUpperCase())

usePageChrome(() => ({
  title: 'Профиль',
  description: 'Настройки и напоминания',
}))

onMounted(() => {
  void load().catch(() => notify('Не удалось загрузить настройки', 'warn'))
})

async function onSave() {
  try {
    await save()
  } catch {
    /* toast already */
  }
}

async function enablePush() {
  const ok = await subscribe()
  if (ok) {
    prefs.value.enabled = true
    await onSave()
  }
  notify(ok ? 'Напоминания подключены' : 'Не удалось подключить напоминания', ok ? 'success' : 'warn')
}

async function testPush() {
  const result = await sendTest()
  if (result.ok) notify('Проверочное уведомление отправлено')
  else notify(result.detail || 'Уведомление не отправилось', 'warn')
}

async function logout() {
  await auth.logout()
  await navigateTo('/login')
}
</script>

<style scoped>
.profile {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.profile__hero {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
}
.profile__avatar {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: linear-gradient(145deg, #c8e6c9, #2e7d32);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 800;
}
.profile__who {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.profile__who strong {
  font-size: 18px;
  font-weight: 750;
}
.profile__who span {
  font-size: 13px;
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
}
.profile__chev {
  color: #9aa5ad;
  font-size: 22px;
  line-height: 1;
}
.profile__actions {
  gap: 10px;
}
</style>
