import { describe, expect, it } from 'vitest'
import { createRandom } from './random'
import {
  createSession,
  downsample,
  isFinished,
  runIteration,
  type ModelSettings,
  type TrainingSettings,
} from './trainingSession'

const model: ModelSettings = { datasetId: 'xor', hiddenLayers: [4], activation: 'tanh' }
const settings: TrainingSettings = { learningRate: 0.5, maxEpochs: 100, epochsPerStep: 10 }

describe('createSession', () => {
  it('builds an untrained network for the dataset, at epoch 0', () => {
    const session = createSession({ ...model, hiddenLayers: [3, 2] }, createRandom(1))

    expect(session.dataset.id).toBe('xor')
    expect(session.network.layers.map((layer) => layer.weights.length)).toEqual([3, 2, 1])
    expect(session.epoch).toBe(0)
    expect(session.loss).toBeGreaterThan(0)
    expect(session.history).toEqual([{ epoch: 0, loss: session.loss }])
  })

  it('uses the chosen activation for hidden layers', () => {
    const session = createSession({ ...model, activation: 'relu' }, createRandom(1))
    expect(session.network.layers.map((layer) => layer.activation)).toEqual(['relu', 'sigmoid'])
  })
})

describe('runIteration', () => {
  const start = createSession(model, createRandom(1))

  it('trains for epochsPerStep epochs and records a point on the loss chart', () => {
    const next = runIteration(start, settings)

    expect(next.epoch).toBe(10)
    expect(next.loss).toBeLessThan(start.loss)
    expect(next.history).toHaveLength(2)
    expect(next.history[1]).toEqual({ epoch: 10, loss: next.loss })
    expect(next.network).not.toEqual(start.network)
  })

  it('does not stop the old session from being reused', () => {
    runIteration(start, settings)
    expect(start.epoch).toBe(0)
    expect(start.history).toHaveLength(1)
  })

  it('never goes past maxEpochs', () => {
    const session = runIteration(start, { ...settings, maxEpochs: 4 })
    expect(session.epoch).toBe(4)
  })

  it('does nothing once training is finished', () => {
    const done = runIteration(start, { ...settings, maxEpochs: 10 })
    expect(isFinished(done, { ...settings, maxEpochs: 10 })).toBe(true)
    expect(runIteration(done, { ...settings, maxEpochs: 10 })).toBe(done)
  })

  it('can continue after maxEpochs is raised', () => {
    const done = runIteration(start, { ...settings, maxEpochs: 10 })
    const more = runIteration(done, { ...settings, maxEpochs: 30 })
    expect(more.epoch).toBe(20)
  })

  it('reports accuracy along with the loss', () => {
    const trained = runIteration(start, { ...settings, maxEpochs: 500, epochsPerStep: 500 })
    expect(trained.accuracy).toBe(1)
  })
})

describe('downsample', () => {
  it('keeps short lists as they are', () => {
    expect(downsample([1, 2, 3], 5)).toEqual([1, 2, 3])
  })

  it('shrinks long lists to the limit, keeping the first and last points', () => {
    const points = Array.from({ length: 1001 }, (_, i) => i)
    const result = downsample(points, 11)

    expect(result).toHaveLength(11)
    expect(result[0]).toBe(0)
    expect(result[10]).toBe(1000)
  })
})
