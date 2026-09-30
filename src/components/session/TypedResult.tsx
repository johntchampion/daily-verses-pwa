export type TypedOutcome = 'correct' | 'incorrect' | 'shown'
export type ReferenceOutcome = 'correct' | 'incorrect' | null

function headline(result: TypedOutcome): string {
  if (result === 'correct') return 'Word for word.'
  if (result === 'shown') return 'Here it is — read it through.'
  return 'Here it is again:'
}

/** The verse as written, shown after a typed attempt without grading it. */
export default function TypedResult({
  result,
  refResult,
  fullText,
  reference,
}: {
  result: TypedOutcome
  refResult: ReferenceOutcome
  fullText: string
  reference: string
}) {
  return (
    <div className='result-card' role='status'>
      <p className='result-headline'>{headline(result)}</p>
      <p className='result-verse'>{fullText}</p>
      {refResult !== null && <p className='result-reference'>{reference}</p>}
    </div>
  )
}
