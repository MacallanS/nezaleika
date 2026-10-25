import { ensureAuth, getApi } from '~/utils/api'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; ++i) arr[i] = raw.charCodeAt(i)
  return arr
}

export type PushSubscribeResult = { ok: true } | { ok: false; detail: string }

export type PushDeviceStatus = {
  supported: boolean
  standalone: boolean
  permission: NotificationPermission | 'unsupported'
  subscribed: boolean
  vapidConfigured: boolean | null
  serverSubscriptions: number | null
}

export function useWebPush() {
  const supported = import.meta.client && 'serviceWorker' in navigator && 'PushManager' in window

  function isIosSafari() {
    if (!import.meta.client) return false
    const ua = navigator.userAgent
    const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    return iOS && !(window as Window & { MSStream?: unknown }).MSStream
  }

  function isStandalone() {
    if (!import.meta.client) return false
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    )
  }

  async function getLocalSubscription(): Promise<PushSubscription | null> {
    if (!supported) return null
    try {
      const reg = await navigator.serviceWorker.ready
      return (await reg.pushManager.getSubscription()) ?? null
    } catch {
      return null
    }
  }

  async function refreshStatus(): Promise<PushDeviceStatus> {
    const status: PushDeviceStatus = {
      supported: Boolean(supported),
      standalone: isStandalone(),
      permission: supported && 'Notification' in window ? Notification.permission : 'unsupported',
      subscribed: false,
      vapidConfigured: null,
      serverSubscriptions: null,
    }
    if (supported) {
      status.subscribed = Boolean(await getLocalSubscription())
    }
    try {
      await ensureAuth()
      const { data } = await getApi().get<{
        vapid_configured: boolean
        subscriptions: number
      }>('/api/push/status')
      status.vapidConfigured = data.vapid_configured
      status.serverSubscriptions = data.subscriptions
    } catch {
      /* ignore */
    }
    return status
  }

  async function subscribe(): Promise<PushSubscribeResult> {
    if (!supported) {
      if (isIosSafari() && !isStandalone()) {
        return { ok: false, detail: 'На iPhone: Поделиться → На экран «Домой», откройте иконку, затем подключите push.' }
      }
      return { ok: false, detail: 'Этот браузер не поддерживает push-уведомления.' }
    }
    if (isIosSafari() && !isStandalone()) {
      return { ok: false, detail: 'На iPhone push работает только из приложения на экране «Домой».' }
    }
    await ensureAuth()
    const { data } = await getApi().get<{ publicKey: string }>('/api/push/vapid-public-key')
    if (!data.publicKey) {
      return { ok: false, detail: 'Push не настроен на сервере (нет VAPID-ключа).' }
    }
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return { ok: false, detail: 'Разрешите уведомления в настройках телефона для Незалейки.' }
    }
    try {
      const reg = await navigator.serviceWorker.ready
      const options = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey),
      }
      let sub: PushSubscription
      try {
        sub = await reg.pushManager.subscribe(options)
      } catch {
        await (await reg.pushManager.getSubscription())?.unsubscribe()
        sub = await reg.pushManager.subscribe(options)
      }
      const json = sub.toJSON()
      await getApi().post('/api/push/subscribe', {
        endpoint: json.endpoint,
        keys: json.keys,
      })
      return { ok: true }
    } catch (e) {
      console.warn('[push] subscribe failed', e)
      if (isIosSafari() && !isStandalone()) {
        return { ok: false, detail: 'На iPhone сначала добавьте приложение на экран «Домой».' }
      }
      return { ok: false, detail: 'Не удалось подключить push на этом устройстве.' }
    }
  }

  async function sendTest() {
    await ensureAuth()
    try {
      await getApi().post('/api/push/test')
      return { ok: true as const }
    } catch (e: unknown) {
      const detail =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined
      return { ok: false as const, detail: detail || 'Сначала подключите push на этом устройстве.' }
    }
  }

  return {
    supported,
    isIosSafari,
    isStandalone,
    subscribe,
    sendTest,
    refreshStatus,
    getLocalSubscription,
  }
}
