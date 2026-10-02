import { Link } from 'react-router-dom'
import type { VerseListItem } from '../../api/types'

/** Verses sent back to relearning, waiting for a slot. */
export default function RelearnCard({
  verses,
}: {
  verses: VerseListItem[] | null
}) {
  const relearning = verses?.filter((v) => v.needsRelearning) ?? []
  if (relearning.length === 0) return null

  const one = relearning.length === 1
  return (
    <div className='relearn-card'>
      <div className='eyebrow' style={{ color: 'var(--coral-text)' }}>
        Waiting for a slot
      </div>
      <p className='relearn-copy'>
        {one ? 'This one is' : 'These are'} due for another round and{' '}
        {one ? 'comes' : 'come'} back to practice once a slot frees up — that
        happens when another verse graduates.
      </p>
      <ul className='relearn-list'>
        {relearning.map((verse) => (
          <li key={verse.id}>
            <Link
              to={`/verses/${verse.id}`}
              state={{ from: '/practicing' }}
              className='relearn-ref'
            >
              {verse.reference}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
