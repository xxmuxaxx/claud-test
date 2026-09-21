/** Local calendar date as `YYYY-MM-DD` — the same format `<input type="date">` produces. */
export function toISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** "20 сентября" / "September 20"; the year is added only when it differs from the current one. */
export function formatDueDate(isoDate: string, locale: string, now: Date = new Date()): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: year === now.getFullYear() ? undefined : 'numeric',
  }).format(new Date(year, month - 1, day))
}

/** Full date with the year: "20 сентября 2026 г." / "September 20, 2026". */
export function formatFullDate(isoDateTime: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(isoDateTime))
}

const RELATIVE_DAYS = 7

/** "сегодня", "вчера", "3 дня назад"; a full date once it is a week old or more. */
export function formatRelativeDate(
  isoDateTime: string,
  locale: string,
  now: Date = new Date(),
): string {
  const date = new Date(isoDateTime)
  const startOfDay = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime()
  const days = Math.round((startOfDay(date) - startOfDay(now)) / 86_400_000)

  if (days > 0 || days <= -RELATIVE_DAYS) return formatFullDate(isoDateTime, locale)
  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(days, 'day')
}
