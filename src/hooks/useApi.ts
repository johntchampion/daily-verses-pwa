import { useCallback, useEffect, useRef, useState } from 'react'
import { messageOf } from '../lib/errors'

export interface ApiState<T> {
  data: T | null
  loading: boolean
  /** True until data first arrives; unlike `loading`, a refetch leaves it false. */
  pending: boolean
  error: string | null
  refetch: () => void
}

interface Settled<T> {
  fetchCount: number
  data: T | null
  error: string | null
}

/** Fetch-on-mount; `refetch` covers refreshes after mutations. */
export function useApi<T>(fetcher: () => Promise<T>): ApiState<T> {
  const [fetchCount, setFetchCount] = useState(0)
  const [settled, setSettled] = useState<Settled<T> | null>(null)

  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    let cancelled = false

    fetcherRef
      .current()
      .then((data) => {
        if (!cancelled) setSettled({ fetchCount, data, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setSettled({
            fetchCount,
            data: null,
            error: messageOf(err, 'Something went wrong'),
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [fetchCount])

  const refetch = useCallback(() => setFetchCount((t) => t + 1), [])

  const loading = settled === null || settled.fetchCount !== fetchCount
  const data = settled?.data ?? null

  return {
    data,
    loading,
    pending: loading && data === null,
    error: loading ? null : (settled?.error ?? null),
    refetch,
  }
}

/** Combines several sources' pending, error and refetch into one. */
export function combineApi(...states: ApiState<unknown>[]) {
  return {
    pending: states.some((s) => s.pending),
    error: states.find((s) => s.error !== null)?.error ?? null,
    refetch: () => {
      for (const state of states) state.refetch()
    },
  }
}
