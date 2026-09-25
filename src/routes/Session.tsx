import { useSearchParams } from 'react-router-dom'
import ExerciseSkeleton from '../components/session/ExerciseSkeleton'
import SessionComplete from '../components/session/SessionComplete'
import SessionEmpty from '../components/session/SessionEmpty'
import SessionErrorAlert from '../components/session/SessionErrorAlert'
import SessionHeader from '../components/session/SessionHeader'
import TileExercise from '../components/session/TileExercise'
import TypedExercise from '../components/session/TypedExercise'
import { useSessionRunner } from '../hooks/useSessionRunner'
import { cx } from '../lib/cx'

/**
 * The exercise runner's screen. `?practice=1` runs the separate drill instead:
 * one round of each slotted verse, counting toward nothing, for a day whose
 * path is already walked.
 */
export default function Session() {
  const [searchParams] = useSearchParams()
  const practice = searchParams.get('practice') === '1'
  const session = useSessionRunner(practice)

  const errorAlert = (
    <SessionErrorAlert error={session.error} onDismiss={session.clearError} />
  )

  if (session.phase === 'empty') return <SessionEmpty practice={practice} />

  if (session.phase === 'done' && session.completion) {
    return (
      <SessionComplete
        streak={session.completion.streak}
        recorded={session.completion.recorded}
        practice={practice}
        exercises={session.dayTotal}
        verses={session.dayVerses}
        correct={session.correctCount}
        events={session.events}
      />
    )
  }

  const loading = session.phase === 'loading'
  const wrapping = session.phase === 'wrapping'
  const advancing = session.advancing
  const opening = session.exerciseKey === 0
  const Exercise =
    session.exercise?.exerciseType === 'tile_fill_blank'
      ? TileExercise
      : TypedExercise

  return (
    // The last answer doesn't clear the screen: the session holds its shape and
    // recedes while the rail closes over it, so the recap arrives as the end of
    // something rather than after a gap.
    <main
      className={cx(
        'shell stack shell-full session-view',
        opening && 'session-opening',
        advancing && 'session-advancing',
        wrapping && 'session-wrapping',
        session.leaving && 'session-leaving',
      )}
      aria-busy={loading}
    >
      {loading && (
        <span className='sr-only' role='status'>
          Preparing today&rsquo;s session…
        </span>
      )}

      <SessionHeader
        done={session.done + (advancing || wrapping ? 1 : 0)}
        total={session.dayTotal}
      />

      {loading ? (
        <ExerciseSkeleton />
      ) : (
        <Exercise
          key={session.exerciseKey}
          exercise={session.exercise}
          fullText={session.fullText}
          translation={session.translation}
          today={session.today}
          isLast={session.isLast}
          pending={session.submitting}
          onComplete={(correct) => void session.submit(correct)}
        />
      )}

      {((wrapping && !session.leaving) || advancing) && (
        <p className='wrap-note' role='status'>
          {wrapping ? 'Wrapping up…' : 'Saving…'}
        </p>
      )}
      {errorAlert}
    </main>
  )
}
