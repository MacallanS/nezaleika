import { ensureAuth, getApi } from '~/utils/api'
import { notify } from '~/utils/toast'

export type NotificationPrefs = {
  enabled: boolean
  remind_time: string
  timezone_name: string
  only_urgent: boolean
  season_alerts: boolean
}

const DEFAULTS: NotificationPrefs = {
  enabled: true,
  remind_time: '09:00',
  timezone_name: 'Europe/Moscow',
  only_urgent: true,
  season_alerts: true,
}

export function useNotificationPrefs() {
  const prefs = useState<NotificationPrefs>('nz-notif-prefs', () => ({ ...DEFAULTS }))
  const loaded = useState('nz-notif-prefs-loaded', () => false)

  function deviceTimezone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || prefs.value.timezone_name
    } catch {
      return prefs.value.timezone_name
    }
  }

  async function load() {
    await ensureAuth()
    const { data } = await getApi().get<NotificationPrefs>('/api/me/notification-prefs')
    prefs.value = {
      ...DEFAULTS,
      ...data,
      remind_time: String(data.remind_time || DEFAULTS.remind_time).slice(0, 5),
    }
    loaded.value = true
  }

  async function save() {
    await ensureAuth()
    prefs.value.timezone_name = deviceTimezone()
    try {
      await getApi().patch('/api/me/notification-prefs', prefs.value)
    } catch {
      notify('Не удалось сохранить настройки', 'warn')
      throw new Error('save failed')
    }
  }

  return { prefs, loaded, load, save, deviceTimezone }
}
