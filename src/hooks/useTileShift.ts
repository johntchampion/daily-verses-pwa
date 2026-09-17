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
 */
export function useTileShift(
  containerRef: RefObject<HTMLDivElement | null>,
  tileIds: number[],
  labels: string[],
) {
  const spots = useRef(new Map<number, Spot>())
  const inFlight = useRef(new Map<HTMLElement, Animation>())
  const armed = useRef(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      armed.current = true
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const tiles = Array.from(container.children) as HTMLElement[]
    const spotsNow = new Map<number, Spot>()
    const moves: Move[] = []

    tiles.forEach((tile, at) => {
      // offsetLeft/offsetTop read the settled layout, unlike a bounding rect,
      // which a shift still in flight would skew.
      const spot = { left: tile.offsetLeft, top: tile.offsetTop }
      spotsNow.set(tileIds[at], spot)

      const was = spots.current.get(tileIds[at])
      if (!was) return
      let dx = was.left - spot.left
      let dy = was.top - spot.top

      const interrupted = inFlight.current.get(tile)
      if (interrupted) {
        // Start from where the old shift had got to, not from where it began.
        const sofar = new DOMMatrixReadOnly(getComputedStyle(tile).transform)
        dx += sofar.e
        dy += sofar.f
        interrupted.cancel()
      }

      if (Math.abs(dx) >= 1 || Math.abs(dy) >= 1) moves.push({ tile, dx, dy })
    })

    spots.current = spotsNow
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
