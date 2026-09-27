export type TypedOutcome = 'correct' | 'incorrect' | 'shown'
export type ReferenceOutcome = 'correct' | 'incorrect' | null

function headline(result: TypedOutcome): string {
  if (result === 'correct') return 'Word for word.'
  if (result === 'shown') return 'Here it is — read it through.'
  return 'Here it is again:'
}

/**
 * The verse as it should have been written, so a full-recall attempt can be
 * checked against it.
 *
 * Deliberately not graded. The comparison stays — you cannot self-check recall
 * without being told what the words were — but it is one neutral card either way
 * rather than a green pass and a coral fail, and the headline describes the text
 * instead of delivering a verdict. Whether the attempt was word-perfect still
 * reaches the API; it just isn't news.
 */
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
