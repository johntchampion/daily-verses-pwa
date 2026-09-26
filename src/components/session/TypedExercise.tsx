import { useState } from 'react'
import type { SessionExercise } from '../../api/types'
import TranslationTag from '../TranslationTag'
import { normalizeTypedText, usesReferencePhase } from '../../lib/exercise'
import { referencesMatch } from '../../lib/reference'
import NextButton from './NextButton'
import TypedResult, {
  type ReferenceOutcome,
  type TypedOutcome,
} from './TypedResult'
import ReferencePrompt from './ReferencePrompt'
import UpgradeMeter from './UpgradeMeter'

interface Props {
  exercise: SessionExercise
  fullText: string
  translation: string
  today: string | null
  isLast: boolean
  moving: boolean
  /** Fired the instant the exercise is judged, so the attempt is in before the
      user asks to move on. */
  onRecord: (correct: boolean) => void
  onNext: (correct: boolean) => void
}

/** One definition of the verdict, so the render and the handlers that record it
    cannot drift apart. */
function judge(result: TypedOutcome, refResult: ReferenceOutcome): boolean {
  return result === 'correct' && refResult !== 'incorrect'
}

/** The reference line with nothing in it, so the question can be asked. */
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

/**
 * Typed exercise: full recall into one free-text input, validated on "Check".
 * Case, punctuation and spacing are forgiven; the words must all be there, in
 * order. "Show the verse" trades the attempt for a re-read.
 *
 * Checking then asks for the reference, which was the *prompt* here — hiding it
 * the moment Check is pressed is what makes it a question. It is asked even
 * after a wrong or shown verse: branching would double the state machine.
 */
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

  // Stage alone — unlike the tile path this needs no decomposition, since
  // `referencesMatch` falls back to a string compare for anything odd.
  const asksReference = usesReferencePhase(exercise.stage)
  const askingReference = result !== null && asksReference && refResult === null
  const judged = result !== null && (!asksReference || refResult !== null)
  const passed = judge(result ?? 'incorrect', refResult)

  // Each of these records from the step that finishes the exercise, not from
  // Next. The `!asksReference` branches are unreachable today — a typed exercise
  // only happens at `mastered`, which does ask — but they have to exist, or a
  // future stage change would silently strand the card with nothing recorded.
  function settle(outcome: TypedOutcome, reference: ReferenceOutcome) {
    if (!asksReference) onRecord(judge(outcome, reference))
  }

  function check() {
    const outcome: TypedOutcome =
      normalizeTypedText(value) === normalizeTypedText(fullText)
        ? 'correct'
        : 'incorrect'
    setResult(outcome)
    settle(outcome, refResult)
  }

  function checkReference(typed: string) {
    const outcome: ReferenceOutcome = referencesMatch(
      typed,
      exercise.reference,
    )
      ? 'correct'
      : 'incorrect'
    setRefResult(outcome)
    // The reference is the last step, so the exercise is finished here.
    onRecord(judge(result ?? 'incorrect', outcome))
  }

  return (
    <div className='stack exercise-rise'>
      <div className='chip-row'>
        <UpgradeMeter exercise={exercise} today={today} />
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
                settle('shown', refResult)
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

      {judged && result !== null && (
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
