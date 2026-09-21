import { useOutletContext } from 'react-router'

/** State shared by the wiki layout (sidebar search) and the pages rendered inside it. */
export interface WikiOutletContext {
  query: string
  setQuery: (query: string) => void
}

export const useWikiOutletContext = () => useOutletContext<WikiOutletContext>()
