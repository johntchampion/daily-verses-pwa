import { useState } from 'react'
import type { Stage } from '../api/types'
import { usesReferencePhase } from '../lib/exercise'
import { buildReferenceSteps, type ReferenceStep } from '../lib/reference'

/**
 * The book/chapter/verse drill that follows the verse text.
 *
 * The steps are state rather than a memo: building them shuffles, and
 * recomputing would reorder the chips under the user's thumb.
 */
export function useReferenceDrill(
  stage: Stage,
  reference: string,
  textDone: boolean,
) {
  const [steps] = useState<ReferenceStep[] | null>(() =>
    usesReferencePhase(stage) ? buildReferenceSteps(reference) : null,
  )
  const [filled, setFilled] = useState(0)

  const phase = textDone ? steps : null
  const step = phase && filled < phase.length ? phase[filled] : null
  const board = phase ? phase[Math.min(filled, phase.length - 1)] : null

  return {
    phase,
    step,
    board,
    filled,
    hasSteps: steps !== null,
    /** True when that was the last step, so the caller can act on the drill
        being finished without duplicating the arithmetic. */
    advance: (): boolean => {
      const next = filled + 1
      setFilled(next)
      return phase !== null && next >= phase.length
    },
  }
}
