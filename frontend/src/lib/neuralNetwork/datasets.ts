import { createRandom, randomBetween, randomNormal, type Random } from './random'
import type { Sample } from './neuralNetwork'

export type DatasetId = 'xor' | 'and' | 'or' | 'clusters' | 'circle'

/** Shown in this order in the settings panel. */
export const datasetIds: DatasetId[] = ['xor', 'and', 'or', 'clusters', 'circle']

/** The part of the (x1, x2) plane that the decision boundary is drawn over. */
export interface Bounds {
  min: number
  max: number
}

export interface Dataset {
  id: DatasetId
  /** `logic`: the four corners of a truth table. `plane`: many points scattered on the plane. */
  kind: 'logic' | 'plane'
  /** Every sample has two inputs (a point on the plane) and one target: class 0 or class 1. */
  samples: Sample[]
  bounds: Bounds
}

/** A fixed seed: the scattered datasets are the same on every visit, so runs can be compared. */
const DATASET_SEED = 2048
const POINTS_PER_CLASS = 40

const logicBounds: Bounds = { min: -0.25, max: 1.25 }
const planeBounds: Bounds = { min: -1.25, max: 1.25 }

/** A truth table: the four input pairs and what `rule` says about each. */
function logicDataset(id: DatasetId, rule: (a: number, b: number) => number): Dataset {
  const inputs = [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ]
  return {
    id,
    kind: 'logic',
    samples: inputs.map(([a, b]) => ({ inputs: [a, b], targets: [rule(a, b)] })),
    bounds: logicBounds,
  }
}

/** Two round blobs of points: class 0 lower left, class 1 upper right. Separable by a straight line. */
function clustersDataset(random: Random): Dataset {
  const blob = (center: number, target: number): Sample[] =>
    Array.from({ length: POINTS_PER_CLASS }, () => ({
      inputs: [center + randomNormal(random) * 0.2, center + randomNormal(random) * 0.2],
      targets: [target],
    }))
  return {
    id: 'clusters',
    kind: 'plane',
    samples: [...blob(-0.5, 0), ...blob(0.5, 1)],
    bounds: planeBounds,
  }
}

/** Class 1 is a disc in the middle, class 0 a ring around it. No straight line separates them. */
function circleDataset(random: Random): Dataset {
  const pointAt = (radius: number, target: number): Sample => {
    const angle = randomBetween(random, 0, 2 * Math.PI)
    return { inputs: [radius * Math.cos(angle), radius * Math.sin(angle)], targets: [target] }
  }
  // sqrt keeps the points evenly spread over the area instead of crowding at the centre.
  const inside = () => pointAt(0.5 * Math.sqrt(random()), 1)
  const outside = () => pointAt(Math.sqrt(randomBetween(random, 0.75 ** 2, 1)), 0)
  return {
    id: 'circle',
    kind: 'plane',
    samples: [
      ...Array.from({ length: POINTS_PER_CLASS }, outside),
      ...Array.from({ length: POINTS_PER_CLASS }, inside),
    ],
    bounds: planeBounds,
  }
}

export function createDataset(id: DatasetId, random: Random = createRandom(DATASET_SEED)): Dataset {
  switch (id) {
    case 'xor':
      return logicDataset(id, (a, b) => (a !== b ? 1 : 0))
    case 'and':
      return logicDataset(id, (a, b) => a * b)
    case 'or':
      return logicDataset(id, (a, b) => Math.max(a, b))
    case 'clusters':
      return clustersDataset(random)
    case 'circle':
      return circleDataset(random)
  }
}
