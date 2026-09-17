import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import { reducedMotion } from '../lib/motion'

const SHIFT_MS = 200
const SHIFT_EASING = 'cubic-bezier(0.2, 0.7, 0.3, 1)'

interface Spot {
  left: number
  top: number
}

interface Move {
  tile: HTMLElement
  dx: number
  dy: number
}

/**
 * Slides the word bank's tiles between arrangements.
 *
 * A spent tile is replaced by a wider or narrower one, so every tile after it
 * lands somewhere new. This is the FLIP move: once the bank has re-rendered,
 * each tile that survived the change is offset back to where it just was and
 * animated to zero, which reads as the tiles sliding over rather than jumping.
 *
 * Fitting the bank to its rows takes a burst of commits — measure, trim,
 * measure again — and only the last of them is ever painted. So "where it just
 * was" is pinned to the last paint rather than to the last commit, and every
 * commit in the burst re-runs its move from there. Baselining on the commit
 * instead would slide tiles in from arrangements that were never on screen.
 */
export function useTileShift(
  containerRef: RefObject<HTMLDivElement | null>,
  tileIds: number[],
  labels: string[],
) {
  /** Where the tiles sat at the last paint. */
  const spots = useRef(new Map<number, Spot>())
  /** The newest commit's layout, promoted to `spots` once a frame shows it. */
  const latest = useRef(new Map<number, Spot>())
  const inFlight = useRef(new Map<HTMLElement, Animation>())
  /** Open from a burst's first commit until the frame that paints it. */
  const settling = useRef(false)
  const settled = useRef(0)
  const armed = useRef(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      armed.current = true
    })
    return () => {
      cancelAnimationFrame(frame)
      cancelAnimationFrame(settled.current)
      // Leaving the id behind would block every later reschedule, and with it
      // the promotion that gives the next burst a baseline to move from.
      settled.current = 0
      settling.current = false
    }
  }, [])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const tiles = Array.from(container.children) as HTMLElement[]

    // A burst's first commit is the last chance to read a shift still running
    // from the burst before it. Folding its progress into the baseline leaves
    // that reading where the tile is on screen rather than where its layout
    // slot sits, so a tap landing mid-slide carries on from where it caught it.
    if (!settling.current) {
      settling.current = true
      settled.current = requestAnimationFrame(() => {
        settled.current = 0
        settling.current = false
        spots.current = latest.current
      })
      tiles.forEach((tile, at) => {
        const was = spots.current.get(tileIds[at])
        if (!was || !inFlight.current.has(tile)) return
        const sofar = new DOMMatrixReadOnly(getComputedStyle(tile).transform)
        spots.current.set(tileIds[at], {
          left: was.left + sofar.e,
          top: was.top + sofar.f,
        })
      })
    }

    const spotsNow = new Map<number, Spot>()
    const moves: Move[] = []

    tiles.forEach((tile, at) => {
      // offsetLeft/offsetTop read the settled layout, unlike a bounding rect,
      // which a shift still in flight would skew.
      const spot = { left: tile.offsetLeft, top: tile.offsetTop }
      spotsNow.set(tileIds[at], spot)

      const was = spots.current.get(tileIds[at])
      if (!was) return
      const dx = was.left - spot.left
      const dy = was.top - spot.top

      if (Math.abs(dx) >= 1 || Math.abs(dy) >= 1) moves.push({ tile, dx, dy })
    })

    latest.current = spotsNow

    // Anything an earlier commit in this burst started was aimed at a layout
    // that never reached the screen, and the moves below replace it outright.
    for (const tile of tiles) inFlight.current.get(tile)?.cancel()

    if (!armed.current || moves.length === 0 || reducedMotion()) return

    for (const { tile, dx, dy } of moves) {
      const shift = tile.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
        { duration: SHIFT_MS, easing: SHIFT_EASING },
      )
      inFlight.current.set(tile, shift)
      // A cancel from the block above lands after its replacement is stored.
      const forget = () => {
        if (inFlight.current.get(tile) === shift) inFlight.current.delete(tile)
      }
      shift.onfinish = forget
      shift.oncancel = forget
    }
  }, [containerRef, tileIds, labels])
}
