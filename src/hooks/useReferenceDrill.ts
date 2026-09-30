import { useState } from 'react'
import type { Stage } from '../api/types'
import { usesReferencePhase } from '../lib/exercise'
import { buildReferenceSteps, type ReferenceStep } from '../lib/reference'

/** The book/chapter/verse drill after the verse text. The steps are state, not
    a memo, so their shuffled order stays stable. */
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
    /** Returns true when that was the last step. */
    advance: (): boolean => {
      const next = filled + 1
      setFilled(next)
      return phase !== null && next >= phase.length
    },
  }
}
