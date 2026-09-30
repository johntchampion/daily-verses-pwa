import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from '../api/client'
import { messageOf } from '../lib/errors'
import {
  disablePush,
  enablePush,
  enableThisDevice,
  isIos,
  isStandalone,
  notificationPermission,
  PermissionRefused,
  pushSupported,
  subscribeThisBrowser,
} from '../lib/push'

export type PushState =
  | 'unsupported'
  /** iOS in a browser tab, where Web Push needs a Home Screen install. */
  | 'needs-install'
  /** The server has no VAPID keys. */
  | 'unavailable'
  | 'blocked'
  /** Reminders are on for the account but this browser isn't subscribed. */
  | 'needs-device'
  | 'off'
  | 'on'

export interface PushReminders {
  state: PushState
  enabled: boolean
  busy: boolean
  error: string | null
  unavailableMessage: string | null
  hint: string | null
  toggle: (next: boolean) => void
  /** Must be called straight from a click: Safari's prompt needs the gesture. */
  enableThisDevice: () => Promise<void>
  sendTest: () => Promise<void>
}

const UNAVAILABLE_COPY: Partial<Record<PushState, string>> = {
  unsupported: 'This browser can’t show notifications.',
  'needs-install':
    'Add Verses to your Home Screen first, then turn reminders on here.',
  unavailable: 'Reminders aren’t set up on this server yet.',
}

const HINTS: Partial<Record<PushState, string>> = {
  blocked:
    'Notifications are blocked in your browser settings, so this device stays silent.',
  'needs-device':
    'This device isn’t set up to receive them yet. Your other devices are unaffected.',
}

type Blocker = Exclude<PushState, 'off' | 'on' | 'needs-device'>

function currentBlocker(): Blocker | null {
  if (!pushSupported()) {
    return isIos() && !isStandalone() ? 'needs-install' : 'unsupported'
  }
  return notificationPermission() === 'denied' ? 'blocked' : null
}

/** The daily-reminder switch, reconciling the account preference with this
    browser's push subscription. */
export function usePushReminders(
  remindersEnabled: boolean | undefined,
  onSaved: () => void,
): PushReminders {
  const [blocker, setBlocker] = useState<Blocker | null>(currentBlocker)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [optimisticEnabled, setOptimisticEnabled] = useState<boolean | null>(
    null,
  )
  const [deviceReady, setDeviceReady] = useState<boolean | null>(null)

  const enabled = optimisticEnabled ?? remindersEnabled ?? false

  useEffect(() => {
    if (optimisticEnabled !== null && remindersEnabled === optimisticEnabled) {
      setOptimisticEnabled(null)
    }
  }, [optimisticEnabled, remindersEnabled])

  const [visibilityRecheckCount, setVisibilityRecheckCount] = useState(0)

  useEffect(() => {
    function recheck() {
      if (document.visibilityState !== 'visible') return
      setBlocker(currentBlocker())
      setVisibilityRecheckCount((n) => n + 1)
    }
    document.addEventListener('visibilitychange', recheck)
    return () => document.removeEventListener('visibilitychange', recheck)
  }, [])

  useEffect(() => {
    if (remindersEnabled !== true) return
    if (blocker !== null) return

    let cancelled = false
    void (async () => {
      let ready = false
      try {
        if (notificationPermission() === 'granted') {
          await subscribeThisBrowser()
          ready = true
        }
      } catch {
        // Leave the device unready so the enable button is offered.
      }
      if (!cancelled) setDeviceReady(ready)
    })()

    return () => {
      cancelled = true
    }
  }, [remindersEnabled, blocker, visibilityRecheckCount])

  const report = useCallback((err: unknown, fallback: string) => {
    if (err instanceof PermissionRefused) {
      setBlocker(err.permission === 'denied' ? 'blocked' : null)
      setError(err.message)
    } else if (err instanceof ApiError && err.status === 503) {
      setBlocker('unavailable')
    } else {
      setError(messageOf(err, fallback))
    }
  }, [])

  const toggle = useCallback(
    (next: boolean) => {
      setBusy(true)
      setError(null)
      setOptimisticEnabled(next)
      void (async () => {
        try {
          if (next) {
            await enablePush()
            setDeviceReady(true)
          } else {
            await disablePush()
            setDeviceReady(null)
          }
          onSaved()
        } catch (err) {
          report(err, 'Could not change your reminder setting.')
          setOptimisticEnabled(null)
        } finally {
          setBusy(false)
        }
      })()
    },
    [onSaved, report],
  )

  const enableDevice = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      await enableThisDevice()
      setDeviceReady(true)
    } catch (err) {
      report(err, 'Could not turn on notifications for this device.')
      setDeviceReady(false)
    } finally {
      setBusy(false)
    }
  }, [report])

  const sendTest = useCallback(async () => {
    setError(null)
    try {
      const result = await api.pushTest()
      // No device received it, so this one can't be subscribed either.
      if (result.sent === 0) setDeviceReady(false)
    } catch (err) {
      setError(messageOf(err, 'Could not send a test notification.'))
    }
  }, [])

  const state: PushState =
    blocker ??
    (!enabled ? 'off' : deviceReady === false ? 'needs-device' : 'on')

  return {
    state,
    enabled:
      state === 'on' ||
      ((state === 'blocked' || state === 'needs-device') && enabled),
    busy,
    error,
    unavailableMessage: UNAVAILABLE_COPY[state] ?? null,
    hint: HINTS[state] ?? null,
    toggle,
    enableThisDevice: enableDevice,
    sendTest,
  }
}
