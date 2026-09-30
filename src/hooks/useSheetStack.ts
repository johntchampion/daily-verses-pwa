import { useEffect, useState, type RefObject } from 'react'
import {
  isTopLayer,
  pushLayer,
  removeLayer,
  stackDepth,
  topLayer,
  type SheetLayer,
} from '../lib/sheetStack'
import { useLatest } from './useLatest'

interface Options {
  mounted: boolean
  dismissible: boolean
  onClose: () => void
  overlayRef: RefObject<HTMLDivElement | null>
  panelRef: RefObject<HTMLDivElement | null>
  belowRef: RefObject<SheetLayer | undefined>
}

/** Registers the sheet on the stack and makes everything behind it inert.
    Returns whether another sheet has opened over this one. */
export function useSheetStack({
  mounted,
  dismissible,
  onClose,
  overlayRef,
  panelRef,
  belowRef,
}: Options): boolean {
  const [covered, setCovered] = useState(false)
  const latestClose = useLatest(onClose)

  useEffect(() => {
    if (!mounted) return
    const overlay = overlayRef.current
    const root = document.getElementById('root')
    const previous = document.activeElement
    const below = topLayer()
    belowRef.current = below
    below?.overlay.setAttribute('inert', '')
    below?.cover(true)
    if (overlay) pushLayer({ overlay, cover: setCovered })
    root?.setAttribute('inert', '')
    panelRef.current?.focus({ preventScroll: true })
    return () => {
      if (overlay) removeLayer(overlay)
      below?.overlay.removeAttribute('inert')
      below?.cover(false)
      belowRef.current = undefined
      if (stackDepth() === 0) root?.removeAttribute('inert')
      // Only after removing `inert`, so focus can land back in the sheet below.
      if (previous instanceof HTMLElement) previous.focus({ preventScroll: true })
    }
  }, [mounted, overlayRef, panelRef, belowRef])

  useEffect(() => {
    if (!mounted || !dismissible) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (!isTopLayer(overlayRef.current)) return
      latestClose.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mounted, dismissible, overlayRef, latestClose])

  return covered
}
