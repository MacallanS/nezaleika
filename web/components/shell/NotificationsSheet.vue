<template>
  <RrBottomSheet
    v-model="open"
    title="Напоминания"
    subtitle="Что полить и когда пинговать"
    height-mode="fit"
    :height-percent="88"
    placement="sheet"
  >
    <div class="nz-notif">
      <div class="nz-notif__stats">
        <div class="nz-notif__stat" :class="{ 'is-hot': overdue.length }">
          <strong>{{ overdue.length }}</strong>
          <span>просрочено</span>
        </div>
        <div class="nz-notif__stat">
          <strong>{{ todayLeft }}</strong>
          <span>сегодня</span>
        </div>
        <div class="nz-notif__stat" :class="{ 'is-on': prefs.enabled }">
          <strong>{{ prefs.enabled ? prefs.remind_time : 'выкл' }}</strong>
          <span>время</span>
        </div>
      </div>

      <section v-if="overdue.length" class="nz-card">
        <h3 class="nz-card__title">Нужно полить</h3>
        <button
          v-for="p in overdue"
          :key="p.id"
          type="button"
          class="nz-setting nz-notif__plant"
          @click="openPlant(p.id)"
        >
          <span
            class="nz-notif__thumb"
            :style="p.photo_url ? { backgroundImage: `url(${p.photo_url})` } : undefined"
            aria-hidden="true"
          />
          <span class="nz-notif__plant-text">
            <strong>{{ p.name }}</strong>
            <span>{{ p.room || 'Без комнаты' }}</span>
          </span>
          <span class="nz-notif__chev" aria-hidden="true">›</span>
        </button>
      </section>

      <section class="nz-card" aria-label="Настройки">
        <h3 class="nz-card__title">Настройки</h3>
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
      </section>

      <section class="nz-card nz-card--pad nz-notif__actions">
        <div class="nz-notif__push" :class="{ 'is-ok': pushReady }">
          <span class="nz-notif__dot" aria-hidden="true" />
          <span>{{ pushReady ? 'Push на этом телефоне включён' : 'Push ещё не подключён' }}</span>
        </div>
        <AuthRRButton v-if="pushSupported && !pushReady" @click="onEnable">
          Подключить на этом телефоне
        </AuthRRButton>
        <AuthRRButton variant="neutral-secondary" @click="onTest">Проверить уведомление</AuthRRButton>
        <p class="nz-hint">На iPhone сначала добавьте приложение на экран «Домой».</p>
      </section>
    </div>
  </RrBottomSheet>
</template>

<script setup lang="ts">
import { AuthRRButton, RrBottomSheet } from 'bibli/shared/ui/rr'
import { notify } from '~/utils/toast'
import { addDays, isoDate, parseIsoDate } from '~/utils/dates'

const plants = usePlantsStore()
const { open, hide } = useNotificationsPanel()
const { prefs, loaded, load, save } = useNotificationPrefs()
const { supported: pushSupported, subscribe, sendTest } = useWebPush()
const pushReady = ref(false)

const overdue = computed(() => {
  const cal = plants.calendar
  if (!cal) return []
  const ids = cal.days[cal.today]?.overdue ?? []
  return ids
    .map((id) => cal.plants[String(id)])
    .filter(Boolean)
    .map((p) => p!)
})

const todayLeft = computed(() => {
  const cal = plants.calendar
  if (!cal) return 0
  const day = cal.days[cal.today]
  if (!day) return 0
  const pending = new Set([...(day.overdue ?? []), ...(day.planned ?? [])])
  for (const id of day.done ?? []) pending.delete(id)
  return pending.size
})

watch(open, async (v) => {
  if (!v) return
  try {
    if (!loaded.value) await load()
  } catch {
    /* ignore */
  }
  if (!plants.calendar) {
    const today = isoDate(new Date())
    void plants.fetchCalendar(today, isoDate(addDays(parseIsoDate(today), 14)))
  }
  if (pushSupported && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready
      pushReady.value = Boolean(await reg.pushManager.getSubscription())
    } catch {
      pushReady.value = false
    }
  }
})

async function onSave() {
  try {
    await save()
  } catch {
    /* toast already */
  }
}

async function onEnable() {
  const ok = await subscribe()
  pushReady.value = ok
  if (ok) {
    prefs.value.enabled = true
    await onSave()
  }
  notify(ok ? 'Напоминания подключены' : 'Не удалось подключить напоминания', ok ? 'success' : 'warn')
}

async function onTest() {
  const result = await sendTest()
  if (result.ok) notify('Проверочное уведомление отправлено')
  else notify(result.detail || 'Сначала подключите push', 'warn')
}

function openPlant(id: number) {
  hide()
  void navigateTo(`/plants/${id}`)
}
</script>

<style scoped>
.nz-notif {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 8px;
}
.nz-notif__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.nz-notif__stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px;
  border-radius: 14px;
  background: var(--rr-backgrounds-quaternary, #f2f3f7);
}
.nz-notif__stat strong {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--rr-labels-neutral-primary, #101012);
}
.nz-notif__stat span {
  font-size: 12px;
  font-weight: 600;
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
}
.nz-notif__stat.is-hot strong {
  color: #c62828;
}
.nz-notif__stat.is-on strong {
  color: #2e7d32;
}
.nz-notif__plant {
  gap: 12px;
}
.nz-notif__thumb {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #c8e6c9, #66bb6a) center / cover;
  flex: 0 0 auto;
}
.nz-notif__plant-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;
}
.nz-notif__plant-text strong {
  font-size: 15px;
  font-weight: 650;
}
.nz-notif__plant-text span {
  font-size: 12px;
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
}
.nz-notif__chev {
  color: #9aa5ad;
  font-size: 22px;
  line-height: 1;
}
.nz-notif__actions {
  gap: 10px;
}
.nz-notif__push {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
}
.nz-notif__push.is-ok {
  color: #2e7d32;
}
.nz-notif__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #c5ced4;
}
.nz-notif__push.is-ok .nz-notif__dot {
  background: #2e7d32;
  box-shadow: 0 0 0 4px rgba(46, 125, 50, 0.16);
}
</style>
