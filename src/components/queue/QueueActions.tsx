import type { useQueueOrder } from '../../hooks/useQueueOrder'

type Order = ReturnType<typeof useQueueOrder>

/** The two order controls, shared by the Up Next screen and the panel. */
export default function QueueActions({
  order,
  ids,
  onMoveTheme,
}: {
  order: Order
  ids: string[] | null
  onMoveTheme: () => void
}) {
  return (
    <div className='queue-actions'>
      <button
        className='btn-ghost queue-action'
        onClick={onMoveTheme}
        disabled={order.busy || !ids}
      >
        Move a theme to top
      </button>
      <button
        className='btn-ghost queue-action'
        onClick={order.resetOrder}
        disabled={order.busy || !order.customized || !ids}
      >
        Restore default order
      </button>
    </div>
  )
}
