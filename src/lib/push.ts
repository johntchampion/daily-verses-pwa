import { api } from '../api/client'

export function pushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function notificationPermission(): NotificationPermission | null {
  return 'Notification' in window ? Notification.permission : null
}

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true
  )
}

/** iPadOS reports itself as a Mac, hence the touch-point check. */
export function isIos(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const standard = padded.replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(standard)
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i)
  return bytes
}

export class PermissionRefused extends Error {
  readonly permission: NotificationPermission

  constructor(permission: NotificationPermission) {
    super(
      permission === 'denied'
        ? 'Notifications are blocked in your browser settings.'
        : 'Notifications need your permission.',
    )
    this.permission = permission
  }
}

function subscribedWithKey(
  subscription: PushSubscription,
  key: Uint8Array,
): boolean {
  const existing = subscription.options.applicationServerKey
  if (!existing) return false
  const bytes = new Uint8Array(existing)
  return (
    bytes.length === key.length && bytes.every((byte, i) => byte === key[i])
  )
}

/** Asks for permission and subscribes this browser, without touching the
    account's reminder preference. */
export async function enableThisDevice(): Promise<void> {
  // Must come before any other await: Safari needs the user gesture on the stack.
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new PermissionRefused(permission)

  await subscribeThisBrowser()
}

export async function enablePush(): Promise<void> {
  await enableThisDevice()
  await api.updateProfile({ remindersEnabled: true })
}

/** Replaces a subscription made with a different server key. Safe to call on
    every load: the server upserts, restoring any row it pruned. */
export async function subscribeThisBrowser(): Promise<void> {
  const { publicKey } = await api.pushKey()
  const key = urlBase64ToUint8Array(publicKey)
  const registration = await navigator.serviceWorker.ready

  let subscription = await registration.pushManager.getSubscription()
  if (subscription && !subscribedWithKey(subscription, key)) {
    await subscription.unsubscribe()
    subscription = null
  }
  subscription ??= await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: key as BufferSource,
  })

  await api.pushSubscribe(subscription.toJSON() as PushSubscriptionJSON)
}

export async function clearDailyReminder(): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.getRegistration()
  const shown = await registration?.getNotifications({ tag: 'daily-reminder' })
  shown?.forEach((notification) => notification.close())
}

export async function disablePush(): Promise<void> {
  // Server first, so reminders stop even if the browser unsubscribe fails.
  await api.updateProfile({ remindersEnabled: false })

  const registration = await navigator.serviceWorker.getRegistration()
  const subscription = await registration?.pushManager.getSubscription()
  if (!subscription) return

  await api.pushUnsubscribe(subscription.endpoint).catch(() => {})
  await subscription.unsubscribe()
}
