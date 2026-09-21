type ClassValue = string | number | null | boolean | undefined

/**
 * Tiny className joiner (no extra dependency needed for a starter project).
 * Swap for `clsx` + `tailwind-merge` if the project grows more complex class logic.
 */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ')
}
