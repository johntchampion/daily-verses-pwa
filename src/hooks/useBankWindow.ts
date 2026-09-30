import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { BlankSegment } from '../lib/exercise'
import { shuffle } from '../lib/exercise'
import {
  BANK_ROWS,
  LOOKAHEAD_BLANKS,
  countTilesInRows,
  heightOfRows,
  replaceTappedTile,
  showOneMoreTile,
  trimToCapacity,
  withAnswerSpelling,
  type BankWindow,
} from '../lib/wordBank'

/**
 * The rolling window of tiles docked at the bottom of a tile exercise.
 *
 * `lib/wordBank.ts` holds the pure moves; this measures the rendered tiles
 * against the three rows the dock shows and decides when to make them.
 */
export function useBankWindow(
  wordBank: string[],
  blanks: BlankSegment[],
  filledBlanks: number,
  /** A keyboard filter is narrowing the bank, so only the matching tiles have
      a layout box. See the fit pass below. */
  frozen: boolean,
) {
  const [labels, setLabels] = useState<string[]>(() => [...wordBank])
  const [bank, setBank] = useState<BankWindow>(() => ({
    onScreen: shuffle(labels.map((_, id) => id)),
    offScreen: [],
  }))
  const [bankHeight, setBankHeight] = useState<number | null>(null)
  const [spentTiles, setSpentTiles] = useState<ReadonlySet<number>>(new Set())

  const bankRef = useRef<HTMLDivElement | null>(null)
  const isRotating = useRef(false)
  /** Blocks top-ups after a trim so trim and top-up can't ping-pong. */
  const windowIsFull = useRef(false)

  useEffect(() => {
    const remeasure = () => setBankHeight(null)
    window.addEventListener('resize', remeasure)
    return () => window.removeEventListener('resize', remeasure)
  }, [])

  // Measure first, then fit: the height can only be read once tiles have been
  // laid out, and the fit can only be judged against a locked-down height.
  useLayoutEffect(() => {
    const container = bankRef.current
    if (!container) return
    const tiles = Array.from(container.children) as HTMLElement[]
    // A filtered-out tile is hidden rather than unmounted, so it is still a
    // child; it just has no box to measure.
    const shown = tiles.find((tile) => !tile.hidden)
    if (!shown) return

    if (bankHeight === null) {
      setBankHeight(heightOfRows(container, shown))
      return
    }

    if (frozen) return

    const capacity = countTilesInRows(tiles, BANK_ROWS)
    if (capacity < bank.onScreen.length) {
      isRotating.current = true
      windowIsFull.current = true
      const needed = blanks
        .slice(filledBlanks, filledBlanks + 1 + LOOKAHEAD_BLANKS)
        .map((blank) => blank.answer)
      setBank(trimToCapacity(bank, capacity, labels, needed))
    } else if (bank.offScreen.length > 0 && !windowIsFull.current) {
      setBank(showOneMoreTile(bank))
    }
  }, [bank, bankHeight, blanks, filledBlanks, frozen, labels])

  /** Rotates the tapped tile out, or hollows it in place if the bank fits. */
  function spendTile(tileId: number, position: number, answer: string) {
    const availableIds = [...bank.offScreen, ...bank.onScreen].filter(
      (id) => !spentTiles.has(id),
    )
    const nextLabels = withAnswerSpelling(labels, tileId, answer, availableIds)
    if (nextLabels !== labels) setLabels(nextLabels)

    windowIsFull.current = false
    if (isRotating.current) {
      const upcoming = blanks
        .slice(filledBlanks + 1, filledBlanks + 1 + LOOKAHEAD_BLANKS)
        .map((blank) => blank.answer)
      setBank((current) =>
        replaceTappedTile(current, position, upcoming, nextLabels),
      )
    } else {
      setSpentTiles((current) => new Set(current).add(tileId))
    }
  }

  return {
    labels,
    onScreen: bank.onScreen,
    bankHeight,
    bankRef,
    spentTiles,
    spendTile,
  }
}
