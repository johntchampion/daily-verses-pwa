import type { Stage, UserVerse } from '../api/types'

export const BLANK = '____'

/** Word core: letters, digits, apostrophes and hyphens — matches the backend's
    exerciseBuilder tokenization. */
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

const canonWord = (w: string) => w.replace(/’/g, "'")

export function wordsMatch(a: string, b: string): boolean {
  return canonWord(a).toLowerCase() === canonWord(b).toLowerCase()
}

export function wordsMatchExactly(a: string, b: string): boolean {
  return canonWord(a) === canonWord(b)
}

export function normalizeTypedText(text: string): string {
  return text
    .toLowerCase()
    .replace(/’/g, "'")
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

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

/** Must mirror the service's `domain/progression.ts` — a slotted tier counts
    repetitions, not right answers. */
export const TIER_ADVANCE_THRESHOLD = 3

export const INTERVAL_PROGRESSION = [1, 3, 7, 14, 30]

export const STAGE_SEQUENCE: Stage[] = [
  'learning_light',
  'learning_medium',
  'learning_heavy',
  'review',
  'mastered',
]

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

export const SLIP_RATE = 0.2
export const MIN_SLIPS = 2

export function slipBudget(blankCount: number, hasReference: boolean): number {
  return (
    Math.max(MIN_SLIPS, Math.ceil(blankCount * SLIP_RATE)) +
    (hasReference ? 1 : 0)
  )
}

export function usesReferencePhase(stage: Stage): boolean {
  return stage !== 'learning_light'
}

export const MAX_INTERVAL_DAYS =
  INTERVAL_PROGRESSION[INTERVAL_PROGRESSION.length - 1]

export function nextLearningStage(stage: Stage): Stage | null {
  const tier = LEARNING_ORDER.indexOf(stage)
  if (tier === -1 || tier === LEARNING_ORDER.length - 1) return null
  return LEARNING_ORDER[tier + 1]
}

export type UpgradeProgress =
  | {
      kind: 'run'
      done: number
      needed: number
      total: number
      target: string
    }
  | { kind: 'moved'; landed: string; graduated: boolean }
  | { kind: 'rule' }
  | { kind: 'scheduled'; label: string }

/** Must mirror the service's `advance()` in `domain/progression.ts`. */
export function upgradeProgress(
  userVerse: UserVerse,
  today: string | null,
): UpgradeProgress {
  const { stage } = userVerse
  const learning = isLearningStage(stage)

  if (today === null) {
    return learning ? { kind: 'rule' } : { kind: 'scheduled', label: STAGE_LABELS[stage] }
  }

  if (userVerse.last_upgrade_date === today) {
    return {
      kind: 'moved',
      landed: learning ? STAGE_SHORT_LABELS[stage] : STAGE_LABELS[stage],
      graduated: !learning,
    }
  }

  if (!learning) return { kind: 'scheduled', label: STAGE_LABELS[stage] }

  const live = userVerse.streak_date === today
  const done = live ? userVerse.consecutive_correct : 0
  return {
    kind: 'run',
    done,
    needed: Math.max(1, TIER_ADVANCE_THRESHOLD - done),
    total: TIER_ADVANCE_THRESHOLD,
    target: STAGE_SHORT_LABELS[nextLearningStage(stage) ?? 'review'],
  }
}
