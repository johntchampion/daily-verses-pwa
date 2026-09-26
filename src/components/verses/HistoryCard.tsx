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

/**
 * Every attempt on this verse — a log, not a scorecard. The API still reports how
 * each one was graded and the database still keeps it, because review scheduling
 * reads it; showing it here would just reintroduce the score the session stopped
 * keeping. What the user gets is the thing that actually moves a verse: how many
 * times they have been through it, and when.
 */
export default function HistoryCard({
  detail,
}: {
  detail: VerseDetailResponse | null
}) {
  if (!detail || detail.history.total === 0) return null

  const { history } = detail
  const recent = history.attempts.slice(0, RECENT_ATTEMPTS_SHOWN)
  // Attempts arrive newest first; the block strip reads oldest → newest.
  const blocks = [...recent].reverse()

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
        {blocks.map((attempt) => (
          <span key={attempt.id} className='history-block' />
        ))}
      </div>
      {blocks.length > 0 && (
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
          <span>{formatDay(blocks[0].created_at)}</span>
          <span>most recent</span>
        </div>
      )}
      <div style={{ marginTop: 12 }}>
        {recent.map((attempt) => (
          <div key={attempt.id} className='attempt-row'>
            {/* Typed exercises only happen at mastered, so naming the kind says
                how far the verse had got without grading the attempt. */}
            <span className='attempt-kind'>
              {attempt.exercise_type === 'tile_fill_blank'
                ? 'Practised'
                : 'Recited'}
            </span>
            <span className='muted'>{formatDate(attempt.created_at)}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
