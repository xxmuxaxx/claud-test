import { describe, expect, it } from 'vitest'
import { createRandom, randomBetween, randomNormal } from './random'

describe('random', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = createRandom(7)
    const b = createRandom(7)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('gives different sequences for different seeds', () => {
    expect(createRandom(1)()).not.toBe(createRandom(2)())
  })

  it('stays in [0, 1)', () => {
    const random = createRandom(3)
    for (let i = 0; i < 1000; i++) {
      const value = random()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('scales into a range', () => {
    expect(randomBetween(() => 0, 2, 6)).toBe(2)
    expect(randomBetween(() => 0.5, 2, 6)).toBe(4)
  })

  it('makes normally distributed numbers', () => {
    const random = createRandom(11)
    const values = Array.from({ length: 5000 }, () => randomNormal(random))
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length
    expect(mean).toBeCloseTo(0, 1)
    expect(variance).toBeCloseTo(1, 1)
  })
})
