import type { ReactNode } from 'react'
import Alert from '../Alert'
import { Skeleton } from '../Skeleton'
import QueueActions from './QueueActions'
import QueueList from './QueueList'
import ThemeSheet from './ThemeSheet'
import { useQueue } from '../../hooks/useQueue'
import type { QueueVerse } from '../../api/types'

/** Null once the line is empty — QueueList says so itself. */
function subline(
  ids: string[] | null,
  nextUp: QueueVerse | undefined,
): ReactNode {
  if (!ids)
    return <Skeleton variant='text' w='60%' h={12} style={{ margin: 0 }} />
  if (ids.length === 0) return null
  const waiting = `${ids.length} ${ids.length === 1 ? 'verse' : 'verses'} waiting`
  return nextUp
    ? `${waiting} · ${nextUp.reference} moves in when a slot frees`
    : waiting
}

/** The waiting line as a panel under the slot cards, for desktop widths — the
    Practicing tab mounts this instead of QueueLink. */
export default function QueuePanel() {
  const q = useQueue()
  const { ids, nextUp } = q.select(!q.queue.pending)
  const sub = subline(ids, nextUp)

  // Nothing to reorder once the line is empty. Held open while ids are still
  // null so the loading frame keeps its shape.
  const showActions = ids === null || ids.length > 0

  return (
    <section className='queue-panel' aria-label='Up next'>
      <div className='queue-panel-head'>
        <div className='queue-panel-lede'>
          <span className='queue-panel-title'>What&rsquo;s coming next</span>
          {sub !== null && <span className='queue-panel-sub'>{sub}</span>}
        </div>
        {showActions && (
          <QueueActions
            order={q.order}
            ids={ids}
            onMoveTheme={q.openThemeSheet}
          />
        )}
      </div>

      <QueueList ids={ids} byId={q.byId} onMove={q.order.move} />

      {q.queue.data && (
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
    </section>
  )
}
