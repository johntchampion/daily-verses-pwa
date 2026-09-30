import { Link } from 'react-router-dom'
import ProgressBar from '../ProgressBar'
import { Skeleton } from '../Skeleton'

/** `answered` updates as soon as an exercise is recorded; `position` is the
    exercise on screen. */
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
