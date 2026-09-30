const normalizeForMatch = (text: string) =>
  text.replace(/’/g, "'").toLowerCase()

/** A single letter, digit, apostrophe, hyphen or space. */
const FILTER_KEY = /^[\p{L}\p{N}'’\- ]$/u

export function isFilterKey(key: string): boolean {
  return FILTER_KEY.test(key)
}

export function startsWithQuery(label: string, query: string): boolean {
  return normalizeForMatch(label).startsWith(normalizeForMatch(query))
}

const ARROWS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'] as const

export type Arrow = (typeof ARROWS)[number]

export function isArrow(key: string): key is Arrow {
  return (ARROWS as readonly string[]).includes(key)
}

/** Index of the horizontally nearest landable tile in the next visible row
    above or below, or null past the edge of the bank. */
export function nearestTileInAdjacentRow(
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

    if (best !== null) return best
  }

  return null
}

/** Space places an exactly matching tile, extends the query into a multi-word
    label like "1 Samuel", or does nothing while the query is incomplete. */
export type SpaceAction =
  | { kind: 'place'; index: number }
  | { kind: 'extend' }
  | { kind: 'incomplete' }

export function spaceAction(
  candidates: { label: string; disabled: boolean }[],
  query: string,
): SpaceAction {
  const index = candidates.findIndex(
    (candidate) =>
      !candidate.disabled &&
      normalizeForMatch(candidate.label) === normalizeForMatch(query),
  )
  if (index !== -1) return { kind: 'place', index }

  const continues = candidates.some(
    (candidate) =>
      !candidate.disabled && startsWithQuery(candidate.label, `${query} `),
  )
  return continues ? { kind: 'extend' } : { kind: 'incomplete' }
}
