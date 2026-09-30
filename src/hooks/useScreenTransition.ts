import { useLayoutEffect, type RefObject } from 'react'
import type { Location } from 'react-router-dom'
import type { Direction } from '../lib/navDepth'
import { recallScroll, restoreScroll } from '../lib/scrollMemory'
import { createSpring, type SpringConfig } from '../lib/spring'

const UNDER_PARALLAX_RATIO = 0.3

const MAX_SCRIM_OPACITY = 0.12

const SCREEN_SPRING: SpringConfig = {
  tension: 250,
  friction: 26,
  mass: 1,
  clamp: true,
}

interface Layer {
  key: string
  location: Location
}

const layerContent = (layer: HTMLElement) => layer.firstElementChild as HTMLElement

/** Springs the front screen's x offset (in px) between the outgoing and
    incoming screens; everything else is derived from it. */
export function useScreenTransition({
  transit,
  layers,
  stackRef,
  scrimRef,
  nodes,
  onSettled,
}: {
  transit: Direction | null
  layers: Layer[]
  stackRef: RefObject<HTMLDivElement | null>
  scrimRef: RefObject<HTMLDivElement | null>
  nodes: RefObject<Map<string, HTMLDivElement>>
  onSettled: (to: Layer) => void
}) {
  useLayoutEffect(() => {
    if (transit === null || layers.length !== 2) return
    const stack = stackRef.current
    const scrim = scrimRef.current
    const [from, to] = layers
    const fromEl = nodes.current.get(from.key)
    const toEl = nodes.current.get(to.key)
    if (!stack || !scrim || !fromEl || !toEl) return

    const push = transit === 'push'
    const over = push ? toEl : fromEl
    const under = push ? fromEl : toEl
    const width = stack.clientWidth || window.innerWidth

    const leavingScroll = recallScroll(from.key)
    const arrivingScroll = push ? 0 : recallScroll(to.key)

    // Out of flow, the screens can't scroll, so each is offset instead.
    layerContent(fromEl).style.top = `-${leavingScroll}px`
    layerContent(toEl).style.top = `-${arrivingScroll}px`

    stack.classList.add('nav-transit')

    const applyOffset = (x: number) => {
      const coverage = 1 - x / width
      over.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`
      under.style.transform = `translate3d(${(-coverage * UNDER_PARALLAX_RATIO * width).toFixed(2)}px, 0, 0)`
      scrim.style.opacity = (coverage * MAX_SCRIM_OPACITY).toFixed(3)
    }

    const spring = createSpring(applyOffset, () => onSettled(to))
    spring.set(push ? width : 0)
    spring.to(push ? 0 : width, 0, SCREEN_SPRING)

    return () => {
      spring.stop()
      stack.classList.remove('nav-transit')
      for (const el of [fromEl, toEl]) {
        el.style.transform = ''
        layerContent(el).style.top = ''
      }
      scrim.style.opacity = ''
      restoreScroll(arrivingScroll)
    }
  }, [transit, layers, stackRef, scrimRef, nodes, onSettled])
}
