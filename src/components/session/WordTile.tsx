import { useState } from 'react'

export default function WordTile({
  label,
  isSpent,
  isWrong,
  disabled,
  onTap,
}: {
  label: string
  isSpent: boolean
  isWrong: boolean
  disabled: boolean
  onTap: () => void
}) {
  const [isArriving, setIsArriving] = useState(true)

  const state = isSpent ? ' tile-used' : isWrong ? ' tile-wrong' : ''
  return (
    <button
      type='button'
      className={`tile${isArriving ? ' tile-in' : ''}${state}`}
      disabled={disabled}
      onAnimationEnd={(event) => {
        if (event.animationName === 'tile-in') setIsArriving(false)
      }}
      onClick={onTap}
    >
      {label}
    </button>
  )
}
