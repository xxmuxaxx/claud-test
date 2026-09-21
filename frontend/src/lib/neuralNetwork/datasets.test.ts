import { describe, expect, it } from 'vitest'
import { createDataset, datasetIds } from './datasets'
import { createRandom } from './random'

const table = (id: Parameters<typeof createDataset>[0]) =>
  createDataset(id).samples.map(({ inputs, targets }) => `${inputs.join(' ')} -> ${targets[0]}`)

describe('logic datasets', () => {
  it('XOR is 1 only when the inputs differ', () => {
    expect(table('xor')).toEqual(['0 0 -> 0', '0 1 -> 1', '1 0 -> 1', '1 1 -> 0'])
  })

  it('AND is 1 only when both inputs are 1', () => {
    expect(table('and')).toEqual(['0 0 -> 0', '0 1 -> 0', '1 0 -> 0', '1 1 -> 1'])
  })

  it('OR is 1 when any input is 1', () => {
    expect(table('or')).toEqual(['0 0 -> 0', '0 1 -> 1', '1 0 -> 1', '1 1 -> 1'])
  })
})

describe('plane datasets', () => {
  const radius = ([x, y]: number[]) => Math.hypot(x, y)

  it('clusters: two blobs of 40 points, class 1 in the upper right', () => {
    const { samples } = createDataset('clusters')
    const of = (target: number) => samples.filter((s) => s.targets[0] === target)

    expect(samples).toHaveLength(80)
    expect(of(0)).toHaveLength(40)
    expect(of(1)).toHaveLength(40)

    const mean = (points: number[][], axis: number) =>
      points.reduce((sum, p) => sum + p[axis], 0) / points.length
    expect(
      mean(
        of(0).map((s) => s.inputs),
        0,
      ),
    ).toBeLessThan(-0.3)
    expect(
      mean(
        of(1).map((s) => s.inputs),
        0,
      ),
    ).toBeGreaterThan(0.3)
  })

  it('circle: class 1 is a disc, class 0 a ring around it', () => {
    const { samples } = createDataset('circle')

    expect(samples).toHaveLength(80)
    for (const { inputs, targets } of samples) {
      if (targets[0] === 1) expect(radius(inputs)).toBeLessThanOrEqual(0.5)
      else expect(radius(inputs)).toBeGreaterThanOrEqual(0.75)
    }
    expect(samples.filter((s) => s.targets[0] === 1)).toHaveLength(40)
  })

  it('is the same every time by default, and different for another random source', () => {
    expect(createDataset('circle')).toEqual(createDataset('circle'))
    expect(createDataset('circle', createRandom(1))).not.toEqual(createDataset('circle'))
  })
})

describe.each(datasetIds)('%s dataset', (id) => {
  it('has two inputs and one 0/1 target per sample, all inside the plotted bounds', () => {
    const { samples, bounds } = createDataset(id)

    expect(samples.length).toBeGreaterThan(0)
    for (const { inputs, targets } of samples) {
      expect(inputs).toHaveLength(2)
      expect([0, 1]).toContain(targets[0])
      expect(targets).toHaveLength(1)
      for (const value of inputs) {
        expect(value).toBeGreaterThan(bounds.min)
        expect(value).toBeLessThan(bounds.max)
      }
    }
  })

  it('has both classes', () => {
    const targets = new Set(createDataset(id).samples.map((s) => s.targets[0]))
    expect(targets).toEqual(new Set([0, 1]))
  })
})
