import { api } from '../api/client'
import Screen from '../components/Screen'
import TranslationTag from '../components/TranslationTag'
import QueueLink from '../components/practicing/QueueLink'
import RelearnCard from '../components/practicing/RelearnCard'
import SlotList from '../components/practicing/SlotList'
import QueuePanel from '../components/queue/QueuePanel'
import { combineApi, useApi } from '../hooks/useApi'
import { useIsDesktop } from '../hooks/useIsDesktop'

/** The Practicing tab: the learning slots, then the waiting line — a link to
    its own screen on mobile, the line itself on desktop. */
export default function Practicing() {
  const desktop = useIsDesktop()
  const me = useApi(() => api.me())
  const verses = useApi(() => api.verses())
  const all = combineApi(me, verses)

  // Hold every child to its skeleton until both requests have settled, so the
  // blocks don't pop in one at a time.
  const ready = !all.pending
  const profile = ready ? me.data : null
  const verseList = ready ? (verses.data?.verses ?? null) : null

  return (
    <Screen
      layout='tabbed'
      className='practicing-shell'
      title={<h1 className='view-title'>In Practice</h1>}
      trailing={<TranslationTag code={verses.data?.translation ?? null} />}
      me={me.data}
      sub='Three at a time. A verse graduates from In Practice once it’s practiced correctly three times in a row for three days.'
      loading={all.pending}
      loadingLabel='Loading your practice slots…'
      // Only the profile is load-bearing: a failed verse fetch costs a
      // snippet, not the screen.
      error={me.error}
      onRetry={all.refetch}
    >
      <SlotList profile={profile} verses={verseList} />
      {desktop ? <QueuePanel /> : <QueueLink verses={verseList} />}
      <RelearnCard verses={verseList} />
    </Screen>
  )
}
