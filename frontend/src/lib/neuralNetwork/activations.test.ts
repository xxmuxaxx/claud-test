import { describe, expect, it } from 'vitest'
import { activationIds, activations } from './activations'

describe('activation functions', () => {
  it('sigmoid squashes numbers into (0, 1)', () => {
    const { apply } = activations.sigmoid
    expect(apply(0)).toBe(0.5)
    expect(apply(2)).toBeCloseTo(0.8808, 4)
    expect(apply(-2)).toBeCloseTo(0.1192, 4)
    expect(apply(1000)).toBe(1)
    expect(apply(-1000)).toBe(0)
  })

  it('relu passes positive numbers and blocks negative ones', () => {
    const { apply } = activations.relu
    expect(apply(3.5)).toBe(3.5)
    expect(apply(0)).toBe(0)
    expect(apply(-3.5)).toBe(0)
  })

  it('tanh squashes numbers into (-1, 1)', () => {
    const { apply } = activations.tanh
    expect(apply(0)).toBe(0)
    expect(apply(1)).toBeCloseTo(0.7616, 4)
    expect(apply(-1)).toBeCloseTo(-0.7616, 4)
    expect(apply(50)).toBeCloseTo(1, 10)
  })

  it('linear returns the number unchanged', () => {
    const { apply } = activations.linear
    expect(apply(-7.25)).toBe(-7.25)
    expect(apply(42)).toBe(42)
  })

  it('has known derivatives at a few points', () => {
    expect(activations.sigmoid.derivative(0)).toBe(0.25)
    expect(activations.relu.derivative(2)).toBe(1)
    expect(activations.relu.derivative(-2)).toBe(0)
    expect(activations.tanh.derivative(0)).toBe(1)
    expect(activations.linear.derivative(123)).toBe(1)
  })

  it.each(activationIds)('the derivative of %s matches its slope', (id) => {
    const { apply, derivative } = activations[id]
    const h = 1e-6
    for (const z of [-2.5, -0.7, 0.3, 1.9]) {
      const slope = (apply(z + h) - apply(z - h)) / (2 * h)
      expect(derivative(z)).toBeCloseTo(slope, 5)
    }
  })

  it('lists all four activations for the settings panel', () => {
    expect([...activationIds].sort()).toEqual(['linear', 'relu', 'sigmoid', 'tanh'])
  })
})
