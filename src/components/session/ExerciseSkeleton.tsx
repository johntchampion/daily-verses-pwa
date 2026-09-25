import { Skeleton, SkeletonText } from '../Skeleton'
import { BANK_ROWS, TILE_SHADOW_HEIGHT } from '../../lib/wordBank'

/** Tile widths for the word-bank placeholder — varied, so it reads as words. */
const SKELETON_TILES = [96, 68, 118, 82, 74, 104, 88, 70, 112]

/** A rendered `.tile`'s own height — 12px of padding and 1.5px of border each
    side around one line of 1.1rem serif — and the row gap `.word-bank` sets. */
const SKELETON_TILE_H = 52
const SKELETON_ROW_GAP = 11

/** The same sum `heightOfRows` measures once real tiles exist, so the dock
    lands at its final height before there is anything to measure. */
const SKELETON_BANK_H =
  BANK_ROWS * SKELETON_TILE_H +
  (BANK_ROWS - 1) * SKELETON_ROW_GAP +
  TILE_SHADOW_HEIGHT

export default function ExerciseSkeleton() {
  return (
    <div className='exercise-pane'>
      <div className='chip-row'>
        <Skeleton variant='chip' w={132} h={30} />
        <Skeleton variant='chip' w={64} h={16} />
      </div>

      <div className='verse-card'>
        <div className='verse-card-head'>
          <Skeleton variant='text' w='42%' h={13} />
          <Skeleton variant='chip' w={44} h={22} />
        </div>
        <SkeletonText lines={3} widths={['100%', '94%', '58%']} />
      </div>

      <div className='bank-dock'>
        <p className='bank-label'>Tap the missing words</p>
        <div
          className='word-bank'
          aria-hidden='true'
          style={{ height: SKELETON_BANK_H }}
        >
          {SKELETON_TILES.map((w, i) => (
            <Skeleton
              key={i}
              w={w}
              h={SKELETON_TILE_H}
              style={{ borderRadius: 16 }}
            />
          ))}
        </div>
        <button
          type='button'
          className='btn'
          style={{ marginTop: 20 }}
          disabled
        >
          Next verse →
        </button>
      </div>
    </div>
  )
}
