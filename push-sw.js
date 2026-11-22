function scopedUrl(path) {
  return new URL(String(path || '').replace(/^\//, ''), self.registration.scope).href
}

self.addEventListener('push', (event) => {
  let payload = { title: 'Незалейка', body: '', url: '/', image: null, tag: 'nezaleika-today' }
  try {
    if (event.data) {
      payload = { ...payload, ...event.data.json() }
    }
  } catch {
    /* ignore */
  }
  const hasPlants = Array.isArray(payload.plant_ids) && payload.plant_ids.length > 0
  const actions = [
    { action: 'open', title: 'Открыть' },
  ]
  if (hasPlants && payload.tag !== 'nezaleika-season' && payload.tag !== 'nezaleika-test') {
    actions.push({ action: 'watered', title: 'К поливу' })
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: scopedUrl('icons/icon-192.png'),
      badge: scopedUrl('icons/icon-192.png'),
      tag: payload.tag || 'nezaleika-today',
      renotify: true,
      image: payload.image || undefined,
      actions,
      data: {
        url: scopedUrl(payload.url || '/'),
        plant_ids: payload.plant_ids || [],
      },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const action = event.action || 'open'
  let url = event.notification.data?.url || self.registration.scope
  if (action === 'watered') {
    // Deep-link into the today board; watering stays in-app (no token in SW).
    url = scopedUrl('/?focus=water')
  }
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.registration.scope) && 'focus' in client) {
          if ('navigate' in client) client.navigate(url)
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }
    }),
  )
})
