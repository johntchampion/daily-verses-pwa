import { type ReactNode } from 'react'
import { api } from '../api/client'
import type { QueueResponse } from '../api/types'
import Alert from '../components/Alert'
import Screen, { BackButton } from '../components/Screen'
import { SkeletonText } from '../components/Skeleton'
import TranslationTag from '../components/TranslationTag'
import QueueActions from '../components/queue/QueueActions'
import QueueList from '../components/queue/QueueList'
import QueueSlots from '../components/queue/QueueSlots'
import ThemeSheet from '../components/queue/ThemeSheet'
import { combineApi, useApi } from '../hooks/useApi'
import { useBack } from '../hooks/useBack'
import { useQueue } from '../hooks/useQueue'

/** Four states for the lead paragraph: pending, an order to describe, or an
    empty line or failure that still deserves a line saying what the screen is. */
function lede(
  pending: boolean,
  data: QueueResponse | null,
  customized: boolean,
): ReactNode {
  if (pending) return <SkeletonText lines={2} widths={['100%', '62%']} />
  if (!data || data.queue.length === 0)
    return 'Everything waiting to enter your practice slots.'
  return customized
    ? 'Your order. Whenever a slot frees up, the verse at the top of the line moves in.'
    : 'Default order — the arc, front to back. Nudge any verse up to practice it sooner.'
}

/**
 * The practice queue: everything not memorized and not in a slot, in the order
 * it will enter them. Nothing here touches the slots directly — they refill
 * themselves as verses finish or get swapped out.
 *
 * Mobile only — QueueRoute in App.tsx sends desktop widths to the Practicing
 * tab, where the same line is a panel.
 */
export default function Queue() {
  const back = useBack()
  const me = useApi(() => api.me())
  // Only for the snippets on the in-slot lines — those verses aren't in the
  // queue payload, so their text has to come from the verse list.
  const verses = useApi(() => api.verses())
  const q = useQueue()
  const all = combineApi(me, q.queue, verses)

  // Hold every child to its skeleton until all three requests have settled, so
  // the slots, waiting line and actions don't pop in one at a time.
  const ready = !all.pending
  const { ids, nextUp } = q.select(ready)

  // Nothing to reorder once the line is empty. Held open while ids are still
  // null so the loading frame keeps its shape.
  const showActions = ids === null || ids.length > 0

  return (
    <Screen
      leading={<BackButton onClick={back} label='Back' />}
      title={<h1>Up Next</h1>}
      trailing={<TranslationTag code={q.queue.data?.translation ?? null} />}
      sub={lede(all.pending, q.queue.data, q.order.customized)}
      subStyle={{ marginTop: 10 }}
      loading={all.pending}
      loadingLabel='Loading your queue…'
      // The verse list only carries snippets, so its failure isn't the screen's.
      error={me.error ?? q.queue.error}
      onRetry={all.refetch}
    >
      {showActions && (
        <QueueActions
          order={q.order}
          ids={ids}
          onMoveTheme={q.openThemeSheet}
        />
      )}

      <QueueSlots
        slots={ready ? (me.data?.slots ?? null) : null}
        verses={ready ? (verses.data?.verses ?? null) : null}
      />

      <div className='eyebrow queue-waiting-label'>Waiting in line</div>

      <QueueList ids={ids} byId={q.byId} onMove={q.order.move} />

      {nextUp && (
        <p className='queue-refill-note'>
          Slots fill one at a time. Finish or swap out a verse and{' '}
          {nextUp.reference} takes its place.
        </p>
      )}

      {ready && q.queue.data && (
        <ThemeSheet
          open={q.themeSheet}
          themes={q.queue.data.themes}
          busy={q.order.busy}
          onConfirm={(themeId) => q.order.moveTheme(themeId, q.closeThemeSheet)}
          onClose={q.closeThemeSheet}
        />
      )}

      <Alert
        open={q.order.saveError !== null}
        title='Something went wrong'
        message={q.order.saveError ?? ''}
        tone='warning'
        primaryLabel='OK'
        onPrimary={q.order.clearSaveError}
        onClose={q.order.clearSaveError}
      />
    </Screen>
  )
}
