import { useEffect, useState } from 'react'

/** How long typing has to pause before a search request is sent. */
export const SEARCH_DEBOUNCE_MS = 250

/** Follows `value` after it has stayed unchanged for `delay` ms. */
export function useDebouncedValue<T>(value: T, delay = SEARCH_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
