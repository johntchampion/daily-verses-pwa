import type { MeResponse, VerseListItem } from '../../api/types'
import SlotRow, { SlotRowSkeleton } from '../SlotRow'
import { todayInTimezone } from '../../lib/dates'

const SKELETON_SLOTS = 3

export default function SlotList({
  profile,
  verses,
}: {
  profile: MeResponse | null
  verses: VerseListItem[] | null
}) {
  const textById = new Map(verses?.map((v) => [v.id, v.text]) ?? [])

  return (
    <section
      className='stack slot-grid'
      aria-label='Learning slots'
    >
      {profile
        ? Array.from({ length: profile.slots.max }, (_, i) => {
            const slot = i + 1
            const verse =
              profile.slots.active.find((v) => v.slot === slot) ?? null
            return (
              <SlotRow
                key={slot}
                slot={slot}
                verse={verse}
                snippet={verse ? (textById.get(verse.verseId) ?? null) : null}
                today={todayInTimezone(profile.user.timezone)}
              />
            )
          })
        : Array.from({ length: SKELETON_SLOTS }, (_, i) => (
            <SlotRowSkeleton key={i} />
          ))}
    </section>
  )
}
