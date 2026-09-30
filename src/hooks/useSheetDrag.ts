import { useEffect, useRef, type RefObject } from 'react'
import { CLOSE, SETTLE, type Spring } from '../lib/spring'
import { useLatest } from './useLatest'

const DISMISS_DRAG_RATIO = 0.25
const DISMISS_VELOCITY_PX_PER_MS = 0.5
const MAX_OVERPULL_PX = 64
const DRAG_START_THRESHOLD_PX = 4
const THROW_MAX_AGE_MS = 80
const MIN_VELOCITY_SAMPLE_MS = 4

interface Drag {
  active: boolean
  claimed: boolean
  yieldedToScroll: boolean
  startedInBody: boolean
  startY: number
  panelYAtClaim: number
  fingerYAtClaim: number
  lastY: number
  lastAt: number
  velocity: number
}

interface Options {
  mounted: boolean
  dismissible: boolean
  onClose: () => void
  panelRef: RefObject<HTMLDivElement | null>
  bodyRef: RefObject<HTMLDivElement | null>
  springRef: RefObject<Spring | null>
  heightRef: RefObject<number>
  closingRef: RefObject<boolean>
}

/** Drag-to-dismiss with rubber-banding and throw velocity. The returned ref is
    true right after a drag, so the click it produces can be swallowed. */
export function useSheetDrag({
  mounted,
  dismissible,
  onClose,
  panelRef,
  bodyRef,
  springRef,
  heightRef,
  closingRef,
}: Options) {
  const draggedRef = useRef(false)
  const latestClose = useLatest(onClose)

  useEffect(() => {
    const panel = panelRef.current
    const spring = springRef.current
    if (!mounted || !panel || !spring) return

    const drag: Drag = {
      active: false,
      claimed: false,
      yieldedToScroll: false,
      startedInBody: false,
      startY: 0,
      panelYAtClaim: 0,
      fingerYAtClaim: 0,
      lastY: 0,
      lastAt: 0,
      velocity: 0,
    }

    const rubberBand = (y: number) => {
      const dampen = (d: number) => MAX_OVERPULL_PX * (1 - 1 / (d / MAX_OVERPULL_PX + 1))
      if (y < 0) return -dampen(-y)
      return dismissible ? y : dampen(y)
    }

    const begin = (y: number, target: EventTarget | null) => {
      const body = bodyRef.current
      const inBody = !!body && target instanceof Node && body.contains(target)
      drag.active = true
      drag.claimed = false
      drag.yieldedToScroll = inBody && body.scrollTop > 0
      drag.startedInBody = inBody
      drag.startY = y
      drag.lastY = y
      drag.lastAt = performance.now()
      drag.velocity = 0
      draggedRef.current = false
    }

    const claim = (y: number) => {
      drag.claimed = true
      draggedRef.current = true
      spring.stop()
      drag.panelYAtClaim = spring.value
      drag.fingerYAtClaim = y
      heightRef.current = panel.offsetHeight
      panel.style.userSelect = 'none'
    }

    /** Returns true when the drag owns the event and it should be prevented. */
    const move = (y: number) => {
      if (!drag.active || drag.yieldedToScroll) return false

      const now = performance.now()
      const dt = now - drag.lastAt
      if (dt > MIN_VELOCITY_SAMPLE_MS) {
        drag.velocity = (y - drag.lastY) / dt
        drag.lastY = y
        drag.lastAt = now
      }

      if (!drag.claimed) {
        const dy = y - drag.startY
        if (Math.abs(dy) < DRAG_START_THRESHOLD_PX) return false
        if (drag.startedInBody && dy < 0) {
          drag.yieldedToScroll = true
          return false
        }
        claim(y)
      }

      spring.set(rubberBand(drag.panelYAtClaim + (y - drag.fingerYAtClaim)))
      return true
    }

    const end = () => {
      if (!drag.active) return
      const claimed = drag.claimed
      drag.active = false
      drag.claimed = false
      drag.yieldedToScroll = false
      if (!claimed) return

      panel.style.userSelect = ''
      const h = heightRef.current || panel.offsetHeight
      const stale = performance.now() - drag.lastAt > THROW_MAX_AGE_MS
      const velocity = stale ? 0 : drag.velocity
      const velocityPxPerSec = velocity * 1000
      const far = spring.value > h * DISMISS_DRAG_RATIO
      const fast = velocity > DISMISS_VELOCITY_PX_PER_MS
      if (dismissible && (far || fast)) {
        closingRef.current = true
        spring.to(h, velocityPxPerSec, CLOSE)
        latestClose.current()
      } else {
        spring.to(0, velocityPxPerSec, SETTLE)
      }
    }

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) return end()
      begin(e.touches[0].clientY, e.target)
    }
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) return
      if (move(e.touches[0].clientY) && e.cancelable) e.preventDefault()
    }
    const onMouseMove = (e: MouseEvent) => {
      if (move(e.clientY)) e.preventDefault()
    }
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      end()
    }
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      begin(e.clientY, e.target)
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    }

    // Native listeners because iOS only lets a non-passive `touchmove` cancel.
    panel.addEventListener('touchstart', onTouchStart, { passive: true })
    panel.addEventListener('touchmove', onTouchMove, { passive: false })
    panel.addEventListener('touchend', end)
    panel.addEventListener('touchcancel', end)
    panel.addEventListener('mousedown', onMouseDown)
    return () => {
      panel.removeEventListener('touchstart', onTouchStart)
      panel.removeEventListener('touchmove', onTouchMove)
      panel.removeEventListener('touchend', end)
      panel.removeEventListener('touchcancel', end)
      panel.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      panel.style.userSelect = ''
    }
  }, [
    mounted,
    dismissible,
    panelRef,
    bodyRef,
    springRef,
    heightRef,
    closingRef,
    latestClose,
  ])

  return draggedRef
}
