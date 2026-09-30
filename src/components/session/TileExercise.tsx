import { useMemo, useRef, useState } from 'react'
import type { SessionExercise } from '../../api/types'
import TranslationTag from '../TranslationTag'
import { slipBudget, splitIntoChunks, wordsMatch } from '../../lib/exercise'
import type { ReferenceStepKind } from '../../lib/reference'
import {
  useBankKeyboard,
  type BankCandidate,
} from '../../hooks/useBankKeyboard'
import { useBankWindow } from '../../hooks/useBankWindow'
import { useFlashTimers } from '../../hooks/useFlashTimers'
import { useReferenceDrill } from '../../hooks/useReferenceDrill'
import { useScrollToTarget } from '../../hooks/useScrollToTarget'
import BankKeys from './BankKeys'
import NextButton from './NextButton'
import ReferenceBank from './ReferenceBank'
import ReferenceLine from './ReferenceLine'
import UpgradeMeter from './UpgradeMeter'
import VerseBody from './VerseBody'
import WordBank from './WordBank'

interface Props {
  exercise: SessionExercise
  fullText: string
  translation: string
  today: string | null
  isLast: boolean
  moving: boolean
  onRecord: (correct: boolean) => void
  onNext: (correct: boolean) => void
}

const REFERENCE_PROMPTS: Record<ReferenceStepKind, string> = {
  book: 'Tap the book',
  chapter: 'Tap the chapter',
  verse: 'Tap the verse',
}

/**
 * Tile exercise: validates on tap. A correct tile fills the next empty blank; a
 * wrong tile shakes and changes nothing.
 *
 * Wrong taps are unlimited and uncounted as far as the user can tell. `misses`
 * is still kept, and still decides the `correct` this reports, because review
 * scheduling reads it — but nothing draws it. Guessing is meant to be free:
 * there is no budget to protect, so the only way through is to try a word.
 *
 * The attempt is recorded from the tap that completes the exercise rather than
 * from Next. Firing it here rather than from an effect makes exactly-once
 * structural — the response re-renders this component, so a render-driven fire
 * would post again on the answer to its own request.
 */
export default function TileExercise({
  exercise,
  fullText,
  translation,
  today,
  isLast,
  moving,
  onRecord,
  onNext,
}: Props) {
  const { chunks, blanks } = useMemo(
    () => splitIntoChunks(exercise.blankedText, fullText),
    [exercise.blankedText, fullText],
  )

  const [filledBlanks, setFilledBlanks] = useState(0)
  const [wrongTileId, setWrongTileId] = useState<number | null>(null)
  const [misses, setMisses] = useState(0)
  /** What has been typed to filter the bank. Owned here rather than by
      `useBankKeyboard` because the bank's fit pass has to be told the bank is
      being filtered, and it is measured before the keyboard is wired up. */
  const [query, setQuery] = useState('')
  /** The blank shakes the typing in it: a typed word that was wrong, or Space
      on one that isn't finished. */
  const [typedWrong, setTypedWrong] = useState(false)

  const currentBlankRef = useRef<HTMLSpanElement | null>(null)
  const dockRef = useRef<HTMLDivElement | null>(null)
  const flash = useFlashTimers()

  const textDone = filledBlanks >= blanks.length

  const bank = useBankWindow(
    exercise.wordBank,
    blanks,
    filledBlanks,
    query !== '',
  )
  const drill = useReferenceDrill(exercise.stage, exercise.reference, textDone)
  const isComplete = textDone && drill.step === null

  // Invisible: it sets the `correct` this reports and nothing else.
  const budget = slipBudget(blanks.length, drill.hasSteps)
  const judged = () => misses <= budget

  useScrollToTarget({
    filledBlanks,
    filledRefSteps: drill.filled,
    inReferencePhase: drill.step !== null,
    targetRef: currentBlankRef,
    dockRef,
  })

  function shakeTyping() {
    setTypedWrong(true)
    flash(() => setTypedWrong(false))
  }

  function rejectTap(tileId: number) {
    setMisses((count) => count + 1)
    setWrongTileId(tileId)
    flash(() => setWrongTileId(null))
    if (query !== '') shakeTyping()
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
    setQuery('')
    const nextFilled = filledBlanks + 1
    setFilledBlanks(nextFilled)

    // A correct tap never moves `misses`, so this render's value is final.
    if (nextFilled >= blanks.length && !drill.hasSteps) onRecord(judged())
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
    setQuery('')
    if (drill.advance()) onRecord(judged())
  }

  const candidates = useMemo<BankCandidate[]>(
    () =>
      drill.board
        ? drill.board.choices.map((choice) => ({
            label: choice,
            disabled: drill.step === null,
          }))
        : bank.onScreen.map((tileId) => ({
            label: bank.labels[tileId],
            disabled: textDone || bank.spentTiles.has(tileId),
          })),
    [
      bank.labels,
      bank.onScreen,
      bank.spentTiles,
      drill.board,
      drill.step,
      textDone,
    ],
  )

  const keys = useBankKeyboard({
    candidates,
    query,
    setQuery,
    // One phase per blank, so placing a word — by any key or a click — puts
    // the cursor away rather than leaving it on a tile for the next blank.
    phase: drill.board
      ? `reference-${drill.filled}`
      : `text-${filledBlanks}`,
    enabled: !moving,
    dockRef,
    onPick: (index) => {
      if (drill.board) tapRefChip(drill.board.choices[index], index)
      else if (index < bank.onScreen.length) {
        tapTile(bank.onScreen[index], index)
      }
    },
    // Not a miss: nothing was placed, so there is nothing to judge yet.
    onShort: shakeTyping,
    onSubmit: isComplete && !moving ? () => onNext(judged()) : null,
  })

  return (
    <div className='exercise-pane'>
      <div className='chip-row exercise-rise'>
        <UpgradeMeter exercise={exercise} today={today} />
      </div>

      <div className='verse-card exercise-rise'>
        <div className='verse-card-head'>
          {drill.phase ? (
            <ReferenceLine
              steps={drill.phase}
              filled={drill.filled}
              typed={drill.board ? query : ''}
              typedWrong={typedWrong}
            />
          ) : (
            <p className='verse-ref'>{exercise.reference}</p>
          )}
          <TranslationTag code={translation} />
        </div>
        <VerseBody
          chunks={chunks}
          filledBlanks={filledBlanks}
          currentBlankRef={currentBlankRef}
          typed={drill.board ? '' : query}
          typedWrong={typedWrong}
        />
      </div>

      <div className='bank-dock' ref={dockRef}>
        {/* A live region: this only changes when the drill asks for the next
            part of the reference. */}
        <p className='bank-label' role='status'>
          {drill.board
            ? REFERENCE_PROMPTS[drill.board.kind]
            : 'Tap the missing words'}
        </p>

        <BankKeys
          query={query}
          matches={keys.visible.size}
          isDone={isComplete}
        />

        {drill.board ? (
          <ReferenceBank
            board={drill.board}
            isDone={drill.step === null}
            wrongPosition={wrongTileId}
            visible={keys.visible}
            cuedPosition={keys.cued}
            matched={query.length}
            minHeight={bank.bankHeight}
            onTap={tapRefChip}
          />
        ) : (
          <WordBank
            tileIds={bank.onScreen}
            labels={bank.labels}
            spentTiles={bank.spentTiles}
            wrongTileId={wrongTileId}
            visible={keys.visible}
            cuedPosition={keys.cued}
            matched={query.length}
            disabled={textDone}
            height={bank.bankHeight}
            bankRef={bank.bankRef}
            onTap={tapTile}
          />
        )}

        <NextButton
          isLast={isLast}
          pending={moving}
          disabled={!isComplete}
          style={{ marginTop: 20 }}
          onClick={() => onNext(judged())}
        />
      </div>
    </div>
  )
}
