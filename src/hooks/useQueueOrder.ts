import { useState } from 'react'
import { api } from '../api/client'
import type { QueueResponse } from '../api/types'
import { messageOf } from '../lib/errors'

/** The queue's editable order, updated optimistically and saved in the
    background. */
export function useQueueOrder(data: QueueResponse | null, refresh: () => void) {
  const [ids, setIds] = useState<string[] | null>(null)
  // Set optimistically so "Restore default order" enables right away.
  const [customized, setCustomized] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [seeded, setSeeded] = useState(data)
  if (data !== seeded) {
    setSeeded(data)
    setIds(data ? data.queue.map((v) => v.id) : null)
    setCustomized(data?.customized ?? false)
  }

  const refreshAll = () => {
    refresh()
    setSaveError(null)
  }

  const move = (index: number, delta: number) => {
    if (!ids) return
    const j = index + delta
    if (j < 0 || j >= ids.length) return
    const next = [...ids]
    next[index] = next[j]
    next[j] = ids[index]
    setIds(next)
    setCustomized(true)
    api.setQueueOrder(next).catch((err: unknown) => {
      setSaveError(messageOf(err, 'Could not save the new order.'))
    })
  }

  const resetOrder = () => {
    setBusy(true)
    api
      .resetQueue()
      .then(refreshAll)
      .catch((err: unknown) => {
        setSaveError(messageOf(err, 'Could not reset the order.'))
      })
      .finally(() => setBusy(false))
  }

  const moveTheme = (themeId: string, onSettled: () => void) => {
    setBusy(true)
    api
      .moveThemeToTop(themeId)
      .then(() => {
        onSettled()
        refreshAll()
      })
      .catch((err: unknown) => {
        setSaveError(messageOf(err, 'Could not move the theme.'))
        onSettled()
      })
      .finally(() => setBusy(false))
  }

  return {
    ids,
    customized,
    busy,
    saveError,
    clearSaveError: () => setSaveError(null),
    move,
    resetOrder,
    moveTheme,
  }
}
