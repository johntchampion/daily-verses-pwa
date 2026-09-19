import { Link } from 'react-router-dom'
import type { SlotVerse } from '../api/types'
import { Skeleton, SkeletonText } from './Skeleton'
import { truncate } from '../lib/verses'
import { STAGE_LABELS, TIER_ADVANCE_THRESHOLD } from '../lib/exercise'

interface Props {
  slot: number
  verse: SlotVerse | null
  snippet: string | null
  /** The user's local date, for judging whether the correct run is still live. */
  today: string
}

export default function SlotRow({ slot, verse, snippet, today }: Props) {
  if (verse) {
    const live = verse.streakDate === today
    const run = live ? verse.consecutiveCorrect : 0

    return (
      <Link
        to={`/verses/${verse.verseId}`}
        className='slot-card'
        style={{ color: 'inherit' }}
      >
        <div className='slot-card-head'>
          <span className='slot-reference'>
            {verse.reference ?? verse.verseId}
          </span>
          <span className='chip chip-active'>{STAGE_LABELS[verse.stage]}</span>
        </div>
        {snippet && (
          <p className='slot-snippet'>&ldquo;{truncate(snippet)}&rdquo;</p>
        )}

        {verse.tierChangeUsedToday ? (
          <div className='advance-row'>
            <span className='advance-label'>
              Moved up today · next upgrade tomorrow
            </span>
          </div>
        ) : (
          <div
            className='advance-row'
            aria-label={`${run} of ${TIER_ADVANCE_THRESHOLD} correct in a row today`}
          >
            {Array.from({ length: TIER_ADVANCE_THRESHOLD }, (_, i) => (
              <span
                key={i}
                className={
                  i < run ? 'advance-seg advance-seg-filled' : 'advance-seg'
                }
              />
            ))}
            <span className='advance-label'>
              {run} / {TIER_ADVANCE_THRESHOLD} today to upgrade
            </span>
          </div>
        )}
      </Link>
    )
  }

  return (
    <div className='slot-empty'>
      <div>
        <div className='slot-empty-title'>Slot {slot}</div>
        <div className='slot-empty-copy'>
          Open — waiting for a verse to come into practice
        </div>
      </div>
    </div>
  )
}

/** The advance rail renders for real in its empty state, so the card keeps its
    exact height and only the segments fill in when the verse arrives. */
export function SlotRowSkeleton() {
  return (
    <div className='slot-card'>
      <div className='slot-card-head'>
        <Skeleton variant='text' w='44%' h={15} />
        <Skeleton variant='chip' w={78} h={20} />
      </div>
      <p className='slot-snippet' aria-hidden='true'>
        <SkeletonText lines={2} widths={['100%', '54%']} />
      </p>
      <div className='advance-row'>
        {Array.from({ length: TIER_ADVANCE_THRESHOLD }, (_, i) => (
          <span key={i} className='advance-seg' />
        ))}
        <Skeleton variant='text' w={104} h={10} style={{ margin: 0 }} />
      </div>
    </div>
  )
}
