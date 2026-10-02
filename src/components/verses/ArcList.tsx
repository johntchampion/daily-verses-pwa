import { Link } from 'react-router-dom'
import type { VerseListItem } from '../../api/types'
import { Skeleton } from '../Skeleton'
import { isMemorized } from '../../lib/verses'

const SKELETON_ROWS = 8

const SKELETON_WIDTHS = ['86%', '72%', '92%', '64%', '80%', '88%', '70%', '84%']

function dotClass(verse: VerseListItem): string {
  if (verse.needsRelearning) return 'arc-dot arc-dot-relearn'
  if (isMemorized(verse)) return 'arc-dot arc-dot-memorized'
  if (verse.status === 'active') return 'arc-dot arc-dot-practicing'
  return 'arc-dot'
}

function StatusChip({ verse }: { verse: VerseListItem }) {
  if (verse.needsRelearning)
    return <span className='chip chip-relearn'>Relearning</span>
  if (isMemorized(verse))
    return <span className='chip chip-mastered'>Memorized</span>
  if (verse.status === 'active')
    return <span className='chip chip-practice'>In practice</span>
  return null
}

function ArcRowSkeleton({ width }: { width: string }) {
  return (
    <div className='arc-row'>
      <span className='arc-dot' aria-hidden='true' />
      <div className='arc-main'>
        <div className='arc-head'>
          <Skeleton variant='text' w='38%' h={14} />
          <Skeleton variant='chip' w={72} h={18} />
        </div>
        <Skeleton variant='text' w={width} style={{ marginTop: 5 }} />
      </div>
    </div>
  )
}

export default function ArcList({
  verses,
}: {
  verses: VerseListItem[] | null
}) {
  return (
    <div className='arc-list'>
      {verses
        ? verses.map((verse) => (
            <Link
              key={verse.id}
              to={`/verses/${verse.id}`}
              state={{ from: '/library' }}
              className='arc-row'
              style={{ color: 'inherit' }}
            >
              <span className={dotClass(verse)} aria-hidden='true' />
              <div className='arc-main'>
                <div className='arc-head'>
                  <span className='arc-ref'>{verse.reference}</span>
                  <StatusChip verse={verse} />
                </div>
                <p className='arc-snippet'>{verse.text}</p>
              </div>
            </Link>
          ))
        : Array.from({ length: SKELETON_ROWS }, (_, i) => (
            <ArcRowSkeleton key={i} width={SKELETON_WIDTHS[i]} />
          ))}
    </div>
  )
}
