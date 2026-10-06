import { cx } from '../lib/cx'
import { TIER_ADVANCE_THRESHOLD, type UpgradeProgress } from '../lib/exercise'
import { upgradeMeterCopy } from '../lib/upgradeMeterCopy'

/** Shows what a verse still needs today to move up a tier. */
export default function UpgradeMeter({
  progress,
}: {
  progress: UpgradeProgress
}) {
  const { label, spoken } = upgradeMeterCopy(progress)

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
        <MeterSegments
          // Remounts to replay the fill animation when the count changes.
          key={filled}
          count={TIER_ADVANCE_THRESHOLD}
          filled={filled}
          className={cx(
            progress.kind === 'moved' && 'upgrade-segs-moved',
            filled > 0 && 'upgrade-segs-fill',
          )}
        />
      )}
      <span className='upgrade-label' aria-hidden='true'>
        {label}
      </span>
    </span>
  )
}

/** The meter with nothing filled, for loading skeletons. */
export function UpgradeMeterEmpty() {
  return <MeterSegments count={TIER_ADVANCE_THRESHOLD} filled={0} />
}

/** A row of skewed segments, the first `filled` of them lit. */
export function MeterSegments({
  count,
  filled,
  className,
}: {
  count: number
  filled: number
  className?: string
}) {
  return (
    <span className={cx('upgrade-segs', className)} aria-hidden='true'>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={cx('upgrade-seg', i < filled && 'upgrade-seg-filled')}
        />
      ))}
    </span>
  )
}
