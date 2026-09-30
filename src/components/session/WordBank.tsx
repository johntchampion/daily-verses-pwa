import type { RefObject } from 'react'
import { useTileShift } from '../../hooks/useTileShift'
import WordTile from './WordTile'

export default function WordBank({
  tileIds,
  labels,
  spentTiles,
  wrongTileId,
  visible,
  cuedPosition,
  matched,
  disabled,
  height,
  bankRef,
  onTap,
}: {
  tileIds: number[]
  labels: string[]
  spentTiles: ReadonlySet<number>
  wrongTileId: number | null
  visible: ReadonlySet<number>
  cuedPosition: number | null
  matched: number
  disabled: boolean
  height: number | null
  bankRef: RefObject<HTMLDivElement | null>
  onTap: (tileId: number, position: number) => void
}) {
  useTileShift(bankRef, tileIds, labels)

  return (
    <div
      className='word-bank'
      role='group'
      aria-label='Word bank'
      ref={bankRef}
      style={height !== null ? { height } : undefined}
    >
      {tileIds.map((tileId, position) => {
        const isSpent = spentTiles.has(tileId)
        return (
          <WordTile
            key={tileId}
            label={labels[tileId]}
            isSpent={isSpent}
            isWrong={wrongTileId === tileId}
            isCued={cuedPosition === position}
            matched={matched}
            isHidden={!visible.has(position)}
            disabled={isSpent || disabled}
            onTap={() => onTap(tileId, position)}
          />
        )
      })}
    </div>
  )
}
