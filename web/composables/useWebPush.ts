import { ensureAuth, getApi } from '~/utils/api'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; ++i) arr[i] = raw.charCodeAt(i)
  return arr
}

export function useWebPush() {
  const supported = import.meta.client && 'serviceWorker' in navigator && 'PushManager' in window

  async function subscribe() {
    if (!supported) return false
    await ensureAuth()
    const { data } = await getApi().get<{ publicKey: string }>('/api/push/vapid-public-key')
    if (!data.publicKey) {
      console.warn('[push] VAPID public key not configured')
      return false
    }
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.publicKey),
    })
    const json = sub.toJSON()
    await getApi().post('/api/push/subscribe', {
      endpoint: json.endpoint,
      keys: json.keys,
    })
    return true
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

  return { supported, subscribe, sendTest }
}
