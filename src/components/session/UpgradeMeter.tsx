import type { SessionExercise } from '../../api/types'
import { cx } from '../../lib/cx'
import {
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
      const { done, needed, total, target } = progress

      return {
        label: `${needed}${done === 0 ? '' : ' more'} today → ${target}`,
        spoken: `${done} of ${total} times through this verse today. ${needed} more, all within today, moves it up to ${target}.`,
      }
    }

    case 'moved':
      return progress.graduated
        ? {
            label: 'Graduated · now in review',
            spoken:
              'This verse graduated out of practice today. It comes back on a review schedule from here.',
          }
        : {
            label: `Moved up to ${progress.landed}`,
            spoken: `This verse moved up to ${progress.landed} today. It can move again tomorrow.`,
          }

    case 'rule':
      return {
        label: `${TIER_ADVANCE_THRESHOLD} times today moves it up`,
        spoken: `Going through this verse ${TIER_ADVANCE_THRESHOLD} times within one day moves it up a tier.`,
      }

    // Unslotted: where it sits, and deliberately nothing about the schedule.
    case 'scheduled':
      return { label: progress.label, spoken: `This verse is ${progress.label}.` }
  }
}

/**
 * What this verse needs to move up, in the slot the stage used to hold. The stage
 * named where it already sat, which is the one thing the exercise in front of the
 * user already shows.
 *
 * The segments carry the size of the goal — three, from the first repetition,
 * before any of it is earned — and the label names where it leads, so the ladder
 * introduces itself rather than needing to be known. Deliberately borrows the
 * Practicing tab's advance rail: a user meets the same rule in both places.
 *
 * The attempt is recorded the moment the exercise is finished rather than on
 * Next, so this fills in while the user is still looking at the verse they just
 * did. `key` on the segment row replays the fill animation when the count
 * changes — the same trick the slip hearts used for their own beat.
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
      : progress.kind === 'moved'
        ? TIER_ADVANCE_THRESHOLD
        : 0

  return (
    <span className='upgrade-meter'>
      <span className='sr-only' role='status'>
        {spoken}
      </span>

      {progress.kind !== 'scheduled' && (
        <span
          key={filled}
          className={cx(
            'upgrade-segs',
            progress.kind === 'moved' && 'upgrade-segs-moved',
            filled > 0 && 'upgrade-segs-fill',
          )}
          aria-hidden='true'
        >
          {Array.from({ length: TIER_ADVANCE_THRESHOLD }, (_, i) => (
            <span
              key={i}
              className={cx('upgrade-seg', i < filled && 'upgrade-seg-filled')}
            />
          ))}
        </span>
      )}
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
