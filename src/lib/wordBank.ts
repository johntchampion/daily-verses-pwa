import { randomIndex, wordsMatch, wordsMatchExactly } from './exercise'

export const BANK_ROWS = 3

export interface BankWindow {
  onScreen: number[]
  offScreen: number[]
}

function includesSpellingOf(
  tileIds: number[],
  labels: string[],
  answer: string,
): boolean {
  return tileIds.some((id) => wordsMatchExactly(labels[id], answer))
}

function positionOfBestTile(
  tileIds: number[],
  labels: string[],
  answer: string,
): number {
  const exact = tileIds.findIndex((id) => wordsMatchExactly(labels[id], answer))
  if (exact !== -1) return exact
  return tileIds.findIndex((id) => wordsMatch(labels[id], answer))
}

/** When a differently-capitalized tile was tapped, swaps labels with the exact
    spelling so the remaining tiles still spell the remaining blanks. */
export function withAnswerSpelling(
  labels: string[],
  tappedId: number,
  answer: string,
  availableIds: number[],
): string[] {
  if (wordsMatchExactly(labels[tappedId], answer)) return labels
  const partner = availableIds.find(
    (id) => id !== tappedId && wordsMatchExactly(labels[id], answer),
  )
  if (partner === undefined) return labels

  const traded = [...labels]
  ;[traded[tappedId], traded[partner]] = [traded[partner], traded[tappedId]]
  return traded
}

/** Trims the bank to `capacity`, swapping in tiles for `neededAnswers`. */
export function trimToCapacity(
  bank: BankWindow,
  capacity: number,
  labels: string[],
  neededAnswers: readonly string[],
): BankWindow {
  const onScreen = bank.onScreen.slice(0, capacity)
  const overflow = bank.onScreen.slice(capacity)

  const reservedPositions = new Set<number>()
  let evictAt = onScreen.length - 1

  for (const answer of neededAnswers) {
    const already = onScreen.findIndex(
      (id, at) =>
        !reservedPositions.has(at) && wordsMatchExactly(labels[id], answer),
    )
    if (already !== -1) {
      reservedPositions.add(already)
      continue
    }

    while (evictAt >= 0 && reservedPositions.has(evictAt)) evictAt--
    if (evictAt < 0) break

    const rescue = positionOfBestTile(overflow, labels, answer)
    if (rescue === -1) continue

    ;[onScreen[evictAt], overflow[rescue]] = [overflow[rescue], onScreen[evictAt]]
    reservedPositions.add(evictAt)
    evictAt--
  }

  return { onScreen, offScreen: [...overflow, ...bank.offScreen] }
}

export const LOOKAHEAD_BLANKS = 6

/** Guarantees the next answer stays on screen; otherwise draws at random among
    upcoming answers so the new tile isn't a giveaway. */
export function replaceTappedTile(
  bank: BankWindow,
  tappedPosition: number,
  upcomingAnswers: readonly string[],
  labels: string[],
): BankWindow {
  const remaining = bank.onScreen.filter((_, at) => at !== tappedPosition)
  if (bank.offScreen.length === 0) return { onScreen: remaining, offScreen: [] }

  const [immediate, ...lookahead] = upcomingAnswers
  let drawAt = 0

  if (
    immediate !== undefined &&
    !includesSpellingOf(remaining, labels, immediate)
  ) {
    const rescue = positionOfBestTile(bank.offScreen, labels, immediate)
    if (rescue !== -1) drawAt = rescue
  } else {
    const missing = lookahead
      .filter((answer) => !includesSpellingOf(remaining, labels, answer))
      .map((answer) => positionOfBestTile(bank.offScreen, labels, answer))
      .filter((position) => position !== -1)
    if (missing.length > 0) drawAt = missing[randomIndex(missing.length)]
  }

  const onScreen = [...bank.onScreen]
  onScreen[tappedPosition] = bank.offScreen[drawAt]
  const offScreen = bank.offScreen.filter((_, at) => at !== drawAt)
  return { onScreen, offScreen }
}

export function showOneMoreTile(bank: BankWindow): BankWindow {
  return {
    onScreen: [...bank.onScreen, bank.offScreen[0]],
    offScreen: bank.offScreen.slice(1),
  }
}

/** The tile's pressed lip hangs below its offsetHeight. */
export const TILE_SHADOW_HEIGHT = 3

export function heightOfRows(
  container: HTMLElement,
  tile: HTMLElement,
): number {
  const rowGap = parseFloat(getComputedStyle(container).rowGap) || 0
  return (
    BANK_ROWS * tile.offsetHeight +
    (BANK_ROWS - 1) * rowGap +
    TILE_SHADOW_HEIGHT
  )
}

export function countTilesInRows(tiles: HTMLElement[], rows: number): number {
  const rowTops = [...new Set(tiles.map((tile) => tile.offsetTop))].sort(
    (a, b) => a - b,
  )
  return tiles.filter((tile) => rowTops.indexOf(tile.offsetTop) < rows).length
}
