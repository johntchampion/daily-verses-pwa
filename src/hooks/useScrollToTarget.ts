import { useEffect, useRef, type RefObject } from 'react'
import { reducedMotion } from '../lib/motion'

/** Clearance the current target needs above the dock before the page scrolls. */
const SCROLL_MARGIN_PX = 12

/**
 * Where the dock starts covering the screen. The desktop session dissolves the
 * dock with `display: contents`, leaving it boxless — nothing covers the bottom
 * there, so the viewport floor stands in for it.
 */
function dockTop(dock: HTMLElement | null): number {
  if (!dock) return window.innerHeight
  const rect = dock.getBoundingClientRect()
  return rect.height === 0 ? window.innerHeight : rect.top
}

function isOutOfView(target: HTMLElement, dock: HTMLElement | null): boolean {
  const rect = target.getBoundingClientRect()
  return (
    rect.bottom > dockTop(dock) - SCROLL_MARGIN_PX ||
    rect.top < SCROLL_MARGIN_PX
  )
}

/**
 * Keeps whatever has to be tapped next in view above the dock.
 *
 * `scrollIntoView`'s behavior is a JS argument, so the blanket reduced-motion
 * rule in index.css can't reach it — the preference is read here instead.
 */
export function useScrollToTarget({
  filledBlanks,
  filledRefSteps,
  inReferencePhase,
  targetRef,
  dockRef,
}: {
  filledBlanks: number
  filledRefSteps: number
  inReferencePhase: boolean
  targetRef: RefObject<HTMLElement | null>
  dockRef: RefObject<HTMLElement | null>
}) {
  /** The first run is the exercise mounting, not a blank being filled. */
  const hasScrolledOnce = useRef(false)

  useEffect(() => {
    const behavior: ScrollBehavior = reducedMotion() ? 'auto' : 'smooth'
    const firstRun = !hasScrolledOnce.current
    hasScrolledOnce.current = true

    // Going to the very top, rather than just clearing the dock, is what brings
    // the whole finished verse back into view above it — done every time the
    // phase is entered, not only when the line has drifted out of view.
    if (inReferencePhase) {
      window.scrollTo({ top: 0, behavior: firstRun ? 'auto' : behavior })
      return
    }

    // The exercise mounting: land at the top regardless of where the previous
    // exercise left the page scrolled.
    if (firstRun) {
      window.scrollTo({ top: 0, behavior: 'auto' })
      return
    }

    const target = targetRef.current
    const dock = dockRef.current
    if (!target || !isOutOfView(target, dock)) return
    // Centre within the space above the dock, not `scrollIntoView`'s whole
    // viewport: the dock is a sticky element the browser doesn't know covers the
    // bottom of the screen, and on a short iOS viewport a plain viewport-centre
    // under-scrolls, landing the blank behind the dock instead of clear of it.
    const floor = dockTop(dock)
    const rect = target.getBoundingClientRect()
    const targetCenter = rect.top + rect.height / 2
    window.scrollBy({ top: targetCenter - floor / 2, behavior })
  }, [filledBlanks, filledRefSteps, inReferencePhase, targetRef, dockRef])
}
