import type { VerseDetailResponse } from '../../api/types'

const RECENT_ATTEMPTS_SHOWN = 10

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

/** Every attempt on this verse, deliberately shown without grades. */
export default function HistoryCard({
  detail,
}: {
  detail: VerseDetailResponse | null
}) {
  if (!detail || detail.history.total === 0) return null

  const { history } = detail
  const recent = history.attempts.slice(0, RECENT_ATTEMPTS_SHOWN)
  const oldestFirst = [...recent].reverse()

  return (
    <section className='card' aria-label='Attempt history'>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
        }}
      >
        <span className='eyebrow'>History</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>
          {history.total} {history.total === 1 ? 'time' : 'times'} through
        </span>
      </div>
      <div className='history-blocks' aria-hidden='true'>
        {oldestFirst.map((attempt) => (
          <span key={attempt.id} className='history-block' />
        ))}
      </div>
      {oldestFirst.length > 0 && (
        <div
          className='small muted'
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 8,
            fontWeight: 700,
            fontSize: '0.72rem',
          }}
        >
          <span>{formatDay(oldestFirst[0].created_at)}</span>
          <span>most recent</span>
        </div>
      )}
      <div style={{ marginTop: 12 }}>
        {recent.map((attempt) => (
          <div key={attempt.id} className='attempt-row'>
            <span className='attempt-kind'>
              {attempt.exercise_type === 'tile_fill_blank'
                ? 'Practiced'
                : 'Recited'}
            </span>
            <span className='muted'>{formatDate(attempt.created_at)}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
