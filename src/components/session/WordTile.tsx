import { useState } from 'react'

export default function WordTile({
  label,
  isSpent,
  isWrong,
  isCued,
  matched = 0,
  isHidden = false,
  disabled,
  onTap,
}: {
  label: string
  isSpent: boolean
  isWrong: boolean
  /** Under the keyboard cursor: Enter picks this one. */
  isCued?: boolean
  /** Leading characters the keyboard filter matched, tinted so it's visible
      why this tile survived. */
  matched?: number
  /** Filtered out. `hidden` rather than unmounted: the tile keeps its identity,
      so it doesn't replay its arrival pop every time the filter clears. */
  isHidden?: boolean
  disabled: boolean
  onTap: () => void
}) {
  const [isArriving, setIsArriving] = useState(true)

  const state = isSpent
    ? ' tile-used'
    : isWrong
      ? ' tile-wrong'
      : isCued
        ? ' tile-cued'
        : ''
  const lead = isSpent ? '' : label.slice(0, matched)

  return (
    <button
      type='button'
      className={`tile${isArriving ? ' tile-in' : ''}${state}`}
      hidden={isHidden}
      disabled={disabled}
      onAnimationEnd={(event) => {
        if (event.animationName === 'tile-in') setIsArriving(false)
      }}
      onClick={onTap}
    >
      {lead ? (
        <>
          <span className='tile-lead'>{lead}</span>
          {label.slice(lead.length)}
        </>
      ) : (
        label
      )}
    </button>
  )
}
