import type { Stage, UserVerse } from '../api/types'

/**
 * The API sends `blankedText` but never an answer key, so answers are derived
 * client-side by aligning it against the full verse text.
 */

/** The backend's blank marker, as it appears in `blankedText`. */
export const BLANK = '____'

/** Word core: letters, digits, apostrophes and hyphens — matches the backend's
    exerciseBuilder, so the two tokenize identically. */
const WORD_RE = /[\p{L}\p{N}'’-]+/u

export interface TextSegment {
  kind: 'text'
  raw: string
}

export interface BlankSegment {
  kind: 'blank'
  punctBefore: string
  punctAfter: string
  answer: string
}

export type ExerciseSegment = TextSegment | BlankSegment

/** Both texts came from the same source split on whitespace, so token indexes
    correspond 1:1. */
export function parseExercise(
  blankedText: string,
  fullText: string,
): ExerciseSegment[] {
  const blankedTokens = blankedText.split(/\s+/).filter(Boolean)
  const fullTokens = fullText.split(/\s+/).filter(Boolean)

  if (blankedTokens.length !== fullTokens.length) {
    throw new Error('exercise text does not align with verse text')
  }

  return blankedTokens.map((token, i): ExerciseSegment => {
    const blankAt = token.indexOf(BLANK)
    if (blankAt === -1) return { kind: 'text', raw: token }

    const fullRaw = fullTokens[i]
    const match = WORD_RE.exec(fullRaw)
    if (!match) return { kind: 'text', raw: fullRaw }

    const answer = match[0]
    const punctBefore = fullRaw.slice(0, match.index)

    return {
      kind: 'blank',
      punctBefore,
      punctAfter: fullRaw.slice(match.index + answer.length),
      answer,
    }
  })
}

export type VerseChunk =
  | { kind: 'text'; text: string }
  | { kind: 'blank'; blankIndex: number; blank: BlankSegment }

/** `parseExercise`, with the blanks also collected in fill order. */
export function splitIntoChunks(
  blankedText: string,
  fullText: string,
): { chunks: VerseChunk[]; blanks: BlankSegment[] } {
  const blanks: BlankSegment[] = []
  const chunks = parseExercise(blankedText, fullText).map(
    (segment): VerseChunk => {
      if (segment.kind === 'text') return { kind: 'text', text: segment.raw }
      blanks.push(segment)
      return { kind: 'blank', blankIndex: blanks.length - 1, blank: segment }
    },
  )
  return { chunks, blanks }
}

/** Curly quotes and apostrophes are the same character to a reader. */
const canonWord = (w: string) => w.replace(/’/g, "'")

export function wordsMatch(a: string, b: string): boolean {
  return canonWord(a).toLowerCase() === canonWord(b).toLowerCase()
}

/** As `wordsMatch`, but casing has to agree too. */
export function wordsMatchExactly(a: string, b: string): boolean {
  return canonWord(a) === canonWord(b)
}

/** Case, punctuation and extra whitespace don't count against recall. */
export function normalizeTypedText(text: string): string {
  return text
    .toLowerCase()
    .replace(/’/g, "'")
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Fisher-Yates, leaving the input alone. */
export function shuffle<T>(items: T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function randomIndex(exclusiveMax: number): number {
  return Math.floor(Math.random() * exclusiveMax)
}

/** Display-only mirrors of the service's `domain/progression.ts` — they must
    agree with it, so they live here rather than at call sites. There is no
    downgrade threshold: a slotted tier only ever moves up. */
export const TIER_ADVANCE_THRESHOLD = 3
export const REVIEW_ADVANCE_THRESHOLD = 3
export const REVIEW_DEMOTION_THRESHOLD = 2

/** The review interval ladder, in days. */
export const INTERVAL_PROGRESSION = [1, 3, 7, 14, 30]

export const STAGE_SEQUENCE: Stage[] = [
  'learning_light',
  'learning_medium',
  'learning_heavy',
  'review',
  'mastered',
]

/** The three slotted tiers, in order. */
export const LEARNING_ORDER: Stage[] = [
  'learning_light',
  'learning_medium',
  'learning_heavy',
]

export function isLearningStage(stage: Stage): boolean {
  return LEARNING_ORDER.includes(stage)
}

export const STAGE_LABELS: Record<Stage, string> = {
  learning_light: 'Easy - few blanks',
  learning_medium: 'Medium - half blanks',
  learning_heavy: 'Hard - tons of blanks',
  review: 'In review',
  mastered: 'Mastered',
}

export const STAGE_SHORT_LABELS: Record<Stage, string> = {
  learning_light: 'Easy',
  learning_medium: 'Medium',
  learning_heavy: 'Hard',
  review: 'Memorized',
  mastered: 'Mastered',
}

export const SLIP_PER_BLANKS = 20

export function slipBudget(blankCount: number, hasReference: boolean): number {
  return 1 + (hasReference ? 1 : 0) + Math.floor(blankCount / SLIP_PER_BLANKS)
}

/** Every stage but the gentlest: at `learning_light` the words themselves are
    still new, so the reference would be a second unlearned thing at once. */
export function usesReferencePhase(stage: Stage): boolean {
  return stage !== 'learning_light'
}

export const MAX_INTERVAL_DAYS =
  INTERVAL_PROGRESSION[INTERVAL_PROGRESSION.length - 1]

/** Null at the top of the learning ladder, which is the signal to graduate. */
export function nextLearningStage(stage: Stage): Stage | null {
  const tier = LEARNING_ORDER.indexOf(stage)
  if (tier === -1 || tier === LEARNING_ORDER.length - 1) return null
  return LEARNING_ORDER[tier + 1]
}

/** The rung a passed review run moves the interval to. */
function nextInterval(current: number): number {
  return INTERVAL_PROGRESSION.find((days) => days > current) ?? MAX_INTERVAL_DAYS
}

/**
 * What the next correct answers are worth, in the terms the session's upgrade
 * meter draws them.
 *
 * `run` is a live run that can still be extended today; `spent` is a verse
 * whose move for the day is already made, so further answers are plain
 * practice; `rule` states the requirement without the numbers, for when the
 * profile timezone hasn't arrived and the same-day gates can't be read.
 */
export type UpgradeProgress =
  | {
      kind: 'run'
      done: number
      needed: number
      total: number
      /** Where the run leads: a tier name, or the interval it stretches to. */
      target: string
      sameDay: boolean
    }
  | { kind: 'spent'; sameDay: boolean }
  | { kind: 'rule'; sameDay: boolean }
  | { kind: 'top' }

/** Another display-only mirror of the service's `advance()`, under the same
    obligation as the thresholds above: it has to agree with it. `today` is the
    user's local date, null while the profile is still loading. */
export function upgradeProgress(
  userVerse: UserVerse,
  today: string | null,
): UpgradeProgress {
  const { stage } = userVerse

  // The ceiling, and the one answer that needs no date to be sure of.
  if (stage === 'mastered') return { kind: 'top' }

  const sameDay = isLearningStage(stage)
  if (today === null) return { kind: 'rule', sameDay }

  if (sameDay) {
    // It's the upgrade that spends the day's one tier change, so a verse that
    // has already taken it can't move again however the run goes.
    if (userVerse.last_upgrade_date === today) return { kind: 'spent', sameDay }

    // A run from an earlier day is dead for an upgrade, so it counts as none.
    const live = userVerse.streak_date === today
    const done = live ? userVerse.consecutive_correct : 0
    return {
      kind: 'run',
      done,
      needed: Math.max(1, TIER_ADVANCE_THRESHOLD - done),
      total: TIER_ADVANCE_THRESHOLD,
      // Graduation is the top tier's upgrade, and review is where it lands.
      target: STAGE_SHORT_LABELS[nextLearningStage(stage) ?? 'review'],
      sameDay,
    }
  }

  // Review moves once per due date, not once per exercise: with `due_at`
  // already pushed past today the rest of the day's answers change nothing.
  if (userVerse.due_at === null || userVerse.due_at > today) {
    return { kind: 'spent', sameDay }
  }

  const interval = userVerse.interval_days ?? 1
  const done = userVerse.consecutive_correct
  return {
    kind: 'run',
    done,
    needed: Math.max(1, REVIEW_ADVANCE_THRESHOLD - done),
    total: REVIEW_ADVANCE_THRESHOLD,
    // The last rung has nowhere further to stretch to, so the bump is mastery.
    target:
      interval >= MAX_INTERVAL_DAYS
        ? STAGE_SHORT_LABELS.mastered
        : `${nextInterval(interval)}-day gap`,
    sameDay,
  }
}
