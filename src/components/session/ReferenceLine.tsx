import { cx } from '../../lib/cx'
import type { ReferenceStep } from '../../lib/reference'
import TypedBlank from './TypedBlank'

/** Placeholder for a slot with nothing in it; the CSS gives it its width. */
const EMPTY = ' '

function RefSlot({
  step,
  state,
  typed,
  typedWrong,
}: {
  step: ReferenceStep
  state: SlotState
  typed: string
  typedWrong: boolean
}) {
  if (state === 'filled') {
    return <span className='blank-filled ref-slot'>{step.answer}</span>
  }

  const isCurrent = state === 'current'
  return (
    <span
      className={cx(
        'blank ref-slot',
        `ref-${step.kind}`,
        isCurrent && 'blank-current',
        isCurrent && typedWrong && 'blank-wrong',
      )}
      aria-label={`${step.kind} blank`}
    >
      {isCurrent ? <TypedBlank sizer={EMPTY} typed={typed} /> : EMPTY}
    </span>
  )
}

type SlotState = 'filled' | 'current' | 'empty'

/** The reference as three blanks, filled book then chapter then verse. */
export default function ReferenceLine({
  steps,
  filled,
  typed = '',
  typedWrong = false,
}: {
  steps: ReferenceStep[]
  filled: number
  /** What the keyboard has typed so far, drawn into the current slot. */
  typed?: string
  typedWrong?: boolean
}) {
  const stateOf = (at: number): SlotState =>
    at < filled ? 'filled' : at === filled ? 'current' : 'empty'

  const slot = (at: number) => (
    <RefSlot
      step={steps[at]}
      state={stateOf(at)}
      typed={typed}
      typedWrong={typedWrong}
    />
  )

  return (
    <p className='verse-ref ref-line'>
      {slot(0)}
      <span className='ref-locus'>
        {slot(1)}
        <span aria-hidden='true'>:</span>
        {slot(2)}
      </span>
    </p>
  )
}
