import { describe, expect, it } from 'vitest'
import { createNumberFormatter } from './numbers'

describe('createNumberFormatter', () => {
  it('uses a fixed number of decimals in the locale of the language', () => {
    expect(createNumberFormatter('en', 2)(0.5)).toBe('0.50')
    expect(createNumberFormatter('ru', 2)(0.5)).toBe('0,50')
    expect(createNumberFormatter('en', 4)(0.034219)).toBe('0.0342')
  })

  it('never prints a negative zero', () => {
    expect(createNumberFormatter('en', 2)(-0.001)).toBe('0.00')
    expect(createNumberFormatter('en', 2)(-0.02)).toBe('-0.02')
  })
})
