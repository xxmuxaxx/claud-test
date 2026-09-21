import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Joins class names and resolves conflicting Tailwind utilities: the last one wins. */
export function cn(...values: ClassValue[]): string {
  return twMerge(clsx(values))
}
