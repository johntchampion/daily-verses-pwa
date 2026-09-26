import { Link } from 'react-router-dom'
import ProgressBar from '../ProgressBar'
import { Skeleton } from '../Skeleton'

/**
 * The runner's top row. The bar and the count deliberately take separate
 * numbers: `answered` moves the instant an exercise is recorded, which is now
 * before the card is swapped, while `position` names the exercise in hand. One
 * number can't do both jobs any more without reading a card ahead of itself.
 */
export default function SessionHeader({
  answered,
  position,
  total,
}: {
  answered: number
  position: number
  total: number
}) {
  return (
    <header className='session-head'>
      <Link to='/' className='icon-btn' aria-label='Exit session'>
        ✕
      </Link>
      <div className='session-progress'>
        <ProgressBar done={answered} total={total} />
      </div>
      {total === 0 ? (
        <Skeleton variant='text' w={28} h={12} style={{ margin: 0 }} />
      ) : (
        <span className='progress-count'>
          {position}/{total}
        </span>
      )}
    </header>
  )
}
