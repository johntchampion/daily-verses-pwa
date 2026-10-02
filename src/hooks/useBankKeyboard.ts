import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react'
import {
  isArrow,
  isFilterKey,
  startsWithQuery,
  nearestTileInAdjacentRow,
  spaceAction,
  type Arrow,
} from '../lib/bankKeyboard'
import { useLatest } from './useLatest'

export interface BankCandidate {
  label: string
  disabled: boolean
}

export interface BankKeyboard {
  visible: ReadonlySet<number>
  cued: number | null
}

function resolveCued(
  cursor: number | null,
  eligible: number[],
  query: string,
): number | null {
  if (cursor !== null && eligible.includes(cursor)) return cursor
  if (query !== '') return eligible[0] ?? null
  if (cursor === null) return null
  // The cursor's tile was used up, so move to the next one still available.
  return eligible.find((at) => at > cursor) ?? eligible.at(-1) ?? null
}

/** Arrows move a cursor, typing filters the bank, Enter picks the cued tile
    and Space the typed one. Listens on `window` so the bank never needs focus. */
export function useBankKeyboard({
  candidates,
  query,
  setQuery,
  cursorResetKey,
  enabled,
  dockRef,
  onPick,
  onIncompleteQuery,
  onSubmitWithNothingCued,
}: {
  candidates: BankCandidate[]
  query: string
  setQuery: Dispatch<SetStateAction<string>>
  cursorResetKey: string
  enabled: boolean
  dockRef: RefObject<HTMLElement | null>
  onPick: (index: number) => void
  onIncompleteQuery: () => void
  onSubmitWithNothingCued: (() => void) | null
}): BankKeyboard {
  const [cursor, setCursor] = useState<{
    resetKey: string
    at: number
  } | null>(null)

  const visible = useMemo(() => {
    const drawn = new Set<number>()
    candidates.forEach((candidate, at) => {
      const matches =
        query === '' ||
        (!candidate.disabled && startsWithQuery(candidate.label, query))
      if (matches) drawn.add(at)
    })
    return drawn
  }, [candidates, query])

  const eligible = useMemo(
    () =>
      candidates.flatMap((candidate, at) =>
        visible.has(at) && !candidate.disabled ? [at] : [],
      ),
    [candidates, visible],
  )

  const cursorAt =
    cursor !== null && cursor.resetKey === cursorResetKey ? cursor.at : null
  const cued = resolveCued(cursorAt, eligible, query)

  const latest = useLatest({
    candidates,
    visible,
    eligible,
    cued,
    cursorAt,
    query,
    cursorResetKey,
    setQuery,
    onPick,
    onIncompleteQuery,
    onSubmitWithNothingCued,
    dockRef,
  })

  useEffect(() => {
    if (!enabled) return

    function renderedTiles(): HTMLElement[] {
      const bank = latest.current.dockRef.current?.querySelector('.word-bank')
      return bank ? (Array.from(bank.children) as HTMLElement[]) : []
    }

    function move(key: Arrow) {
      const { eligible, cued, candidates, visible, cursorResetKey } =
        latest.current
      if (eligible.length === 0) return

      const moveCursorTo = (to: number) =>
        setCursor({ resetKey: cursorResetKey, at: to })

      if (cued === null) {
        moveCursorTo(eligible[0])
        return
      }

      if (key === 'ArrowLeft' || key === 'ArrowRight') {
        const step = key === 'ArrowRight' ? 1 : -1
        const from = eligible.indexOf(cued)
        moveCursorTo(eligible[(from + step + eligible.length) % eligible.length])
        return
      }

      const landed = nearestTileInAdjacentRow(
        renderedTiles(),
        cued,
        key === 'ArrowDown' ? 1 : -1,
        (index) => visible.has(index) && candidates[index]?.disabled === false,
      )
      if (landed !== null) moveCursorTo(landed)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.isComposing) return

      const dialogOpen = document.querySelector('[aria-modal="true"]') !== null
      if (dialogOpen) return

      const focused = document.activeElement
      if (!(focused instanceof HTMLElement)) return
      if (
        focused.isContentEditable ||
        /^(input|textarea|select)$/i.test(focused.tagName)
      ) {
        return
      }
      if (focused.tagName === 'BUTTON') {
        // Let the button handle its own activation keys.
        if (event.key === 'Enter' || event.key === ' ') return
        focused.blur()
      }

      const {
        query,
        setQuery,
        cued,
        cursorAt,
        cursorResetKey,
        onPick,
        onIncompleteQuery,
        onSubmitWithNothingCued,
        candidates,
      } = latest.current

      if (event.key === 'Enter') {
        if (event.repeat) return
        if (cued !== null) {
          event.preventDefault()
          if (cursorAt !== null) setCursor({ resetKey: cursorResetKey, at: cued })
          onPick(cued)
        } else if (onSubmitWithNothingCued) {
          event.preventDefault()
          onSubmitWithNothingCued()
        }
        return
      }

      if (event.key === 'Escape') {
        if (query === '' && cursorAt === null) return
        event.preventDefault()
        setQuery('')
        setCursor(null)
        return
      }

      if (event.key === 'Backspace') {
        if (query === '' && cursorAt === null) return
        event.preventDefault()
        setQuery((current) => current.slice(0, -1))
        setCursor(null)
        return
      }

      if (isArrow(event.key)) {
        event.preventDefault()
        move(event.key)
        return
      }

      if (event.key === ' ') {
        event.preventDefault()
        if (query === '' || event.repeat) return
        const action = spaceAction(candidates, query)
        if (action.kind === 'place') {
          setCursor(null)
          onPick(action.index)
        } else if (action.kind === 'incomplete') {
          onIncompleteQuery()
        } else {
          setQuery(query + ' ')
        }
        return
      }
      if (!isFilterKey(event.key)) return

      event.preventDefault()
      setQuery((current) => current + event.key)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled, latest])

  return { visible, cued }
}
