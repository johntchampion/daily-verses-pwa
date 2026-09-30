/**
 * Keyboard driving for the tile bank: which keys type into the filter, what a
 * typed prefix matches, and where the arrows land.
 *
 * Pure but for `rowStep`, which reads laid-out tiles the way `wordBank.ts`
 * does — the bank is a wrapped flex row, so "the tile above" is a measurement,
 * not an index.
 */

const canon = (text: string) => text.replace(/’/g, "'").toLowerCase()

/** The word cores `lib/exercise.ts` tokenizes — letters, digits, apostrophes,
    hyphens — plus the space a book name like "1 Samuel" needs. */
const FILTER_KEY = /^[\p{L}\p{N}'’\- ]$/u

export function isFilterKey(key: string): boolean {
  return FILTER_KEY.test(key)
}

/** Prefix, not substring: typing is how you'd start writing the word, and a
    substring match would keep tiles on screen for no reason the user can see. */
export function matchesQuery(label: string, query: string): boolean {
  return canon(label).startsWith(canon(query))
}

const ARROWS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'] as const

export type Arrow = (typeof ARROWS)[number]

export function isArrow(key: string): key is Arrow {
  return (ARROWS as readonly string[]).includes(key)
}

/**
 * Where a vertical arrow lands: the nearest horizontal centre in the next row
 * that holds somewhere to land, or null at the top and bottom of the bank.
 *
 * Rows are read off `offsetTop` rather than assumed, because a filter hides
 * tiles and the survivors re-wrap. Hidden tiles have no layout box at all, so
 * they are skipped outright — their `offsetTop` is 0 and would otherwise read
 * as a phantom first row.
 */
export function rowStep(
  tiles: HTMLElement[],
  from: number,
  direction: 1 | -1,
  canLand: (index: number) => boolean,
): number | null {
  const current = tiles[from]
  if (!current || current.hidden) return null

  const shown = tiles.filter((tile) => !tile.hidden)
  const rows = [...new Set(shown.map((tile) => tile.offsetTop))].sort(
    (a, b) => a - b,
  )
  const centre = current.offsetLeft + current.offsetWidth / 2

  for (
    let row = rows.indexOf(current.offsetTop) + direction;
    row >= 0 && row < rows.length;
    row += direction
  ) {
    let best: number | null = null
    let bestGap = Infinity

    tiles.forEach((tile, at) => {
      if (tile.hidden || tile.offsetTop !== rows[row] || !canLand(at)) return
      const gap = Math.abs(tile.offsetLeft + tile.offsetWidth / 2 - centre)
      if (gap < bestGap) {
        bestGap = gap
        best = at
      }
    })

    // A row with nothing to land on is stepped over rather than stopped at.
    if (best !== null) return best
  }

  return null
}

/**
 * What Space does to a query: place the tile it spells out (`index`), carry on
 * into a multi-word label like "1 Samuel" (`extend`), or nothing — the query
 * is only the start of a word (`short`).
 *
 * A whole word wins over extending it, so "Song" with a "Song of Songs" in the
 * bank would place "Song" if there were one; there never is, since word tiles
 * hold one word and book names don't prefix each other at a word boundary.
 */
export type SpaceAction =
  | { kind: 'place'; index: number }
  | { kind: 'extend' }
  | { kind: 'short' }

export function spaceAction(
  candidates: { label: string; disabled: boolean }[],
  query: string,
): SpaceAction {
  const index = candidates.findIndex(
    (candidate) =>
      !candidate.disabled && canon(candidate.label) === canon(query),
  )
  if (index !== -1) return { kind: 'place', index }

  const continues = candidates.some(
    (candidate) =>
      !candidate.disabled && matchesQuery(candidate.label, `${query} `),
  )
  return continues ? { kind: 'extend' } : { kind: 'short' }
}
