import { useMemo, useRef, useState } from 'react'
import type { SessionExercise } from '../../api/types'
import TranslationTag from '../TranslationTag'
import {
  allowedMissCount,
  splitIntoChunks,
  upgradeProgress,
  wordsMatch,
} from '../../lib/exercise'
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
import UpgradeMeter from '../UpgradeMeter'
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

/** Validates on tap: a correct tile fills the next blank, a wrong one shakes.
    The attempt is recorded from the completing tap, not an effect, so it can
    only post once. */
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
  const [wrongPick, setWrongPick] = useState<number | null>(null)
  const [misses, setMisses] = useState(0)
  const [query, setQuery] = useState('')
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

  const allowedMisses = allowedMissCount(blanks.length, drill.hasSteps)
  const wasCorrect = () => misses <= allowedMisses

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

  function rejectTap(pick: number) {
    setMisses((count) => count + 1)
    setWrongPick(pick)
    flash(() => setWrongPick(null))
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
    setWrongPick(null)
    setQuery('')
    const nextFilled = filledBlanks + 1
    setFilledBlanks(nextFilled)

    if (nextFilled >= blanks.length && !drill.hasSteps) onRecord(wasCorrect())
  }

  function tapRefChip(choice: string, position: number) {
    if (!drill.step) return

    if (choice !== drill.step.answer) {
      rejectTap(position)
      return
    }

    setWrongPick(null)
    setQuery('')
    if (drill.advance()) onRecord(wasCorrect())
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
    cursorResetKey: drill.board
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
    onIncompleteQuery: shakeTyping,
    onSubmitWithNothingCued:
      isComplete && !moving ? () => onNext(wasCorrect()) : null,
  })

  return (
    <div className='exercise-pane'>
      <div className='chip-row exercise-rise'>
        <UpgradeMeter progress={upgradeProgress(exercise.userVerse, today)} />
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
            wrongPosition={wrongPick}
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
            wrongTileId={wrongPick}
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
          onClick={() => onNext(wasCorrect())}
        />
      </div>
    </div>
  )
}
