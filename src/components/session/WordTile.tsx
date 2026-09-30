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
  isCued?: boolean
  /** Leading characters matched by the keyboard filter. */
  matched?: number
  /** Hidden rather than unmounted, so it doesn't replay its entrance. */
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
