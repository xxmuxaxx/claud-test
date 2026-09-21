import { describe, expect, it } from 'vitest'
import { formatDueDate, formatFullDate, formatRelativeDate } from './dates'

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

describe('formatRelativeDate', () => {
  // Local noon, so the calendar day is the same in every time zone.
  const now = new Date(2026, 8, 21, 12)
  const daysAgo = (days: number) => new Date(2026, 8, 21 - days, 8).toISOString()

  it('says today / yesterday / N days ago', () => {
    expect(formatRelativeDate(daysAgo(0), 'ru', now)).toBe('сегодня')
    expect(formatRelativeDate(daysAgo(1), 'ru', now)).toBe('вчера')
    expect(formatRelativeDate(daysAgo(3), 'ru', now)).toBe('3 дня назад')
    expect(formatRelativeDate(daysAgo(0), 'en', now)).toBe('today')
  })

  it('switches to a full date after a week', () => {
    expect(formatRelativeDate(daysAgo(6), 'en', now)).toBe('6 days ago')
    expect(formatRelativeDate(daysAgo(7), 'en', now)).toBe('September 14, 2026')
  })

  it('shows a full date for timestamps in the future', () => {
    expect(formatRelativeDate(daysAgo(-2), 'en', now)).toBe('September 23, 2026')
  })
})

describe('formatFullDate', () => {
  it('formats a long date with the year', () => {
    const iso = new Date(2026, 8, 20, 12).toISOString()
    expect(formatFullDate(iso, 'ru')).toBe('20 сентября 2026 г.')
    expect(formatFullDate(iso, 'en')).toBe('September 20, 2026')
  })
})
