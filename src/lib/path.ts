import type { SessionExercise } from '../api/types'
import { BLANK, STAGE_SHORT_LABELS } from './exercise'

export type PathState = 'done' | 'current' | 'upcoming'

export interface PathNode {
  index: number
  state: PathState
  /** Heading to draw above this stop, or null to continue the group above. */
  group: string | null
  reference: string
  meta: string
}

export interface Path {
  nodes: PathNode[]
  done: number
  total: number
  /** -1 once the day's plan is finished. */
  currentIndex: number
  complete: boolean
  reviewCount: number
  roundCount: number
  secondsLeft: number
  next: PathNode | null
}

const BASE_SECONDS_PER_EXERCISE = 8
const SECONDS_PER_BLANK = 2.5

function estimateSeconds(exercise: SessionExercise): number {
  const blanks = exercise.blankedText.split(BLANK).length - 1
  return BASE_SECONDS_PER_EXERCISE + SECONDS_PER_BLANK * blanks
}

function durationLabel(seconds: number): string {
  if (seconds >= 90) return `${Math.round(seconds / 60)} min`
  return `${Math.round(seconds / 5) * 5} sec`
}

export function minutesLabel(seconds: number): string {
  return `about ${Math.max(1, Math.round(seconds / 60))} min`
}

export function buildPath(exercises: SessionExercise[]): Path {
  const rounds = new Map<string, number>()
  let previousGroup: string | null = null
  let reviewCount = 0
  let secondsLeft = 0
  let currentIndex = -1

  const nodes = exercises.map((exercise, index): PathNode => {
    let group: string
    if (exercise.queue === 'review') {
      group = 'Coming back today'
      reviewCount += 1
    } else {
      const round = (rounds.get(exercise.userVerseId) ?? 0) + 1
      rounds.set(exercise.userVerseId, round)
      group = `Round ${round}`
    }
    const groupHeading = group === previousGroup ? null : group
    previousGroup = group

    if (!exercise.completed) {
      secondsLeft += estimateSeconds(exercise)
      if (currentIndex === -1) currentIndex = index
    }

    return {
      index,
      state: exercise.completed ? 'done' : 'upcoming',
      group: groupHeading,
      reference: exercise.reference,
      meta: exercise.completed
        ? 'done'
        : `${STAGE_SHORT_LABELS[exercise.stage]} · ${durationLabel(estimateSeconds(exercise))}`,
    }
  })

  if (currentIndex !== -1) nodes[currentIndex].state = 'current'

  const done = exercises.filter((exercise) => exercise.completed).length
  return {
    nodes,
    done,
    total: exercises.length,
    currentIndex,
    complete: exercises.length > 0 && currentIndex === -1,
    reviewCount,
    roundCount: exercises.length - reviewCount,
    secondsLeft,
    next: currentIndex === -1 ? null : nodes[currentIndex],
  }
}
