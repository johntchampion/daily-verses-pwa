import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import type { SessionExercise } from '../api/types'
import { todayInTimezone } from '../lib/dates'
import { messageOf } from '../lib/errors'
import { hold } from '../lib/motion'
import { clearDailyReminder } from '../lib/push'
import { presentEvent, type SessionEvent } from '../lib/sessionEvents'

export type SessionPhase = 'loading' | 'empty' | 'running' | 'wrapping' | 'done'

export interface SessionError {
  message: string
  retry: () => void
}

const WRAP_HOLD_MS = 520
const EXIT_MS = 200
const ADVANCE_MS = 200

type QueuedExercise = SessionExercise & { recorded?: boolean }

type AttemptResult =
  | { ok: true; outcome: Awaited<ReturnType<typeof api.attempt>> }
  | { ok: false; error: unknown }

export function useSessionRunner(practice: boolean) {
  const [phase, setPhase] = useState<SessionPhase>('loading')
  const [queue, setQueue] = useState<QueuedExercise[]>([])
  const [alreadyDone, setAlreadyDone] = useState(0)
  const [dayTotal, setDayTotal] = useState(0)
  const [dayVerses, setDayVerses] = useState(0)
  const [texts, setTexts] = useState<Record<string, string>>({})
  const [translation, setTranslation] = useState('')
  const [timezone, setTimezone] = useState<string | null>(null)
  const [index, setIndex] = useState(0)
  const [moving, setMoving] = useState(false)
  const [error, setError] = useState<SessionError | null>(null)
  const [events, setEvents] = useState<SessionEvent[]>([])
  const [completion, setCompletion] = useState<{
    recorded: boolean
    streak: number | null
  } | null>(null)
  const [leaving, setLeaving] = useState(false)
  const [leavingIndex, setLeavingIndex] = useState<number | null>(null)
  const loadTokenRef = useRef(0)
  const attemptRef = useRef<{
    key: string
    promise: Promise<AttemptResult>
  } | null>(null)
  /** A ref, not state: two taps in one frame would both see stale state. */
  const movingRef = useRef(false)

  const load = useCallback(async function load() {
    const token = ++loadTokenRef.current
    setError(null)
    setPhase('loading')
    try {
      const today = await api.sessionToday(practice)
      const outstanding = today.exercises.filter((e) => !e.completed)
      if (outstanding.length === 0) {
        if (loadTokenRef.current !== token) return
        setPhase('empty')
        return
      }
      const ids = [...new Set(outstanding.map((e) => e.verseId))]
      const [details, profile] = await Promise.all([
        Promise.all(ids.map((id) => api.verse(id))),
        api.me().catch(() => null),
      ])
      const byId: Record<string, string> = {}
      for (const detail of details) {
        if (!detail.verse.text) throw new Error('verse text unavailable')
        if (detail.translation !== today.translation) {
          throw new Error('Your translation changed — start the session again.')
        }
        byId[detail.verse.id] = detail.verse.text
      }
      // Guards against a stale response overwriting state from a newer load.
      if (loadTokenRef.current !== token) return
      setQueue(outstanding)
      setAlreadyDone(today.completedCount)
      setDayTotal(today.count)
      setDayVerses(new Set(today.exercises.map((e) => e.verseId)).size)
      setEvents(today.events.map(presentEvent))
      setTexts(byId)
      setTranslation(today.translation)
      setTimezone(profile?.user.timezone ?? null)
      setIndex(0)
      setLeavingIndex(null)
      setPhase('running')
    } catch (err) {
      if (loadTokenRef.current !== token) return
      setError({
        message: messageOf(err, 'Could not load today’s session.'),
        // Resolves to this function expression's own name, not the `const` it
        // is being assigned to, so the retry isn't reading an uninitialised binding.
        retry: () => void load(),
      })
    }
  }, [practice])

  useEffect(() => {
    void load()
  }, [load])

  const finish = useCallback(async () => {
    setError(null)
    setLeaving(false)
    setPhase('wrapping')
    try {
      const record = async () => {
        let recorded = false
        if (!practice) {
          const result = await api.sessionComplete()
          recorded = result.recorded
          if (result.events.length > 0) {
            setEvents((prev) => [...prev, ...result.events.map(presentEvent)])
          }
          void clearDailyReminder().catch(() => {})
        }
        let streak: number | null = null
        try {
          streak = (await api.me()).streak
        } catch {
          // Ignored: the session is already recorded.
        }
        return { recorded, streak }
      }
      const [result] = await Promise.all([record(), hold(WRAP_HOLD_MS)])
      setCompletion(result)
      setLeaving(true)
      await hold(EXIT_MS)
      setPhase('done')
    } catch (err) {
      setLeaving(false)
      setError({
        message: messageOf(err, 'Could not record the session.'),
        retry: () => void finish(),
      })
    }
  }, [practice])

  function ensureAttempt(correct: boolean): Promise<AttemptResult> {
    // Captured now: the `.then` below must mark the card this attempt was for
    // even if `index` has moved on by the time it resolves.
    const cardIndex = index
    const key = `${loadTokenRef.current}:${index}`
    const cached = attemptRef.current
    if (cached?.key === key) return cached.promise

    const exercise = queue[index]
    const post = async (): Promise<AttemptResult> => {
      try {
        return { ok: true, outcome: await attemptOnce(exercise, correct) }
      } catch (error) {
        return { ok: false, error }
      }
    }

    const promise = post().then((result) => {
      if (result.ok) {
        // Only `userVerse` is replaced; blankedText/wordBank/stage must survive
        // untouched or the card would reshape mid-exercise.
        setQueue((prev) =>
          prev.map((item, at) => {
            const moved =
              item.userVerseId === result.outcome.userVerse.id
                ? { ...item, userVerse: result.outcome.userVerse }
                : item
            return at === cardIndex ? { ...moved, recorded: true } : moved
          }),
        )
        if (result.outcome.events.length > 0) {
          setEvents((prev) => [
            ...prev,
            ...result.outcome.events.map(presentEvent),
          ])
        }
      } else {
        // Cleared so a later `next` posts again instead of replaying this failure.
        attemptRef.current = null
      }
      return result
    })

    attemptRef.current = { key, promise }
    return promise
  }

  async function attemptOnce(exercise: SessionExercise, correct: boolean) {
    try {
      return await api.attempt(
        exercise.userVerseId,
        exercise.exerciseType,
        correct,
      )
    } catch {
      return await api.attempt(
        exercise.userVerseId,
        exercise.exerciseType,
        correct,
      )
    }
  }

  function record(correct: boolean): void {
    void ensureAttempt(correct)
  }

  async function next(correct: boolean) {
    if (movingRef.current) return
    movingRef.current = true
    setMoving(true)

    const last = index + 1 >= queue.length
    if (!last) setLeavingIndex(index)

    try {
      const [result] = await Promise.all([
        ensureAttempt(correct),
        last ? Promise.resolve() : hold(ADVANCE_MS),
      ])

      if (!result.ok) {
        setLeavingIndex(null)
        setError({
          message: messageOf(result.error, 'Could not save that answer.'),
          retry: () => {
            setError(null)
            void next(correct)
          },
        })
        return
      }

      if (last) {
        await finish()
      } else {
        window.scrollTo({ top: 0 })
        attemptRef.current = null
        setIndex(index + 1)
      }
    } finally {
      movingRef.current = false
      setMoving(false)
    }
  }

  const recorded = queue[index]?.recorded === true

  return {
    phase,
    exercise: queue[index],
    fullText: texts[queue[index]?.verseId],
    translation,
    today: timezone === null ? null : todayInTimezone(timezone),
    isLast: index === queue.length - 1,
    record,
    next,
    moving,
    saving: moving && !recorded,
    error,
    clearError: () => setError(null),
    answered: alreadyDone + index + (recorded ? 1 : 0),
    position: Math.min(alreadyDone + index + 1, dayTotal),
    dayTotal,
    dayVerses,
    events,
    completion,
    leaving,
    advancing: leavingIndex === index,
    exerciseKey: index,
  }
}
