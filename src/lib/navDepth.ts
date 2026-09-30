/** Push vs. pop comes from depth, not history direction: Settings closes with a
    forward link that must still animate as a pop. */
const DEPTHS: Array<[RegExp, number]> = [
  // Tab roots
  [/^\/$/, 0],
  [/^\/practicing\/?$/, 0],
  [/^\/library\/?$/, 0],
  [/^\/queue\/?$/, 1],
  [/^\/settings\/?$/, 1],
  [/^\/verses\/[^/]+\/?$/, 2],
]

export function depthOf(pathname: string): number | null {
  for (const [pattern, depth] of DEPTHS) {
    if (pattern.test(pathname)) return depth
  }
  return null
}

export type Direction = 'push' | 'pop'

/** `null` means don't animate: a tab switch, or either end off the stack. */
export function directionFor(from: string, to: string): Direction | null {
  const a = depthOf(from)
  const b = depthOf(to)
  if (a === null || b === null || a === b) return null
  return b > a ? 'push' : 'pop'
}
