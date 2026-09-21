/** Local calendar date as `YYYY-MM-DD` — the same format `<input type="date">` produces. */
export function toISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** "20 сентября"; the year is added only when it differs from the current one. */
export function formatDueDate(isoDate: string, now: Date = new Date()): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: year === now.getFullYear() ? undefined : 'numeric',
  }).format(new Date(year, month - 1, day))
}
