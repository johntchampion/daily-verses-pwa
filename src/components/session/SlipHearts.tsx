/** Above this many, a row of glyphs stops reading as a count and starts
    reading as decoration. */
const HEART_CAP = 6

function Heart({ full }: { full: boolean }) {
  return (
    <svg
      className={full ? 'heart' : 'heart heart-empty'}
      viewBox='0 0 16 16'
      aria-hidden='true'
    >
      <path
        d='M8 14S1.5 9.8 1.5 5.6A3.6 3.6 0 0 1 8 3.4a3.6 3.6 0 0 1 6.5 2.2C14.5 9.8 8 14 8 14Z'
        fill={full ? 'currentColor' : 'none'}
        stroke='currentColor'
        strokeWidth={full ? 0 : 1.6}
        strokeLinejoin='round'
      />
    </svg>
  )
}

/**
 * The attempt's remaining slips, one heart each, sitting straight on the page.
 * Showing the whole budget from the start is the only way the forgiveness is
 * legible before any of it is spent.
 */
export default function SlipHearts({
  budget,
  misses,
}: {
  budget: number
  misses: number
}) {
  const left = Math.max(0, budget - misses)

  return (
    <span
      key={misses}
      className={'slip-hearts' + (misses > 0 ? ' slip-hearts-lost' : '')}
      role='status'
      aria-label={`${left} of ${budget} slip${budget === 1 ? '' : 's'} left`}
    >
      {budget > HEART_CAP ? (
        <>
          <Heart full={left > 0} />
          <span className='heart-count'>×{left}</span>
        </>
      ) : (
        Array.from({ length: budget }, (_, i) => (
          <Heart key={i} full={i >= budget - left} />
        ))
      )}
    </span>
  )
}
