/** "#React " -> "react": tags are stored lowercase, without `#`, spaces become dashes. */
export function normalizeTag(raw: string): string {
  return raw.trim().replace(/^#+/, '').trim().toLowerCase().replace(/\s+/g, '-')
}

/** Normalizes, drops empty tags and duplicates, keeps the author's order. */
export function normalizeTags(raw: readonly string[]): string[] {
  return [...new Set(raw.map(normalizeTag).filter(Boolean))]
}
