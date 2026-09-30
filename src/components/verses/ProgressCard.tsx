import type { UserVerse, VerseDetailResponse } from '../../api/types'
import StageLadder from '../StageLadder'
import {
  MAX_INTERVAL_DAYS,
  STAGE_LABELS,
  TIER_ADVANCE_THRESHOLD,
  isLearningStage,
} from '../../lib/exercise'

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function chipClass(userVerse: UserVerse): string {
  if (userVerse.needs_relearning === 1) return 'chip chip-relearn'
  if (userVerse.stage === 'mastered') return 'chip chip-mastered'
  if (userVerse.stage === 'review') return 'chip chip-review'
  return 'chip chip-active'
}

function progressCopy(userVerse: UserVerse, today: string | null): string {
  const { consecutive_correct: attemptsToday } = userVerse

  if (userVerse.needs_relearning === 1) {
    return 'Coming back around — it returns to practice as soon as a slot opens.'
  }

  if (isLearningStage(userVerse.stage)) {
    const streakIsToday = today !== null && userVerse.streak_date === today
    return streakIsToday && attemptsToday > 0
      ? `${attemptsToday} of ${TIER_ADVANCE_THRESHOLD} times through it today. All three in one day moves it up a tier.`
      : `Going through it ${TIER_ADVANCE_THRESHOLD} times within one day moves it up a tier. However the words go — the repetition is what counts.`
  }

  if (userVerse.stage === 'mastered') {
    return `Fully memorized, at the top of the ladder. It comes back every ${MAX_INTERVAL_DAYS} days so it stays put.`
  }

  return 'Memorized and in review. It comes back on its own schedule, further apart each time it sticks.'
}

export default function ProgressCard({
  detail,
  today,
}: {
  detail: VerseDetailResponse | null
  today: string | null
}) {
  const userVerse = detail?.userVerse
  if (!detail || !userVerse) return null

  const { status, schedule, graduatedAt } = detail
  const awaitingSlot = userVerse.needs_relearning === 1

  return (
    <section className='card' aria-label='Progress'>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span className='eyebrow'>Progress</span>
        <span className={chipClass(userVerse)}>
          {awaitingSlot ? 'Relearning' : STAGE_LABELS[userVerse.stage]}
        </span>
      </div>
      <StageLadder stage={userVerse.stage} />

      <p
        className='small muted'
        style={{ fontWeight: 600, marginTop: 12, lineHeight: 1.45 }}
      >
        {progressCopy(userVerse, today)}
      </p>

      {(schedule || graduatedAt || awaitingSlot) && status !== 'not_started' && (
        <div className='stat-tiles' style={{ marginTop: 14 }}>
          {awaitingSlot ? (
            <div className='stat-tile'>
              <div className='stat-tile-value'>Waiting</div>
              <div className='stat-tile-label'>for a slot</div>
            </div>
          ) : (
            schedule && (
              <>
                <div className='stat-tile'>
                  <div className='stat-tile-value'>
                    {formatDay(`${schedule.dueAt}T00:00:00`)}
                  </div>
                  <div className='stat-tile-label'>next review</div>
                </div>
                {schedule.intervalDays !== null && (
                  <div className='stat-tile'>
                    <div className='stat-tile-value'>
                      Every {schedule.intervalDays}{' '}
                      {schedule.intervalDays === 1 ? 'day' : 'days'}
                    </div>
                    <div className='stat-tile-label'>interval</div>
                  </div>
                )}
              </>
            )
          )}
          {graduatedAt && (
            <div className='stat-tile'>
              <div className='stat-tile-value'>{formatDay(graduatedAt)}</div>
              <div className='stat-tile-label'>graduated</div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
