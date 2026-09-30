import { api } from '../api/client'
import Screen from '../components/Screen'
import TranslationTag from '../components/TranslationTag'
import QueueLink from '../components/practicing/QueueLink'
import RelearnCard from '../components/practicing/RelearnCard'
import SlotList from '../components/practicing/SlotList'
import QueuePanel from '../components/queue/QueuePanel'
import { combineApi, useApi } from '../hooks/useApi'
import { useIsDesktop } from '../hooks/useIsDesktop'

/** The learning slots, then the queue: a link on mobile, a panel on desktop. */
export default function Practicing() {
  const desktop = useIsDesktop()
  const me = useApi(() => api.me())
  const verses = useApi(() => api.verses())
  const all = combineApi(me, verses)

  const allLoaded = !all.pending
  const profile = allLoaded ? me.data : null
  const verseList = allLoaded ? (verses.data?.verses ?? null) : null

  return (
    <Screen
      layout='tabbed'
      className='practicing-shell'
      title={<h1 className='view-title'>In Practice</h1>}
      trailing={<TranslationTag code={verses.data?.translation ?? null} />}
      me={me.data}
      sub='Three at a time. Go through a verse three times in a day and it moves up a tier — three days of that and it graduates out of practice.'
      loading={all.pending}
      loadingLabel='Loading your practice slots…'
      // A failed verse fetch only costs the snippets.
      error={me.error}
      onRetry={all.refetch}
    >
      <SlotList profile={profile} verses={verseList} />
      {desktop ? <QueuePanel /> : <QueueLink verses={verseList} />}
      <RelearnCard verses={verseList} />
    </Screen>
  )
}
