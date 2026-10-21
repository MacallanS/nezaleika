<template>
  <div class="nz-page profile">
    <header class="head">
      <h1>Профиль</h1>
      <p v-if="auth.user">{{ auth.user.first_name || auth.user.username }}</p>
    </header>

    <section class="panel">
      <h2>Уведомления</h2>
      <label class="row">
        <input v-model="prefs.enabled" type="checkbox" @change="savePrefs()" />
        Push-напоминания
      </label>
      <AuthRRField label="Время">
        <input v-model="prefs.remind_time" type="time" class="time" @change="savePrefs()" />
      </AuthRRField>
      <AuthRRButton v-if="pushSupported" class="full" @click="enablePush">
        Подключить push на этом устройстве
      </AuthRRButton>
      <AuthRRButton class="full mt" @click="testPush">
        Тестовое уведомление
      </AuthRRButton>
      <p class="hint">На iPhone: добавьте приложение на экран «Домой», затем включите push.</p>
    </section>

    <AuthRRButton class="logout full" @click="logout">Выйти</AuthRRButton>
  </div>
</template>

<script setup lang="ts">
import { AuthRRButton, AuthRRField } from 'bibli/shared/ui/rr'
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

async function savePrefs(silent = false) {
  await ensureAuth()
  prefs.timezone_name = deviceTimezone()
  try {
    await getApi().patch('/api/me/notification-prefs', prefs)
    if (!silent) notify('Сохранено', 'success')
  } catch {
    notify('Не удалось сохранить настройки', 'warn')
  }
}

async function enablePush() {
  const ok = await subscribe()
  if (ok) await savePrefs(true)
  notify(ok ? 'Push подключён' : 'Не удалось подключить push', ok ? 'success' : 'warn')
}

async function testPush() {
  const result = await sendTest()
  if (result.ok) notify('Тестовое уведомление отправлено')
  else notify(result.detail || 'Ошибка push', 'warn')
}

async function logout() {
  await auth.logout()
  await navigateTo('/login')
}
</script>

<style scoped>
.profile {
  min-height: 100%;
  background: #f4f6f5;
}
.head {
  padding: calc(env(safe-area-inset-top, 0px) + 18px) 20px 14px;
}
.head h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.head p {
  margin: 2px 0 0;
  color: #7b868c;
}
.panel {
  margin: 0 12px;
  padding: 16px;
  background: #fff;
  border-radius: 16px;
}
.row {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
}
.time {
  width: 100%;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #ddd;
}
.full {
  width: 100%;
}
.mt {
  margin-top: 8px;
}
.hint {
  font-size: 12px;
  color: #666;
  margin-top: 12px;
}
.logout {
  margin: 24px 16px;
}
</style>
