import type { Stage } from '../api/types'
import { cx } from '../lib/cx'
import {
  STAGE_SEQUENCE,
  STAGE_SHORT_LABELS,
  TIER_ADVANCE_THRESHOLD,
  isLearningStage,
  type UpgradeProgress,
} from '../lib/exercise'
import { upgradeMeterCopy } from '../lib/upgradeMeterCopy'
import { MeterSegments } from './UpgradeMeter'

type StepState = 'done' | 'current' | 'upcoming'

interface StepFill {
  state: StepState
  segments: number
  filled: number
}

function stepFill(
  step: Stage,
  currentStage: Stage,
  progress: UpgradeProgress,
): StepFill {
  const offset =
    STAGE_SEQUENCE.indexOf(step) - STAGE_SEQUENCE.indexOf(currentStage)
  const segments = isLearningStage(step) ? TIER_ADVANCE_THRESHOLD : 1

  if (offset < 0) return { state: 'done', segments, filled: segments }
  if (offset > 0) return { state: 'upcoming', segments, filled: 0 }

  const filledToday = progress.kind === 'run' ? progress.done : 0
  return {
    state: 'current',
    segments,
    filled: isLearningStage(step) ? filledToday : segments,
  }
}

/** The upgrade meter laid out across a verse's whole progression. */
export default function ProgressionMeter({
  stage,
  progress,
  headline,
}: {
  stage: Stage
  progress: UpgradeProgress
  headline?: string
}) {
  const copy = upgradeMeterCopy(progress)
  const label = headline ?? copy.label
  const stageNumber = STAGE_SEQUENCE.indexOf(stage) + 1

  return (
    <div className='progression-meter'>
      <span className='sr-only' role='status'>
        {`Stage ${stageNumber} of ${STAGE_SEQUENCE.length}: ${STAGE_SHORT_LABELS[stage]}. ${headline ?? copy.spoken}`}
      </span>

      <div className='progression-headline' aria-hidden='true'>
        {label}
      </div>

      <div className='progression-steps' aria-hidden='true'>
        {STAGE_SEQUENCE.map((step) => {
          const fill = stepFill(step, stage, progress)
          return (
            <span key={step} style={{ display: 'contents' }}>
              {step === 'review' && <span className='progression-divider' />}
              <span
                className={cx(
                  'progression-step',
                  isLearningStage(step) && 'progression-step-learning',
                  `progression-step-${fill.state}`,
                )}
              >
                <MeterSegments
                  // Remounts to replay the fill animation when the count changes.
                  key={fill.filled}
                  count={fill.segments}
                  filled={fill.filled}
                  className={cx(
                    fill.state === 'current' &&
                      fill.filled > 0 &&
                      'upgrade-segs-fill',
                  )}
                />
                <span className='progression-step-label'>
                  {STAGE_SHORT_LABELS[step]}
                </span>
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
