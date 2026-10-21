<template>
  <div class="nz-page profile">
    <NzHeader title="Профиль" :subtitle="displayName" />

    <div class="nz-body">
      <section class="nz-card" aria-label="Уведомления">
        <h2 class="nz-card__title">Уведомления</h2>
        <label class="nz-setting">
          <span>Напоминания</span>
          <input v-model="prefs.enabled" class="nz-switch" type="checkbox" @change="savePrefs()" />
        </label>
        <label class="nz-setting" :class="{ 'is-off': !prefs.enabled }">
          <span>Время</span>
          <input
            v-model="prefs.remind_time"
            class="nz-time"
            type="time"
            :disabled="!prefs.enabled"
            @change="savePrefs()"
          />
        </label>
      </section>

      <section class="nz-card nz-card--pad">
        <AuthRRButton v-if="pushSupported" @click="enablePush">Подключить на этом телефоне</AuthRRButton>
        <AuthRRButton variant="neutral-secondary" @click="testPush">Проверить уведомление</AuthRRButton>
        <p class="nz-hint">На iPhone сначала добавьте приложение на экран «Домой», потом включите напоминания.</p>
      </section>

      <section class="nz-card">
        <button type="button" class="nz-setting nz-setting--danger" @click="logout">Выйти</button>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AuthRRButton } from 'bibli/shared/ui/rr'
import NzHeader from '~/components/planner/NzHeader.vue'
import { ensureAuth, getApi } from '~/utils/api'
import { notify } from '~/utils/toast'

const auth = useAuthStore()
const { supported: pushSupported, subscribe, sendTest } = useWebPush()

const prefs = reactive({
  enabled: true,
  remind_time: '09:00',
  timezone_name: 'Europe/Moscow',
  only_urgent: true,
})

const displayName = computed(() => auth.user?.first_name || auth.user?.username || '')

onMounted(async () => {
  await ensureAuth()
  const { data } = await getApi().get('/api/me/notification-prefs')
  Object.assign(prefs, data)
  prefs.remind_time = String(prefs.remind_time).slice(0, 5)
})

function deviceTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || prefs.timezone_name
  } catch {
    return prefs.timezone_name
  }
}

async function savePrefs() {
  await ensureAuth()
  prefs.timezone_name = deviceTimezone()
  try {
    await getApi().patch('/api/me/notification-prefs', prefs)
  } catch {
    notify('Не удалось сохранить настройки', 'warn')
  }
}

async function enablePush() {
  const ok = await subscribe()
  if (ok) {
    prefs.enabled = true
    await savePrefs()
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
  min-height: 100%;
}
</style>
