import { useSyncExternalStore } from 'react'

/** Must match the breakpoint in desktop.css and top-nav.css. */
const DESKTOP_MEDIA_QUERY = '(min-width: 744px)'

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(DESKTOP_MEDIA_QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

/** For decisions made during render, where a subscription can't help. */
export const isDesktop = () => window.matchMedia(DESKTOP_MEDIA_QUERY).matches

export function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribe, isDesktop, () => false)
}
