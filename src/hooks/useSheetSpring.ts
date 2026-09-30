import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { reducedMotion } from '../lib/motion'
import { stackDepth, type SheetLayer } from '../lib/sheetStack'
import { CLOSE, SETTLE, createSpring } from '../lib/spring'
import { useLatest } from './useLatest'
import { useScrollLock } from './useScrollLock'

interface Options {
  open: boolean
  onClose: () => void
  onExited?: () => void
  overlayRef: RefObject<HTMLDivElement | null>
  belowRef: RefObject<SheetLayer | undefined>
}

/** Springs the panel's transform directly on the node, bypassing React renders.
    `mounted` stays true until the exit animation comes to rest. */
export function useSheetSpring({
  open,
  onClose,
  onExited,
  overlayRef,
  belowRef,
}: Options) {
  const [mounted, setMounted] = useState(open)
  const [prevOpen, setPrevOpen] = useState(open)
  const [depth, setDepth] = useState(() => (open ? stackDepth() : 0))
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setMounted(true)
      setDepth(stackDepth())
    }
  }

  const panelRef = useRef<HTMLDivElement>(null)
  const springRef = useRef<ReturnType<typeof createSpring> | null>(null)
  const heightRef = useRef(0)
  const closingRef = useRef(false)

  const latest = useLatest({ open, onClose, onExited })

  useScrollLock(mounted)

  useLayoutEffect(() => {
    if (!mounted) return
    const panel = panelRef.current
    if (!panel) return

    heightRef.current = panel.offsetHeight
    const spring = createSpring(
      (y) => {
        panel.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`
      },
      () => {
        if (!closingRef.current) return
        // The owner declined the close, so spring back.
        if (latest.current.open) {
          closingRef.current = false
          spring.to(0, 0, SETTLE)
          return
        }
        setMounted(false)
        latest.current.onExited?.()
      },
    )
    springRef.current = spring
    spring.set(heightRef.current)

    return () => {
      spring.stop()
      springRef.current = null
    }
  }, [mounted, latest])

  useEffect(() => {
    const spring = springRef.current
    const panel = panelRef.current
    const overlay = overlayRef.current
    if (!mounted || !spring || !panel || !overlay) return

    heightRef.current = panel.offsetHeight
    closingRef.current = !open

    if (open) {
      if (reducedMotion()) spring.set(0)
      else spring.to(0, undefined, SETTLE)
      // Wait a frame so the backdrop's fade has a painted start value.
      const fadeInFrame = requestAnimationFrame(() => {
        overlay.style.opacity = '1'
      })
      return () => cancelAnimationFrame(fadeInFrame)
    }

    overlay.style.opacity = '0'
    belowRef.current?.cover(false)
    if (reducedMotion()) {
      spring.set(heightRef.current)
      const frame = requestAnimationFrame(() => {
        setMounted(false)
        latest.current.onExited?.()
      })
      return () => cancelAnimationFrame(frame)
    }
    spring.to(heightRef.current, undefined, CLOSE)
  }, [open, mounted, overlayRef, belowRef, latest])

  return { mounted, depth, panelRef, springRef, heightRef, closingRef }
}
