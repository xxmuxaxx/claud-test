import { describe, expect, it } from 'vitest'
import { formatDueDate } from './dates'

const now = new Date(2030, 0, 1)

describe('formatDueDate', () => {
  it('formats in the given locale', () => {
    expect(formatDueDate('2030-05-20', 'ru', now)).toBe('20 мая')
    expect(formatDueDate('2030-05-20', 'en', now)).toBe('May 20')
    expect(formatDueDate('2030-05-20', 'ka', now)).toMatch(/მაის/)
  })

  it('adds the year only when it differs from the current one', () => {
    expect(formatDueDate('2031-05-20', 'en', now)).toBe('May 20, 2031')
    expect(formatDueDate('2031-05-20', 'ru', now)).toBe('20 мая 2031 г.')
  })

  it('accepts a region-qualified locale', () => {
    expect(formatDueDate('2030-05-20', 'ru-RU', now)).toBe('20 мая')
  })
})
