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
  matchesQuery,
  rowStep,
  type Arrow,
} from '../lib/bankKeyboard'
import { useLatest } from './useLatest'

export interface BankCandidate {
  label: string
  /** Still drawn, but never cued and never a match. */
  disabled: boolean
}

export interface BankKeyboard {
  visible: ReadonlySet<number>
  cued: number | null
}

/**
 * Nothing is highlighted until the user arrows or types. A query cues its first
 * match, but that cue goes away with the query rather than becoming a cursor.
 */
function resolveCued(
  cursor: number | null,
  eligible: number[],
  query: string,
): number | null {
  if (cursor !== null && eligible.includes(cursor)) return cursor
  if (query !== '') return eligible[0] ?? null
  if (cursor === null) return null
  // The cursor's tile was spent; carry on from its place.
  return eligible.find((at) => at > cursor) ?? eligible.at(-1) ?? null
}

/**
 * Arrows move a cursor, typing filters the bank, Enter picks. Listens on
 * `window` so the bank never needs focus.
 *
 * `query` is owned by the caller because `useBankWindow` needs it first.
 */
export function useBankKeyboard({
  candidates,
  query,
  setQuery,
  phase,
  enabled,
  dockRef,
  onPick,
  onSubmit,
}: {
  candidates: BankCandidate[]
  query: string
  setQuery: Dispatch<SetStateAction<string>>
  /** Changes when the board is replaced; the cursor is scoped to it. */
  phase: string
  enabled: boolean
  dockRef: RefObject<HTMLElement | null>
  onPick: (index: number) => void
  /** Enter with nothing cued. */
  onSubmit: (() => void) | null
}): BankKeyboard {
  const [cursor, setCursor] = useState<{ phase: string; at: number } | null>(
    null,
  )

  const visible = useMemo(() => {
    const drawn = new Set<number>()
    candidates.forEach((candidate, at) => {
      const matches =
        query === '' ||
        (!candidate.disabled && matchesQuery(candidate.label, query))
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

  const at = cursor !== null && cursor.phase === phase ? cursor.at : null
  const cued = resolveCued(at, eligible, query)

  const latest = useLatest({
    candidates,
    visible,
    eligible,
    cued,
    cursorAt: at,
    query,
    phase,
    setQuery,
    onPick,
    onSubmit,
    dockRef,
  })

  useEffect(() => {
    if (!enabled) return

    function tiles(): HTMLElement[] {
      const bank = latest.current.dockRef.current?.querySelector('.word-bank')
      return bank ? (Array.from(bank.children) as HTMLElement[]) : []
    }

    function move(key: Arrow) {
      const { eligible, cued, candidates, visible, phase } = latest.current
      if (eligible.length === 0) return

      const put = (to: number) => setCursor({ phase, at: to })

      if (cued === null) {
        put(eligible[0])
        return
      }

      if (key === 'ArrowLeft' || key === 'ArrowRight') {
        const step = key === 'ArrowRight' ? 1 : -1
        const from = eligible.indexOf(cued)
        put(eligible[(from + step + eligible.length) % eligible.length])
        return
      }

      const landed = rowStep(
        tiles(),
        cued,
        key === 'ArrowDown' ? 1 : -1,
        (index) => visible.has(index) && candidates[index]?.disabled === false,
      )
      if (landed !== null) put(landed)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.isComposing) return

      // A dialog is up, focused or not.
      if (document.querySelector('[aria-modal="true"]')) return

      const focused = document.activeElement
      if (!(focused instanceof HTMLElement)) return
      if (
        focused.isContentEditable ||
        /^(input|textarea|select)$/i.test(focused.tagName)
      ) {
        return
      }
      // A focused button handles its own activation; anything else takes focus
      // back from it.
      if (focused.tagName === 'BUTTON') {
        if (event.key === 'Enter' || event.key === ' ') return
        focused.blur()
      }

      const {
        query,
        setQuery,
        cued,
        cursorAt,
        phase,
        onPick,
        onSubmit,
        candidates,
      } = latest.current

      if (event.key === 'Enter') {
        if (event.repeat) return
        if (cued !== null) {
          event.preventDefault()
          // Only an arrowed cursor survives a pick; a filter cue leaves with
          // the query.
          if (cursorAt !== null) setCursor({ phase, at: cued })
          onPick(cued)
        } else if (onSubmit) {
          event.preventDefault()
          onSubmit()
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

      // Space can continue a query (book names) but not start one.
      if (event.key === ' ' && query === '') {
        event.preventDefault()
        return
      }
      if (!isFilterKey(event.key)) return

      event.preventDefault()
      setQuery((current) => {
        const next = current + event.key
        // Drop a keystroke that would leave nothing to pick.
        const lands = candidates.some(
          (candidate) =>
            !candidate.disabled && matchesQuery(candidate.label, next),
        )
        return lands ? next : current
      })
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled, latest])

  return { visible, cued }
}
