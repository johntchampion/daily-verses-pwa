import type { ReferenceStep } from '../../lib/reference'
import WordTile from './WordTile'

export default function ReferenceBank({
  board,
  isDone,
  wrongPosition,
  visible,
  cuedPosition,
  matched,
  minHeight,
  onTap,
}: {
  board: ReferenceStep
  isDone: boolean
  wrongPosition: number | null
  visible: ReadonlySet<number>
  cuedPosition: number | null
  matched: number
  minHeight: number | null
  onTap: (choice: string, position: number) => void
}) {
  return (
    <div
      className='word-bank ref-bank'
      role='group'
      aria-label='Reference choices'
      style={minHeight !== null ? { minHeight } : undefined}
    >
      {board.choices.map((choice, position) => (
        <WordTile
          key={choice}
          label={choice}
          isSpent={isDone && choice === board.answer}
          isWrong={wrongPosition === position}
          isCued={cuedPosition === position}
          matched={matched}
          isHidden={!visible.has(position)}
          disabled={isDone}
          onTap={() => onTap(choice, position)}
        />
      ))}
    </div>
  )
}
