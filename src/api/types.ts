/** Mirrors verse-memorize-api's wire format: snake_case fields are raw database
    rows, camelCase fields are composed by the API. */

export type Stage =
  | 'learning_light'
  | 'learning_medium'
  | 'learning_heavy'
  | 'review'
  | 'mastered'

export type ExerciseType = 'tile_fill_blank' | 'type_fill_blank'

export type VerseStatus = 'not_started' | 'active' | 'review' | 'mastered'

export interface UserVerse {
  id: string
  user_id: string
  verse_id: string
  stage: Stage
  /** Learning: attempts recorded today, right or wrong. Review: consecutive
      passed due dates. */
  consecutive_correct: number
  consecutive_incorrect: number
  /** Local date the learning run was accrued on; an older run doesn't count. */
  streak_date: string | null
  interval_days: number | null
  /** Local date (YYYY-MM-DD). */
  due_at: string | null
  last_upgrade_date: string | null
  /** 1 = pulled out of review, waiting for a learning slot. */
  needs_relearning: 0 | 1
  relearning_queued_at: string | null
  /** 1–3 while in a learning slot. */
  slot: number | null
  activated_at: string
  graduated_at: string | null
}

export interface VerseSchedule {
  /** Local date (YYYY-MM-DD). */
  dueAt: string
  intervalDays: number | null
}

export interface Attempt {
  id: string
  user_verse_id: string
  exercise_type: ExerciseType
  correct: 0 | 1
  created_at: string
}

export interface AuthResponse {
  token: string
  userId: string
}

export interface SlotVerse {
  slot: number | null
  userVerseId: string
  verseId: string
  reference: string | null
  stage: Stage
  /** Attempts recorded today, right or wrong. */
  consecutiveCorrect: number
  consecutiveIncorrect: number
  streakDate: string | null
  tierChangeUsedToday: boolean
}

export interface MeResponse {
  user: {
    id: string
    email: string
    timezone: string
    translation: string
    createdAt: string
    remindersEnabled: boolean
  }
  streak: number
  completedToday: boolean
  sessionsCompleted: number
  versesStarted: number
  slots: {
    max: number
    active: SlotVerse[]
  }
}

export type SessionEventKind =
  | 'tier_up'
  /** Unreachable; kept so an older server can't send an unknown kind. */
  | 'tier_down'
  | 'graduated'
  | 'mastered'
  | 'lost_mastery'
  | 'demoted_to_learning'
  | 'relearning_queued'
  | 'slot_filled'
  | 'slot_returned'

export interface SessionEventBody {
  id: string
  kind: SessionEventKind
  verseId: string
  reference: string
  stageFrom: Stage | null
  stageTo: Stage | null
  slot: number | null
  createdAt: string
}

export interface SessionExercise {
  verseId: string
  userVerseId: string
  exerciseType: ExerciseType
  reference: string
  blankedText: string
  wordBank: string[]
  stage: Stage
  queue: 'review' | 'learning'
  completed: boolean
  correct: boolean | null
  userVerse: UserVerse
}

export interface SessionTodayResponse {
  translation: string
  /** An ungraded drill of the slotted verses rather than the day's plan. */
  practice: boolean
  exercises: SessionExercise[]
  count: number
  completedCount: number
  correctCount: number
  /** Covers the whole day, so a resumed session still recaps everything. */
  events: SessionEventBody[]
}

export interface AttemptOutcome {
  userVerse: UserVerse
  graduated: boolean
  /** A row with `graduated_at` set is a verse returning, not a new one. */
  slotsFilled: UserVerse[]
  /** Only this attempt's changes, unlike `SessionTodayResponse.events`. */
  events: SessionEventBody[]
}

export interface SessionCompleteResponse {
  recorded: boolean
  sessionsCompleted: number
  slotsFilled: UserVerse[]
  events: SessionEventBody[]
}

export interface VerseListItem {
  id: string
  reference: string
  order: number
  status: VerseStatus
  stage: Stage | null
  /** Such a verse still reports `status: 'review'`. */
  needsRelearning: boolean
  slot: number | null
  graduatedAt: string | null
  text: string
}

export interface VersesResponse {
  translation: string
  verses: VerseListItem[]
}

export interface VerseDetailResponse {
  translation: string
  verse: {
    id: string
    reference: string
    order: number
    text: string
  }
  themes: { id: string; name: string }[]
  /** 1-based; null when the verse holds a slot or is memorized. */
  queuePosition: number | null
  status: VerseStatus
  graduatedAt: string | null
  userVerse: UserVerse | null
  schedule: VerseSchedule | null
  history: {
    attempts: Attempt[]
    total: number
    correct: number
  }
}

export interface QueueVerse {
  id: string
  reference: string
  order: number
  text: string
  inProgress: boolean
  relearning: boolean
  stage: Stage | null
  themeIds: string[]
}

export interface QueueTheme {
  id: string
  name: string
  total: number
  queuedCount: number
}

export interface QueueResponse {
  translation: string
  customized: boolean
  queue: QueueVerse[]
  themes: QueueTheme[]
}

export interface SlotReplaceResponse extends QueueResponse {
  placed: UserVerse
  displaced: UserVerse | null
}

export interface TranslationOption {
  code: string
  name: string
  license: string
}

export interface TranslationsResponse {
  translations: TranslationOption[]
  default: string
}

export interface PushKeyResponse {
  publicKey: string
}

export interface PushTestResponse {
  sent: number
  removed: number
  failed: number
}

export interface DeleteAccountResponse {
  deleted: true
}

/** `requested` is true even for an unknown address; the mail isn't awaited. */
export interface PasswordResetRequested {
  requested: true
}
