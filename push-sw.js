function scopedUrl(path) {
  return new URL(String(path || '').replace(/^\//, ''), self.registration.scope).href
}

self.addEventListener('push', (event) => {
  let payload = { title: 'Незалейка', body: '', url: '/', image: null }
  try {
    if (event.data) {
      payload = { ...payload, ...event.data.json() }
    }
  } catch {
    /* ignore */
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: scopedUrl('icons/icon-192.png'),
      badge: scopedUrl('icons/icon-192.png'),
      tag: payload.tag || 'nezaleika-today',
      renotify: true,
      image: payload.image || undefined,
      data: { url: scopedUrl(payload.url || '/') },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || self.registration.scope
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
