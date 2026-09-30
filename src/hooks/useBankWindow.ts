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

/** The tiles docked below a tile exercise, trimmed to fit the dock's rows and
    rotated in as tiles are used. */
export function useBankWindow(
  wordBank: string[],
  blanks: BlankSegment[],
  filledBlanks: number,
  isFiltered: boolean,
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

  useLayoutEffect(() => {
    const container = bankRef.current
    if (!container) return
    const tiles = Array.from(container.children) as HTMLElement[]
    const firstVisibleTile = tiles.find((tile) => !tile.hidden)
    if (!firstVisibleTile) return

    if (bankHeight === null) {
      setBankHeight(heightOfRows(container, firstVisibleTile))
      return
    }

    if (isFiltered) return

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
  }, [bank, bankHeight, blanks, filledBlanks, isFiltered, labels])

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
