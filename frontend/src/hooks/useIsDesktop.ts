import { useSyncExternalStore } from 'react'

/** Tailwind's `lg` breakpoint: the wiki shows a sidebar and a split editor from here up. */
const DESKTOP_QUERY = '(min-width: 1024px)'

function subscribe(onChange: () => void) {
  const query = window.matchMedia?.(DESKTOP_QUERY)
  query?.addEventListener('change', onChange)
  return () => query?.removeEventListener('change', onChange)
}

const getSnapshot = () => window.matchMedia?.(DESKTOP_QUERY).matches ?? false

/** `false` where `matchMedia` is unavailable (jsdom), i.e. the narrow layout is the default. */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
