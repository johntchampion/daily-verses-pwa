import type { SessionExercise } from '../../api/types'
import { cx } from '../../lib/cx'
import {
  MAX_INTERVAL_DAYS,
  REVIEW_ADVANCE_THRESHOLD,
  TIER_ADVANCE_THRESHOLD,
  upgradeProgress,
  type UpgradeProgress,
} from '../../lib/exercise'

/** The visible line and the spoken one, which says the whole rule rather than
    the shorthand the width allows for. */
interface Copy {
  label: string
  spoken: string
}

function copyFor(progress: UpgradeProgress): Copy {
  switch (progress.kind) {
    case 'run': {
      const { done, needed, total, target, sameDay } = progress
      const unit = sameDay
        ? done === 0
          ? `${needed} in a row today`
          : `${needed} more in a row`
        : `${needed}${done === 0 ? '' : ' more'} ${needed === 1 ? 'review' : 'reviews'}`

      return {
        label: `${unit} → ${target}`,
        spoken: sameDay
          ? `${done} of ${total} correct in a row today. ${needed} more in a row, all within today, moves this verse up to ${target}.`
          : `${done} of ${total} reviews passed. ${needed} more moves this verse to ${target}.`,
      }
    }

    case 'spent':
      return progress.sameDay
        ? {
            label: 'Moved up today · next tomorrow',
            spoken:
              'This verse already moved up today. However this session goes, it can move again tomorrow.',
          }
        : {
            label: 'Counted today · next on schedule',
            spoken:
              "This verse's move for today is already made. It comes back on its due date.",
          }

    case 'rule':
      return progress.sameDay
        ? {
            label: `${TIER_ADVANCE_THRESHOLD} in a row today moves it up`,
            spoken: `${TIER_ADVANCE_THRESHOLD} right in a row within one day moves this verse up a tier.`,
          }
        : {
            label: `${REVIEW_ADVANCE_THRESHOLD} reviews → a longer gap`,
            spoken: `${REVIEW_ADVANCE_THRESHOLD} passed reviews stretch the gap before this verse comes back.`,
          }

    case 'top':
      return {
        label: `Mastered · back in ${MAX_INTERVAL_DAYS} days`,
        spoken: `This verse is mastered, the top of the ladder. It comes back every ${MAX_INTERVAL_DAYS} days so it doesn't go stale.`,
      }
  }
}

/**
 * What this verse needs to move up, in the slot the stage used to hold. The
 * stage named where it already sat, which is the one thing the exercise in
 * front of the user already shows.
 *
 * The segments carry the size of the goal — three, from the first answer,
 * before any of it is earned — and the label names where it leads, so the
 * ladder introduces itself rather than needing to be known. Deliberately borrows
 * the Practicing tab's advance rail: a user meets the same rule in both places.
 */
export default function UpgradeMeter({
  exercise,
  today,
}: {
  exercise: SessionExercise
  today: string | null
}) {
  const progress = upgradeProgress(exercise.userVerse, today)
  const { label, spoken } = copyFor(progress)

  const filled =
    progress.kind === 'run'
      ? progress.done
      : progress.kind === 'rule'
        ? 0
        : TIER_ADVANCE_THRESHOLD
  const total =
    progress.kind === 'run' ? progress.total : TIER_ADVANCE_THRESHOLD

  return (
    <span className='upgrade-meter'>
      <span className='sr-only'>{spoken}</span>

      <span
        className={`upgrade-segs upgrade-segs-${progress.kind}`}
        aria-hidden='true'
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cx('upgrade-seg', i < filled && 'upgrade-seg-filled')}
          />
        ))}
      </span>
      <span className='upgrade-label' aria-hidden='true'>
        {label}
      </span>
    </span>
  )
}

/** The meter's resting shape, for the skeleton: the same markup with nothing
    counted yet, so the header lands at its final height before data arrives. */
export function UpgradeMeterEmpty() {
  return (
    <span className='upgrade-segs' aria-hidden='true'>
      {Array.from({ length: TIER_ADVANCE_THRESHOLD }, (_, i) => (
        <span key={i} className='upgrade-seg' />
      ))}
    </span>
  )
}
