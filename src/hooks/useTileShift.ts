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

/** Slides the word bank's tiles from where they were last painted to their new
    layout (a FLIP animation), rather than letting them jump. */
export function useTileShift(
  containerRef: RefObject<HTMLDivElement | null>,
  tileIds: number[],
  labels: string[],
) {
  const paintedSpots = useRef(new Map<number, Spot>())
  const committedSpots = useRef(new Map<number, Spot>())
  const inFlight = useRef(new Map<HTMLElement, Animation>())
  const awaitingPaint = useRef(false)
  const paintFrame = useRef(0)
  const hasPainted = useRef(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      hasPainted.current = true
    })
    return () => {
      cancelAnimationFrame(frame)
      cancelAnimationFrame(paintFrame.current)
      paintFrame.current = 0
      awaitingPaint.current = false
    }
  }, [])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const tiles = Array.from(container.children) as HTMLElement[]

    if (!awaitingPaint.current) {
      awaitingPaint.current = true
      paintFrame.current = requestAnimationFrame(() => {
        paintFrame.current = 0
        awaitingPaint.current = false
        paintedSpots.current = committedSpots.current
      })
      tiles.forEach((tile, at) => {
        const was = paintedSpots.current.get(tileIds[at])
        if (!was || !inFlight.current.has(tile)) return
        const inFlightOffset = new DOMMatrixReadOnly(getComputedStyle(tile).transform)
        paintedSpots.current.set(tileIds[at], {
          left: was.left + inFlightOffset.e,
          top: was.top + inFlightOffset.f,
        })
      })
    }

    const spotsNow = new Map<number, Spot>()
    const moves: Move[] = []

    tiles.forEach((tile, at) => {
      if (tile.hidden) return

      // Unlike a bounding rect, offsets ignore an in-flight transform.
      const spot = { left: tile.offsetLeft, top: tile.offsetTop }
      spotsNow.set(tileIds[at], spot)

      const was = paintedSpots.current.get(tileIds[at])
      if (!was) return
      const dx = was.left - spot.left
      const dy = was.top - spot.top

      if (Math.abs(dx) >= 1 || Math.abs(dy) >= 1) moves.push({ tile, dx, dy })
    })

    committedSpots.current = spotsNow

    for (const tile of tiles) inFlight.current.get(tile)?.cancel()

    if (!hasPainted.current || moves.length === 0 || reducedMotion()) return

    for (const { tile, dx, dy } of moves) {
      const shift = tile.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
        { duration: SHIFT_MS, easing: SHIFT_EASING },
      )
      inFlight.current.set(tile, shift)
      const forgetIfCurrent = () => {
        if (inFlight.current.get(tile) === shift) inFlight.current.delete(tile)
      }
      shift.onfinish = forgetIfCurrent
      shift.oncancel = forgetIfCurrent
    }
  }, [containerRef, tileIds, labels])
}
