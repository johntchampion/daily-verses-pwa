import { useEffect, useRef } from 'react'

/** A ref to the latest value, for handlers that outlive a render. */
export function useLatest<T>(value: T) {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  })
  return ref
}
