import { type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { SessionEvent } from '../../lib/sessionEvents'

const ROW_STAGGER_MS = 60
const MAX_STAGGERED_ROWS = 6
const ROWS_AT = 420

const enter = (ms: number) => ({ '--enter': `${ms}ms` }) as CSSProperties

/** The end of a session: the streak, the totals, and every verse that moved. */
export default function SessionComplete({
  streak,
  recorded,
  practice,
  exercises,
  verses,
  events,
}: {
  streak: number | null
  recorded: boolean
  practice?: boolean
  exercises: number
  verses: number
  events: SessionEvent[]
}) {
  // Null when this session didn't record the day, so the streak didn't move.
  const streakBefore =
    recorded && streak !== null && streak >= 1 ? streak - 1 : null

  const tail = ROWS_AT + Math.min(events.length, MAX_STAGGERED_ROWS) * ROW_STAGGER_MS

  return (
    <main className='complete-screen'>
      {streak !== null && (
        <>
          <div
            className='complete-circle complete-rise'
            style={enter(0)}
            role='img'
            aria-label={`${streak} day streak`}
          >
            {streakBefore === null ? (
              <span className='complete-circle-count' aria-hidden='true'>
                {streak}
              </span>
            ) : (
              <span
                className='complete-circle-count complete-roll'
                aria-hidden='true'
              >
                <span className='complete-roll-out'>{streakBefore}</span>
                <span className='complete-roll-in'>{streak}</span>
              </span>
            )}
          </div>
          <div className='complete-eyebrow complete-rise' style={enter(140)}>
            Day streak
          </div>
        </>
      )}
      <h1 className='complete-title complete-rise' style={enter(220)}>
        {practice ? 'Another round down.' : 'Kept the day.'}
      </h1>
      <p className='complete-sub complete-rise' style={enter(280)}>
        {exercises} {exercises === 1 ? 'exercise' : 'exercises'} · {verses}{' '}
        {verses === 1 ? 'verse' : 'verses'}
      </p>

      {events.length > 0 && (
        <div className='complete-events complete-rise' style={enter(360)}>
          {events.map((event, i) => (
            <div
              key={i}
              className='complete-event complete-rise'
              style={enter(ROWS_AT + Math.min(i, MAX_STAGGERED_ROWS - 1) * ROW_STAGGER_MS)}
            >
              <span
                className='complete-event-icon'
                style={{ background: event.iconBg }}
                aria-hidden='true'
              >
                {event.icon}
              </span>
              <div>
                <div className='complete-event-title'>{event.title}</div>
                <div
                  className='complete-event-detail'
                  style={{ color: event.detailColor }}
                >
                  {event.detail}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!recorded && (
        <p className='small complete-sub complete-rise' style={enter(tail)}>
          Today&rsquo;s session was already counted — extra practice never
          hurts.
        </p>
      )}
      <Link
        to='/'
        className='btn complete-rise'
        style={{ marginTop: 22, ...enter(tail) }}
      >
        Back home
      </Link>
    </main>
  )
}
