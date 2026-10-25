<template>
  <div class="nz-page nz-page--form profile">
    <section class="nz-card nz-card--pad profile__hero">
      <label class="profile__avatar" :class="{ 'profile__avatar--photo': !!avatarSrc }">
        <input type="file" accept="image/*" class="profile__avatar-file" @change="onAvatar" />
        <img v-if="avatarSrc" :src="avatarSrc" alt="" class="profile__avatar-img" />
        <span v-else aria-hidden="true">{{ initials }}</span>
        <span class="profile__avatar-badge">Фото</span>
      </label>

      <div class="profile__who">
        <AuthRRInputText v-model="nickname" label="Имя" placeholder="Как вас зовут" />
        <p class="profile__login">Логин: {{ auth.user?.username || '—' }}</p>
        <div class="profile__hero-actions">
          <AuthRRButton
            type="button"
            :disabled="saving || !nickname.trim() || !nameDirty"
            @click="saveName"
          >
            {{ saving ? 'Сохраняем…' : 'Сохранить имя' }}
          </AuthRRButton>
          <button
            v-if="auth.user?.avatar_url"
            type="button"
            class="profile__clear"
            :disabled="saving"
            @click="clearAvatar"
          >
            Убрать фото
          </button>
        </div>
      </div>
    </section>

    <section class="nz-card" aria-label="Уведомления">
      <h2 class="nz-card__title">Уведомления</h2>
      <div class="profile__push-status" :class="{ 'is-ok': pushReady, 'is-bad': pushBlocked }">
        <span class="profile__push-dot" aria-hidden="true" />
        <span>{{ pushStatusText }}</span>
      </div>
      <label class="nz-setting">
        <span>Напоминания</span>
        <input v-model="prefs.enabled" class="nz-switch" type="checkbox" @change="onToggleEnabled" />
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
        <span>Что полить сегодня</span>
        <span class="profile__chev" aria-hidden="true">›</span>
      </button>
    </section>

    <section class="nz-card nz-card--pad profile__actions">
      <AuthRRButton v-if="!pushReady" :disabled="pushBusy" @click="enablePush">
        {{ pushBusy ? 'Подключаем…' : 'Подключить push на этом телефоне' }}
      </AuthRRButton>
      <AuthRRButton variant="neutral-secondary" :disabled="pushBusy" @click="testPush">
        Проверить уведомление
      </AuthRRButton>
      <p class="nz-hint">{{ pushHint }}</p>
    </section>

    <section class="nz-card">
      <button type="button" class="nz-setting nz-setting--danger" @click="logout">Выйти</button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { AuthRRButton, AuthRRInputText } from 'bibli/shared/ui/rr'
import { notify } from '~/utils/toast'

const auth = useAuthStore()
const { prefs, load, save } = useNotificationPrefs()
const { show: openNotif } = useNotificationsPanel()
const { supported: pushSupported, isIosSafari, isStandalone, subscribe, sendTest, refreshStatus } =
  useWebPush()

const nickname = ref(auth.user?.first_name || '')
const saving = ref(false)
const localPreview = ref('')
const pushBusy = ref(false)
const pushReady = ref(false)
const pushBlocked = ref(false)
const pushStatusText = ref('Проверяем push…')
const pushHint = ref('На iPhone: Поделиться → На экран «Домой», откройте иконку и подключите push.')

const displayName = computed(() => auth.user?.first_name || auth.user?.username || 'Профиль')
const initials = computed(() => (displayName.value.trim().slice(0, 1) || 'Н').toUpperCase())
const avatarSrc = computed(() => localPreview.value || auth.user?.avatar_url || '')
const nameDirty = computed(() => nickname.value.trim() !== (auth.user?.first_name || '').trim())

usePageChrome(() => ({
  title: 'Профиль',
}))

watch(
  () => auth.user?.first_name,
  (v) => {
    if (!nameDirty.value) nickname.value = v || ''
  },
)

async function refreshPushUi() {
  const st = await refreshStatus()
  pushReady.value = st.subscribed && (st.serverSubscriptions == null || st.serverSubscriptions > 0)
  pushBlocked.value = Boolean(isIosSafari() && !st.standalone)
  if (!st.supported) {
    pushStatusText.value = 'Браузер не поддерживает push'
    pushHint.value = 'Откройте Незалейку в Safari и добавьте на экран «Домой».'
  } else if (isIosSafari() && !st.standalone) {
    pushStatusText.value = 'Нужно приложение на экране «Домой»'
    pushHint.value = 'Safari → Поделиться → На экран «Домой». Потом откройте иконку и нажмите «Подключить push».'
  } else if (st.vapidConfigured === false) {
    pushStatusText.value = 'Сервер push не настроен'
    pushHint.value = 'Напишите нам — на сервере нет VAPID-ключей.'
  } else if (pushReady.value) {
    pushStatusText.value = 'Push на этом телефоне включён'
    pushHint.value = `Ежедневное напоминание около ${prefs.value.remind_time}. Кнопка ниже отправит тест сразу.`
  } else if (st.permission === 'denied') {
    pushStatusText.value = 'Уведомления запрещены в системе'
    pushHint.value = 'Разрешите уведомления для Незалейки в настройках iPhone → Незалейка.'
  } else {
    pushStatusText.value = 'Push ещё не подключён'
    pushHint.value = pushSupported
      ? 'Нажмите «Подключить push» и разрешите уведомления.'
      : 'Этот браузер не умеет push.'
  }
}

onMounted(() => {
  nickname.value = auth.user?.first_name || ''
  void load()
    .then(() => refreshPushUi())
    .catch(() => notify('Не удалось загрузить настройки', 'warn'))
})

onBeforeUnmount(() => {
  if (localPreview.value) URL.revokeObjectURL(localPreview.value)
})

async function onSave() {
  try {
    await save()
  } catch {
    /* toast already */
  }
}

async function saveName() {
  const name = nickname.value.trim()
  if (!name || saving.value) return
  saving.value = true
  try {
    await auth.updateProfile({ first_name: name })
    notify('Имя сохранено')
  } catch {
    notify('Не удалось сохранить имя', 'error')
  } finally {
    saving.value = false
  }
}

async function onAvatar(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || saving.value) return
  if (localPreview.value) URL.revokeObjectURL(localPreview.value)
  localPreview.value = URL.createObjectURL(file)
  saving.value = true
  try {
    await auth.updateProfile({ avatar: file })
    notify('Фото обновлено')
  } catch {
    notify('Не удалось загрузить фото', 'error')
  } finally {
    if (localPreview.value) {
      URL.revokeObjectURL(localPreview.value)
      localPreview.value = ''
    }
    saving.value = false
  }
}

async function clearAvatar() {
  if (saving.value) return
  saving.value = true
  try {
    await auth.updateProfile({ clearAvatar: true })
    notify('Фото убрано')
  } catch {
    notify('Не удалось убрать фото', 'error')
  } finally {
    saving.value = false
  }
}

async function onToggleEnabled() {
  await onSave()
  if (prefs.value.enabled && !pushReady.value) {
    await enablePush()
  }
}

async function enablePush() {
  if (pushBusy.value) return
  pushBusy.value = true
  try {
    const result = await subscribe()
    if (result.ok) {
      prefs.value.enabled = true
      await onSave()
      notify('Напоминания подключены')
    } else {
      notify(result.detail, 'warn')
    }
  } finally {
    pushBusy.value = false
    await refreshPushUi()
  }
}

async function testPush() {
  if (pushBusy.value) return
  pushBusy.value = true
  try {
    if (!pushReady.value) {
      const connected = await subscribe()
      if (!connected.ok) {
        notify(connected.detail, 'warn')
        return
      }
      prefs.value.enabled = true
      await onSave()
    }
    const result = await sendTest()
    if (result.ok) notify('Проверочное уведомление отправлено — смотрите шторку')
    else notify(result.detail || 'Уведомление не отправилось', 'warn')
  } finally {
    pushBusy.value = false
    await refreshPushUi()
  }
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
  padding-bottom: 24px;
}
.profile__hero {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}
.profile__avatar {
  position: relative;
  flex: 0 0 auto;
  width: 72px;
  height: 72px;
  margin: 0;
  border-radius: 20px;
  overflow: hidden;
  background: linear-gradient(145deg, #c8e6c9, #2e7d32);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 800;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.profile__avatar--photo {
  background: #d7e6da;
}
.profile__avatar-file {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
  opacity: 0;
}
.profile__avatar-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.profile__avatar-badge {
  position: absolute;
  left: 50%;
  bottom: 6px;
  z-index: 3;
  transform: translateX(-50%);
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(16, 16, 18, 0.7);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  pointer-events: none;
  white-space: nowrap;
}
.profile__who {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.profile__login {
  margin: 0;
  font-size: 13px;
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
}
.profile__hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.profile__clear {
  border: none;
  background: transparent;
  padding: 8px 4px;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  color: #7b868c;
  cursor: pointer;
}
.profile__chev {
  color: #9aa5ad;
  font-size: 22px;
  line-height: 1;
}
.profile__actions {
  gap: 10px;
}
.profile__push-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 16px 4px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f2f3f7;
  font-size: 13px;
  font-weight: 600;
  color: #5f6b70;
}
.profile__push-status.is-ok {
  background: #e8f5e9;
  color: #1b5e20;
}
.profile__push-status.is-bad {
  background: #fff3e0;
  color: #e65100;
}
.profile__push-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  flex: 0 0 auto;
}
</style>
