import { useCallback, useEffect, useState } from 'react'

export interface AsyncData<T> {
  /** `loading` until the first result; `error` when the latest request failed. */
  status: 'loading' | 'ready' | 'error'
  data: T | undefined
  error: unknown
  /** A request for new parameters is in flight while `data` still shows the previous result. */
  isStale: boolean
  reload: () => void
}

interface Settled<T> {
  fetcher: () => Promise<T>
  attempt: number
  data?: T
  error?: unknown
  failed: boolean
}

/**
 * Runs `fetcher` whenever its identity changes (wrap it in `useCallback` with the request
 * parameters as dependencies) and ignores responses that arrive after a newer request started.
 * With `keepPrevious` the previous result stays available while the next one loads
 * (search-as-you-type); without it `data` is empty until the new result arrives.
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  { keepPrevious = false }: { keepPrevious?: boolean } = {},
): AsyncData<T> {
  const [attempt, setAttempt] = useState(0)
  const [settled, setSettled] = useState<Settled<T> | null>(null)

  useEffect(() => {
    let current = true
    fetcher().then(
      (data) => current && setSettled({ fetcher, attempt, data, failed: false }),
      (error: unknown) => current && setSettled({ fetcher, attempt, error, failed: true }),
    )
    return () => {
      current = false
    }
  }, [fetcher, attempt])

  const reload = useCallback(() => setAttempt((value) => value + 1), [])

  const isCurrent = settled?.fetcher === fetcher && settled.attempt === attempt
  if (!settled || (!isCurrent && !keepPrevious)) {
    return { status: 'loading', data: undefined, error: undefined, isStale: false, reload }
  }
  return {
    status: settled.failed ? 'error' : 'ready',
    data: settled.data,
    error: settled.error,
    isStale: !isCurrent,
    reload,
  }
}
