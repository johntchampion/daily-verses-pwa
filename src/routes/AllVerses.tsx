import { api } from '../api/client'
import Screen from '../components/Screen'
import TranslationTag from '../components/TranslationTag'
import ArcList from '../components/verses/ArcList'
import HundredStats from '../components/verses/HundredStats'
import { useApi } from '../hooks/useApi'

export default function AllVerses() {
  const verses = useApi(() => api.verses())
  // Only for the desktop nav's streak badge, so it can't fail the screen.
  const me = useApi(() => api.me())

  return (
    <Screen
      layout='tabbed'
      className='hundred-shell'
      title={<h1 className='view-title'>Library</h1>}
      trailing={<TranslationTag code={verses.data?.translation ?? null} />}
      me={me.data}
      sub='Every verse in the curriculum, in canon order.'
      loading={verses.pending}
      loadingLabel='Loading verses…'
      error={verses.error}
      onRetry={verses.refetch}
    >
      <HundredStats verses={verses.data?.verses ?? null} />
      <ArcList verses={verses.data?.verses ?? null} />
    </Screen>
  )
}
