import { useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { api } from '../api/client'
import Screen, { BackButton } from '../components/Screen'
import ProgressCard from '../components/verses/ProgressCard'
import SlotPickerSheet from '../components/verses/SlotPickerSheet'
import SoonerCard from '../components/verses/SoonerCard'
import VerseCard from '../components/verses/VerseCard'
import { useApi } from '../hooks/useApi'
import { useBack } from '../hooks/useBack'
import { todayInTimezone } from '../lib/dates'
import { messageOf } from '../lib/errors'
import { originOf, tabLabel } from '../lib/origin'

export default function VerseDetail() {
  const { id } = useParams<{ id: string }>()
  const back = useBack()
  const origin = originOf(useLocation().state)
  const detail = useApi(() => api.verse(id ?? ''))
  const me = useApi(() => api.me())

  const [slotSheet, setSlotSheet] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const data = detail.data

  const timezone = me.data?.user.timezone
  const today = timezone ? todayInTimezone(timezone) : null

  const closeSlotSheet = () => setSlotSheet(false)

  const confirmSlotAction = (verseId: string, pick: number) => {
    setActionBusy(true)
    setActionError(null)
    const action =
      pick === 0
        ? api.moveVerseToFront(verseId)
        : api.replaceSlot(verseId, pick)
    action
      .then(() => {
        closeSlotSheet()
        detail.refetch()
        me.refetch()
      })
      .catch((err: unknown) => {
        setActionError(messageOf(err, 'Something went wrong.'))
      })
      .finally(() => setActionBusy(false))
  }

  return (
    <Screen
      layout='stack'
      className='verse-shell'
      me={me.data}
      tab={origin}
      leading={
        <BackButton
          onClick={back}
          label={origin ? `Back to ${tabLabel(origin)}` : 'Back to verses'}
          text={origin ? tabLabel(origin) : 'Back'}
        />
      }
      title={
        <span
          className='small muted verse-shell-title'
          style={{ fontWeight: 800 }}
        >
          Verses
        </span>
      }
      loading={detail.pending}
      loadingLabel='Loading verse…'
      error={detail.error}
      onRetry={detail.refetch}
      errorActions={
        <button
          className='btn-quiet'
          style={{ width: '100%', marginTop: 8 }}
          onClick={back}
        >
          Back to verses
        </button>
      }
    >
      <div className='stack verse-layout'>
        <VerseCard detail={data} />
        <div className='stack verse-side'>
          <SoonerCard
            position={data?.queuePosition ?? null}
            disabled={actionBusy || me.pending}
            error={actionError}
            onOpen={() => setSlotSheet(true)}
          />
          <ProgressCard detail={data} today={today} />
        </div>
      </div>

      {data && (
        <SlotPickerSheet
          open={slotSheet}
          reference={data.verse.reference}
          slots={me.data?.slots.active ?? []}
          allowQueueFront={data.queuePosition !== 1}
          busy={actionBusy}
          error={actionError}
          onConfirm={(pick) => confirmSlotAction(data.verse.id, pick)}
          onClose={closeSlotSheet}
          onExited={() => setActionError(null)}
        />
      )}
    </Screen>
  )
}
