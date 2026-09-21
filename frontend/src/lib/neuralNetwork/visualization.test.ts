import { describe, expect, it } from 'vitest'
import type { Network } from './neuralNetwork'
import {
  diagramHeight,
  DIAGRAM_WIDTH,
  fromFractions,
  layerSizes,
  layoutNeurons,
  sampleDecisionGrid,
  toPixels,
} from './visualization'

/** Answers 1 where x1 > 0 and 0 elsewhere (a very steep sigmoid), whatever x2 is. */
const rightHalf: Network = {
  inputSize: 2,
  layers: [{ weights: [[1000, 0]], biases: [0], activation: 'sigmoid' }],
}

describe('layoutNeurons', () => {
  const positions = layoutNeurons([2, 4, 1])

  it('puts one column per layer with one point per neuron', () => {
    expect(positions.map((layer) => layer.length)).toEqual([2, 4, 1])
  })

  it('goes left to right, inside the drawing', () => {
    const xs = positions.map((layer) => layer[0].x)
    expect(xs[0]).toBeLessThan(xs[1])
    expect(xs[1]).toBeLessThan(xs[2])
    expect(xs[0]).toBeGreaterThan(0)
    expect(xs[2]).toBeLessThan(DIAGRAM_WIDTH)
  })

  it('centres every layer on the same horizontal axis', () => {
    const centers = positions.map((layer) => layer.reduce((sum, p) => sum + p.y, 0) / layer.length)
    expect(centers[0]).toBeCloseTo(centers[1])
    expect(centers[1]).toBeCloseTo(centers[2])
  })

  it('keeps neurons of a layer apart and inside the height', () => {
    const height = diagramHeight([2, 4, 1])
    const column = positions[1]
    expect(column[1].y).toBeGreaterThan(column[0].y + 40)
    expect(column[0].y).toBeGreaterThan(0)
    expect(column[3].y).toBeLessThan(height)
  })

  it('reads the layer sizes off a network', () => {
    expect(layerSizes(rightHalf)).toEqual([2, 1])
  })
})

describe('sampleDecisionGrid', () => {
  const bounds = { min: -1, max: 1 }
  const grid = sampleDecisionGrid(rightHalf, bounds, 4)

  it('has one row and one column per cell', () => {
    expect(grid).toHaveLength(4)
    expect(grid.every((row) => row.length === 4)).toBe(true)
  })

  it('has columns from the smallest x1 to the largest', () => {
    for (const row of grid) {
      expect(row[0]).toBeLessThan(0.5)
      expect(row[1]).toBeLessThan(0.5)
      expect(row[2]).toBeGreaterThan(0.5)
      expect(row[3]).toBeGreaterThan(0.5)
    }
  })

  it('has rows from the largest x2 to the smallest', () => {
    const bySecondInput: Network = {
      inputSize: 2,
      layers: [{ weights: [[0, 1000]], biases: [0], activation: 'sigmoid' }],
    }
    const upDown = sampleDecisionGrid(bySecondInput, bounds, 4)
    expect(upDown[0][0]).toBeGreaterThan(0.5) // top row: x2 > 0
    expect(upDown[3][0]).toBeLessThan(0.5) // bottom row: x2 < 0
  })
})

describe('pixels and back', () => {
  const bounds = { min: 0, max: 2 }

  it('maps the corners of the plane to the corners of the square, x2 upwards', () => {
    expect(toPixels([0, 0], bounds, 100)).toEqual({ x: 0, y: 100 })
    expect(toPixels([2, 2], bounds, 100)).toEqual({ x: 100, y: 0 })
    expect(toPixels([1, 1], bounds, 100)).toEqual({ x: 50, y: 50 })
  })

  it('turns a click position back into a point of the plane', () => {
    expect(fromFractions(0, 1, bounds)).toEqual([0, 0])
    expect(fromFractions(1, 0, bounds)).toEqual([2, 2])
    expect(fromFractions(0.25, 0.5, bounds)).toEqual([0.5, 1])
  })
})
