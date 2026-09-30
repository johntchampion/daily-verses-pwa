/// <reference lib="webworker" />

// Under injectManifest these are ours to do: skipWaiting/clientsClaim, the
// navigation fallback and cleanupOutdatedCaches. Each fails quietly if dropped.

import { clientsClaim } from 'workbox-core'
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare let self: ServiceWorkerGlobalScope

self.skipWaiting()
clientsClaim()

const manifest = self.__WB_MANIFEST

precacheAndRoute(manifest)
cleanupOutdatedCaches()

// The manifest is empty under `vite dev`, and createHandlerBoundToURL would throw.
if (manifest.length > 0) {
  registerRoute(
    new NavigationRoute(createHandlerBoundToURL('index.html'), {
      denylist: [/^\/api\//, /^\/auth\//],
    }),
  )
}

interface ReminderPayload {
  title?: string
  body?: string
  url?: string
  tag?: string
}

// Every push must show a notification, or Chrome may revoke the permission.
self.addEventListener('push', (event) => {
  let data: ReminderPayload = {}
  try {
    data = event.data ? (event.data.json() as ReminderPayload) : {}
  } catch {
    // Not JSON; fall back to the default copy.
  }

  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Time to practice', {
      body: data.body ?? 'Your verses are waiting.',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag ?? 'daily-reminder',
      data: { url: data.url ?? '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const data = event.notification.data as { url?: string } | undefined
  const url = data?.url ?? '/'

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      for (const client of windows) {
        if (new URL(client.url).origin !== self.location.origin) continue
        await client.focus()
        if ('navigate' in client) await client.navigate(url)
        return
      }
      await self.clients.openWindow(url)
    })(),
  )
})
