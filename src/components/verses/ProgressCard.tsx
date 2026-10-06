import type { VerseDetailResponse } from '../../api/types'
import ProgressionMeter from '../ProgressionMeter'
import { upgradeProgress } from '../../lib/exercise'

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function scheduleHeadline(detail: VerseDetailResponse): string | undefined {
  if (detail.userVerse?.needs_relearning === 1) {
    return 'Waiting for a practice slot'
  }

  const { schedule } = detail
  if (!schedule) return undefined

  const nextReview = `Next review ${formatDay(`${schedule.dueAt}T00:00:00`)}`
  if (schedule.intervalDays === null) return nextReview

  const days = schedule.intervalDays === 1 ? 'day' : 'days'
  return `${nextReview} · every ${schedule.intervalDays} ${days}`
}

function historySummary(detail: VerseDetailResponse): string | null {
  const { history, graduatedAt } = detail
  if (history.total === 0) return null

  const parts = [
    `Practiced ${history.total} ${history.total === 1 ? 'time' : 'times'}`,
    `last ${formatDay(history.attempts[0].created_at)}`,
  ]
  if (graduatedAt) parts.push(`memorized ${formatDay(graduatedAt)}`)
  return parts.join(' · ')
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

  const progress = upgradeProgress(userVerse, today)
  const summary = historySummary(detail)

  return (
    <section className='card' aria-label='Progress'>
      <div className='eyebrow' style={{ marginBottom: 10 }}>
        Progress
      </div>
      <ProgressionMeter
        stage={userVerse.stage}
        progress={progress}
        headline={
          progress.kind === 'moved' ? undefined : scheduleHeadline(detail)
        }
      />
      {summary && <p className='progress-summary'>{summary}</p>}
    </section>
  )
}
