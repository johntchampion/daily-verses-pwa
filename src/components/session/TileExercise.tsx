import { useMemo, useRef, useState } from 'react'
import type { SessionExercise } from '../../api/types'
import TranslationTag from '../TranslationTag'
import { slipBudget, splitIntoChunks, wordsMatch } from '../../lib/exercise'
import type { ReferenceStepKind } from '../../lib/reference'
import { useBankWindow } from '../../hooks/useBankWindow'
import { useFlashTimers } from '../../hooks/useFlashTimers'
import { useReferenceDrill } from '../../hooks/useReferenceDrill'
import { useScrollToTarget } from '../../hooks/useScrollToTarget'
import { StageChip } from './ExerciseChips'
import NextButton from './NextButton'
import ReferenceBank from './ReferenceBank'
import ReferenceLine from './ReferenceLine'
import SlipHearts from './SlipHearts'
import VerseBody from './VerseBody'
import WordBank from './WordBank'

interface Props {
  exercise: SessionExercise
  fullText: string
  translation: string
  isLast: boolean
  pending: boolean
  onComplete: (correct: boolean) => void
}

const REFERENCE_PROMPTS: Record<ReferenceStepKind, string> = {
  book: 'Tap the book',
  chapter: 'Tap the chapter',
  verse: 'Tap the verse',
}

/**
 * Tile exercise: validates on tap. A correct tile fills the next empty blank; a
 * wrong tile shakes and changes nothing.
 */
export default function TileExercise({
  exercise,
  fullText,
  translation,
  isLast,
  pending,
  onComplete,
}: Props) {
  const { chunks, blanks } = useMemo(
    () => splitIntoChunks(exercise.blankedText, fullText),
    [exercise.blankedText, fullText],
  )

  const [filledBlanks, setFilledBlanks] = useState(0)
  const [wrongTileId, setWrongTileId] = useState<number | null>(null)
  const [misses, setMisses] = useState(0)

  const currentBlankRef = useRef<HTMLSpanElement | null>(null)
  const dockRef = useRef<HTMLDivElement | null>(null)
  const flash = useFlashTimers()

  const textDone = filledBlanks >= blanks.length

  const bank = useBankWindow(exercise.wordBank, blanks, filledBlanks)
  const drill = useReferenceDrill(exercise.stage, exercise.reference, textDone)
  const isComplete = textDone && drill.step === null

  const budget = slipBudget(blanks.length, drill.hasSteps)

  useScrollToTarget({
    filledBlanks,
    filledRefSteps: drill.filled,
    inReferencePhase: drill.step !== null,
    targetRef: currentBlankRef,
    dockRef,
  })

  function rejectTap(tileId: number) {
    setMisses((count) => count + 1)
    setWrongTileId(tileId)
    flash(() => setWrongTileId(null))
  }

  function tapTile(tileId: number, position: number) {
    if (textDone || bank.spentTiles.has(tileId)) return

    const answer = blanks[filledBlanks].answer
    if (!wordsMatch(bank.labels[tileId], answer)) {
      rejectTap(tileId)
      return
    }

    bank.spendTile(tileId, position, answer)
    setWrongTileId(null)
    setFilledBlanks(filledBlanks + 1)
  }

  // `wrongTileId` holds a chip position here rather than a tile id; the two
  // banks never render together, so they can share it.
  function tapRefChip(choice: string, position: number) {
    if (!drill.step) return

    if (choice !== drill.step.answer) {
      rejectTap(position)
      return
    }

    setWrongTileId(null)
    drill.advance()
  }

  return (
    <div className='exercise-pane'>
      <div className='chip-row exercise-rise'>
        <StageChip exercise={exercise} />
        <SlipHearts
          budget={budget}
          misses={misses}
          className='slip-hearts-head'
        />
      </div>

      <div className='verse-card exercise-rise'>
        <div className='verse-card-head'>
          {drill.phase ? (
            <ReferenceLine steps={drill.phase} filled={drill.filled} />
          ) : (
            <p className='verse-ref'>{exercise.reference}</p>
          )}
          <TranslationTag code={translation} />
        </div>
        <VerseBody
          chunks={chunks}
          filledBlanks={filledBlanks}
          currentBlankRef={currentBlankRef}
        />
      </div>

      <div className='bank-dock' ref={dockRef}>
        <div className='bank-label-row'>
          {/* A live region: this only changes when the drill asks for the next
              part of the reference. */}
          <p className='bank-label' role='status'>
            {drill.board
              ? REFERENCE_PROMPTS[drill.board.kind]
              : 'Tap the missing words'}
          </p>
          <SlipHearts
            budget={budget}
            misses={misses}
            className='slip-hearts-dock'
          />
        </div>

        {drill.board ? (
          <ReferenceBank
            board={drill.board}
            isDone={drill.step === null}
            wrongPosition={wrongTileId}
            minHeight={bank.bankHeight}
            onTap={tapRefChip}
          />
        ) : (
          <WordBank
            tileIds={bank.onScreen}
            labels={bank.labels}
            spentTiles={bank.spentTiles}
            wrongTileId={wrongTileId}
            disabled={textDone}
            height={bank.bankHeight}
            bankRef={bank.bankRef}
            onTap={tapTile}
          />
        )}

        <NextButton
          isLast={isLast}
          pending={pending}
          disabled={!isComplete}
          style={{ marginTop: 20 }}
          onClick={() => onComplete(misses <= budget)}
        />
      </div>
    </div>
  )
}
