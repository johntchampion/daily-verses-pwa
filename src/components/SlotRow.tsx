import { Link } from 'react-router-dom'
import type { SlotVerse } from '../api/types'
import { Skeleton, SkeletonText } from './Skeleton'
import { truncate } from '../lib/verses'
import { useIsDesktop } from '../hooks/useIsDesktop'
import UpgradeMeter, { UpgradeMeterEmpty } from './UpgradeMeter'
import { STAGE_LABELS, slotUpgradeProgress } from '../lib/exercise'

interface Props {
  slot: number
  verse: SlotVerse | null
  snippet: string | null
  today: string
}

export default function SlotRow({ slot, verse, snippet, today }: Props) {
  const desktop = useIsDesktop()

  if (verse) {
    return (
      <Link
        to={`/verses/${verse.verseId}`}
        state={{ from: '/practicing' }}
        className='slot-card'
        style={{ color: 'inherit' }}
      >
        <div className='slot-card-head'>
          <span className='slot-reference'>
            {verse.reference ?? verse.verseId}
          </span>
          <span className='chip chip-active'>{STAGE_LABELS[verse.stage]}</span>
        </div>
        {snippet && (
          <p className='slot-snippet'>&ldquo;{desktop ? snippet : truncate(snippet)}&rdquo;</p>
        )}

        <div className='slot-upgrade'>
          <UpgradeMeter progress={slotUpgradeProgress(verse, today)} />
        </div>
      </Link>
    )
  }

  return (
    <div className='slot-empty'>
      <div>
        <div className='slot-empty-title'>Slot {slot}</div>
        <div className='slot-empty-copy'>
          Open — waiting for a verse to come into practice
        </div>
      </div>
    </div>
  )
}

export function SlotRowSkeleton() {
  return (
    <div className='slot-card'>
      <div className='slot-card-head'>
        <Skeleton variant='text' w='44%' h={15} />
        <Skeleton variant='chip' w={78} h={20} />
      </div>
      <p className='slot-snippet' aria-hidden='true'>
        <SkeletonText lines={2} widths={['100%', '54%']} />
      </p>
      <div className='slot-upgrade'>
        <span className='upgrade-meter'>
          <UpgradeMeterEmpty />
          <Skeleton variant='text' w={104} h={10} style={{ margin: 0 }} />
        </span>
      </div>
    </div>
  )
}
