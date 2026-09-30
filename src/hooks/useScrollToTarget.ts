import { useEffect, useRef, type RefObject } from 'react'
import { reducedMotion } from '../lib/motion'

const TARGET_CLEARANCE_PX = 12

/** On desktop the dock has no box (`display: contents`), so the viewport
    bottom stands in for it. */
function dockTop(dock: HTMLElement | null): number {
  if (!dock) return window.innerHeight
  const rect = dock.getBoundingClientRect()
  return rect.height === 0 ? window.innerHeight : rect.top
}

function isOutOfView(target: HTMLElement, dock: HTMLElement | null): boolean {
  const rect = target.getBoundingClientRect()
  return (
    rect.bottom > dockTop(dock) - TARGET_CLEARANCE_PX ||
    rect.top < TARGET_CLEARANCE_PX
  )
}

/** Keeps whatever has to be tapped next in view above the dock. */
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
  const hasMounted = useRef(false)

  useEffect(() => {
    const behavior: ScrollBehavior = reducedMotion() ? 'auto' : 'smooth'
    const isMount = !hasMounted.current
    hasMounted.current = true

    if (inReferencePhase) {
      window.scrollTo({ top: 0, behavior: isMount ? 'auto' : behavior })
      return
    }

    if (isMount) {
      window.scrollTo({ top: 0, behavior: 'auto' })
      return
    }

    const target = targetRef.current
    const dock = dockRef.current
    if (!target || !isOutOfView(target, dock)) return
    // Centre in the space above the dock, which `scrollIntoView` can't see.
    const visibleBottom = dockTop(dock)
    const rect = target.getBoundingClientRect()
    const targetCenter = rect.top + rect.height / 2
    window.scrollBy({ top: targetCenter - visibleBottom / 2, behavior })
  }, [filledBlanks, filledRefSteps, inReferencePhase, targetRef, dockRef])
}
