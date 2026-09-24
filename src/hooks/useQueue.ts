import { useMemo, useState } from 'react'
import { api } from '../api/client'
import type { QueueVerse } from '../api/types'
import { useQueueOrder } from './useQueueOrder'
import { useApi } from './useApi'

/** The waiting line, shared by the Up Next screen and the Practicing panel. */
export function useQueue() {
  const queue = useApi(() => api.queue())
  const order = useQueueOrder(queue.data, queue.refetch)
  const [themeSheet, setThemeSheet] = useState(false)

  const byId = useMemo(
    () => new Map(queue.data?.queue.map((v) => [v.id, v]) ?? []),
    [queue.data],
  )

  /** Held at the skeleton until the caller's whole screen has settled — the
      panel waits on the queue alone, the screen on three requests. */
  const select = (
    ready: boolean,
  ): { ids: string[] | null; nextUp: QueueVerse | undefined } => {
    const ids = ready ? order.ids : null
    return {
      ids,
      nextUp: ids && ids.length > 0 ? byId.get(ids[0]) : undefined,
    }
  }

  return {
    queue,
    order,
    byId,
    select,
    themeSheet,
    openThemeSheet: () => setThemeSheet(true),
    closeThemeSheet: () => setThemeSheet(false),
  }
}
