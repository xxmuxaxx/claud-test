const MAX_TERMS = 10

/**
 * Splits a search string into lowercase words. Every word has to match somewhere
 * (AND between words, OR between fields), which is how the frontend search always behaved.
 */
export function splitSearchTerms(
  search: string | undefined,
  transform: (term: string) => string = (term) => term,
): string[] {
  if (!search) return []
  const terms = search.toLowerCase().split(/\s+/).map(transform).filter(Boolean)
  return [...new Set(terms)].slice(0, MAX_TERMS)
}

/**
 * Prisma's `contains` passes the value to `LIKE` as is, so `%` and `_` in user input would act
 * as wildcards. PostgreSQL's default LIKE escape character is the backslash.
 */
export const escapeLike = (term: string) => term.replace(/[\\%_]/g, (char) => `\\${char}`)
