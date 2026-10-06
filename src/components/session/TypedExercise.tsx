import { useState } from 'react'
import type { SessionExercise } from '../../api/types'
import TranslationTag from '../TranslationTag'
import {
  normalizeTypedText,
  upgradeProgress,
  usesReferencePhase,
} from '../../lib/exercise'
import { referencesMatch } from '../../lib/reference'
import NextButton from './NextButton'
import TypedResult, {
  type ReferenceOutcome,
  type TypedOutcome,
} from './TypedResult'
import ReferencePrompt from './ReferencePrompt'
import UpgradeMeter from '../UpgradeMeter'

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

function isPassing(result: TypedOutcome, refResult: ReferenceOutcome): boolean {
  return result === 'correct' && refResult !== 'incorrect'
}

function HiddenReference() {
  return (
    <p className='verse-ref ref-line' aria-label='Reference hidden'>
      <span className='blank ref-slot ref-book'> </span>
      <span className='ref-locus'>
        <span className='blank ref-slot'> </span>
        <span aria-hidden='true'>:</span>
        <span className='blank ref-slot'> </span>
      </span>
    </p>
  )
}

/** The whole verse typed from memory, then its reference. Case, punctuation
    and spacing are forgiven. */
export default function TypedExercise({
  exercise,
  fullText,
  translation,
  today,
  isLast,
  moving,
  onRecord,
  onNext,
}: Props) {
  const [value, setValue] = useState('')
  const [result, setResult] = useState<TypedOutcome | null>(null)
  const [refResult, setRefResult] = useState<ReferenceOutcome>(null)

  const asksReference = usesReferencePhase(exercise.stage)
  const askingReference = result !== null && asksReference && refResult === null
  const isFinished = result !== null && (!asksReference || refResult !== null)
  const passed = isPassing(result ?? 'incorrect', refResult)

  function recordUnlessReferenceFollows(
    outcome: TypedOutcome,
    reference: ReferenceOutcome,
  ) {
    if (!asksReference) onRecord(isPassing(outcome, reference))
  }

  function check() {
    const outcome: TypedOutcome =
      normalizeTypedText(value) === normalizeTypedText(fullText)
        ? 'correct'
        : 'incorrect'
    setResult(outcome)
    recordUnlessReferenceFollows(outcome, refResult)
  }

  function checkReference(typed: string) {
    const outcome: ReferenceOutcome = referencesMatch(
      typed,
      exercise.reference,
    )
      ? 'correct'
      : 'incorrect'
    setRefResult(outcome)
    onRecord(isPassing(result ?? 'incorrect', outcome))
  }

  return (
    <div className='stack exercise-rise'>
      <div className='chip-row'>
        <UpgradeMeter progress={upgradeProgress(exercise.userVerse, today)} />
      </div>

      <div className='verse-card'>
        <div className='verse-card-head' style={{ marginBottom: 0 }}>
          {askingReference ? (
            <HiddenReference />
          ) : (
            <p className='verse-ref'>{exercise.reference}</p>
          )}
          <TranslationTag code={translation} />
        </div>
        <p className='small muted' style={{ fontWeight: 600, marginTop: 6 }}>
          Write it out. Spelling and punctuation are forgiven.
        </p>
        <textarea
          className='typed-input'
          style={{ marginTop: 14 }}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={result !== null}
          autoCapitalize='sentences'
          autoCorrect='off'
          spellCheck={false}
          aria-label='Type the verse from memory'
        />
        {result === null && (
          <div className='peek-row'>
            <span className='peek-label'>Stuck?</span>
            <button
              type='button'
              className='peek-btn'
              onClick={() => {
                setResult('shown')
                recordUnlessReferenceFollows('shown', refResult)
              }}
            >
              Show the verse
            </button>
          </div>
        )}
      </div>

      {result === null && (
        <button
          type='button'
          className='btn'
          onClick={check}
          disabled={value.trim().length === 0}
        >
          Check
        </button>
      )}

      {askingReference && <ReferencePrompt onCheck={checkReference} />}

      {isFinished && result !== null && (
        <>
          <TypedResult
            result={result}
            refResult={refResult}
            fullText={fullText}
            reference={exercise.reference}
          />
          <NextButton
            isLast={isLast}
            pending={moving}
            onClick={() => onNext(passed)}
          />
        </>
      )}
    </div>
  )
}
