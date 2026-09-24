import type { MeResponse } from '../api/types'

export default function StreakChip({ me }: { me: MeResponse }) {
  return (
    <span
      className={`chip chip-streak streak-badge${me.completedToday ? '' : ' streak-badge-pending'}`}
    >
      {me.streak} day streak
    </span>
  )
}
