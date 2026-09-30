import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

let backRequestedByApp = false

/** True when the pending POP came from an in-app back control, not the
    browser's own back gesture (which the browser has already animated). */
export function isAppNavigation() {
  return backRequestedByApp
}

export function clearAppNavigation() {
  backRequestedByApp = false
}

/** Use for every in-app back control instead of `navigate(-1)`, or the
    transition won't animate. */
export function useBack() {
  const navigate = useNavigate()
  return useCallback(() => {
    backRequestedByApp = true
    navigate(-1)
  }, [navigate])
}
