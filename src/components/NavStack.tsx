import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useLocation, useNavigationType, type Location } from 'react-router-dom'
import { clearAppNavigation, isAppNavigation } from '../hooks/useBack'
import { useScreenTransition } from '../hooks/useScreenTransition'
import { reducedMotion } from '../lib/motion'
import { directionFor, type Direction } from '../lib/navDepth'
import { rememberScroll, recallScroll, restoreScroll } from '../lib/scrollMemory'

interface Layer {
  key: string
  location: Location
}

/** Renders the current screen, holding both screens during a push/pop so it
    can animate between them. */
export default function NavStack({
  render,
}: {
  render: (location: Location) => ReactNode
}) {
  const location = useLocation()
  const navigationType = useNavigationType()

  const [layers, setLayers] = useState<Layer[]>(() => [
    { key: location.key, location },
  ])
  const [transit, setTransit] = useState<Direction | null>(null)
  const [prevKey, setPrevKey] = useState(location.key)

  const [unanimatedScrollTarget, setUnanimatedScrollTarget] = useState<
    number | null
  >(null)

  // During render rather than in an effect, so the incoming screen is parked
  // off-screen in the same commit that mounts it.
  if (location.key !== prevKey) {
    setPrevKey(location.key)
    const leaving = layers[layers.length - 1]
    const arriving: Layer = { key: location.key, location }

    rememberScroll(leaving.key, window.scrollY)

    const direction = directionFor(leaving.location.pathname, location.pathname)
    const isRedirect = navigationType === 'REPLACE'
    const browserAlreadyAnimatedBack =
      navigationType === 'POP' && !isAppNavigation()
    const animate =
      direction !== null &&
      !isRedirect &&
      !browserAlreadyAnimatedBack &&
      !reducedMotion()

    if (animate) {
      setLayers([leaving, arriving])
      setTransit(direction)
      setUnanimatedScrollTarget(null)
    } else {
      setLayers([arriving])
      setTransit(null)
      setUnanimatedScrollTarget(
        direction === 'push'
          ? 0
          : direction === 'pop'
            ? recallScroll(arriving.key)
            : null,
      )
    }
  }

  useEffect(() => {
    clearAppNavigation()
  }, [location.key])

  // Keyed on `layers` too, since two pops in a row can want the same offset.
  useLayoutEffect(() => {
    if (unanimatedScrollTarget === null) return
    restoreScroll(unanimatedScrollTarget)
  }, [layers, unanimatedScrollTarget])

  const stackRef = useRef<HTMLDivElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)
  const nodes = useRef(new Map<string, HTMLDivElement>())

  const onSettled = useCallback((to: Layer) => {
    setLayers([to])
    setTransit(null)
  }, [])

  useScreenTransition({
    transit,
    layers,
    stackRef,
    scrimRef,
    nodes,
    onSettled,
  })

  return (
    <div className='nav-stack' ref={stackRef}>
      {layers.map((layer, i) => (
        <div
          key={layer.key}
          className='nav-layer'
          inert={transit !== null && i === 0}
          data-role={
            transit === null
              ? undefined
              : (transit === 'push') === (i === 1)
                ? 'over'
                : 'under'
          }
          ref={(el) => {
            if (el) nodes.current.set(layer.key, el)
            else nodes.current.delete(layer.key)
          }}
        >
          <div className='nav-layer-inner'>{render(layer.location)}</div>
        </div>
      ))}
      {transit !== null && (
        <div className='nav-scrim' ref={scrimRef} aria-hidden='true' />
      )}
    </div>
  )
}
