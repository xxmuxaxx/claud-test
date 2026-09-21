/** A function that formats numbers with a fixed number of decimals for `locale` ("0,25" / "0.25"). */
export function createNumberFormatter(locale: string, fractionDigits: number) {
  const format = new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
  const half = 0.5 * 10 ** -fractionDigits
  // A tiny negative number would print as "-0,00": show a plain zero instead.
  return (value: number) => format.format(Math.abs(value) < half ? 0 : value)
}
