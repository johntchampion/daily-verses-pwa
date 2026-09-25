import type { SessionExercise } from '../../api/types'
import { STAGE_LABELS } from '../../lib/exercise'

export function StageChip({
  exercise,
  reviewLabel = 'Review',
}: {
  exercise: SessionExercise
  reviewLabel?: string
}) {
  const isReview = exercise.queue === 'review'
  return (
    <span className={isReview ? 'chip chip-review' : 'chip chip-active'}>
      {isReview ? reviewLabel : STAGE_LABELS[exercise.stage]}
    </span>
  )
}
