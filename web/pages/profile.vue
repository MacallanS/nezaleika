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
import { AuthRRButton, AuthRRInputText } from 'bibli/shared/ui/rr'
import { notify } from '~/utils/toast'

const auth = useAuthStore()
const { prefs, load, save } = useNotificationPrefs()
const { show: openNotif } = useNotificationsPanel()
const { supported: pushSupported, subscribe, sendTest } = useWebPush()

const nickname = ref(auth.user?.first_name || '')
const saving = ref(false)
const localPreview = ref('')

const displayName = computed(() => auth.user?.first_name || auth.user?.username || 'Профиль')
const initials = computed(() => (displayName.value.trim().slice(0, 1) || 'Н').toUpperCase())
const avatarSrc = computed(() => localPreview.value || auth.user?.avatar_url || '')
const nameDirty = computed(() => nickname.value.trim() !== (auth.user?.first_name || '').trim())

usePageChrome(() => ({
  title: 'Профиль',
  description: 'Имя, фото и напоминания',
}))

watch(
  () => auth.user?.first_name,
  (v) => {
    if (!nameDirty.value) nickname.value = v || ''
  },
)

onMounted(() => {
  nickname.value = auth.user?.first_name || ''
  void load().catch(() => notify('Не удалось загрузить настройки', 'warn'))
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

async function enablePush() {
  const result = await subscribe()
  if (result.ok) {
    prefs.value.enabled = true
    await onSave()
    notify('Напоминания подключены')
  } else {
    notify(result.detail, 'warn')
  }
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
  inset: 0;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
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
</style>
