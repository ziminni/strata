import { useSyncExternalStore } from 'react'

/** true while the CSS media query matches (e.g. '(min-width: 1024px)'). */
export function useMedia(query) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query)
      m.addEventListener('change', cb)
      return () => m.removeEventListener('change', cb)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** Desktop layout (Tailwind `lg`, ≥1024px): sidebar nav, Dashboard + Farm side by side. Phones/tablets are unaffected. */
export const useIsDesktop = () => useMedia('(min-width: 1024px)')
