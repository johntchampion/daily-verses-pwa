import type { Stage } from '../api/types'
import {
  STAGE_SEQUENCE,
  STAGE_SHORT_LABELS,
  isLearningStage,
} from '../lib/exercise'

/** Where a verse sits on the progression; the divider marks graduation. */
export default function StageLadder({ stage }: { stage: Stage }) {
  const current = STAGE_SEQUENCE.indexOf(stage)

  return (
    <div
      className='stage-pipeline'
      aria-label={`Progression: ${STAGE_SHORT_LABELS[stage]}`}
    >
      {STAGE_SEQUENCE.map((step, i) => (
        <span key={step} style={{ display: 'contents' }}>
          {i > 0 && (
            <span className='stage-arrow' aria-hidden='true'>
              {step === 'review' ? '|' : '›'}
            </span>
          )}
          <span
            className={
              i === current
                ? isLearningStage(step)
                  ? 'stage-step stage-step-current'
                  : 'stage-step stage-step-active'
                : i < current
                  ? 'stage-step stage-step-done'
                  : 'stage-step'
            }
          >
            {STAGE_SHORT_LABELS[step]}
          </span>
        </span>
      ))}
    </div>
  )
}
