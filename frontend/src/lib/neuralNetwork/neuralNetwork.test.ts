import { describe, expect, it } from 'vitest'
import type { ActivationId } from './activations'
import { activations } from './activations'
import { createDataset } from './datasets'
import {
  accuracy,
  applyGradients,
  backpropagate,
  createNetwork,
  datasetLoss,
  forward,
  predict,
  sampleLoss,
  trainEpoch,
  type Network,
  type Sample,
} from './neuralNetwork'
import { createRandom } from './random'

/** 2 inputs -> 2 hidden (relu) -> 1 output (linear), with weights small enough to check by hand. */
const handMade: Network = {
  inputSize: 2,
  layers: [
    {
      weights: [
        [1, 0],
        [0, -1],
      ],
      biases: [0.5, 0],
      activation: 'relu',
    },
    { weights: [[2, 3]], biases: [-1], activation: 'linear' },
  ],
}

function makeNetwork(hiddenActivation: ActivationId, hiddenSizes = [3, 2], seed = 5): Network {
  return createNetwork(
    { inputSize: 2, hiddenSizes, outputSize: 1, hiddenActivation, outputActivation: 'sigmoid' },
    createRandom(seed),
  )
}

const samples: Sample[] = [
  { inputs: [0.3, -0.8], targets: [1] },
  { inputs: [-0.5, 0.4], targets: [0] },
  { inputs: [0.9, 0.7], targets: [1] },
]

describe('createNetwork', () => {
  const network = makeNetwork('tanh', [4, 3])

  it('has a layer for every hidden layer and one for the output', () => {
    expect(network.layers).toHaveLength(3)
    expect(network.layers.map((layer) => layer.weights.length)).toEqual([4, 3, 1])
  })

  it('connects every neuron to every neuron of the previous layer', () => {
    expect(network.layers.map((layer) => layer.weights[0].length)).toEqual([2, 4, 3])
  })

  it('starts with zero biases and small random weights', () => {
    for (const layer of network.layers) {
      expect(layer.biases.every((bias) => bias === 0)).toBe(true)
      const flat = layer.weights.flat()
      expect(flat.every((weight) => Math.abs(weight) < 1.5)).toBe(true)
      expect(new Set(flat).size).toBeGreaterThan(1)
    }
  })

  it('uses the chosen activation in hidden layers and a sigmoid at the output', () => {
    expect(network.layers.map((layer) => layer.activation)).toEqual(['tanh', 'tanh', 'sigmoid'])
  })

  it('is the same for the same random source', () => {
    expect(makeNetwork('relu', [4], 9)).toEqual(makeNetwork('relu', [4], 9))
    expect(makeNetwork('relu', [4], 9)).not.toEqual(makeNetwork('relu', [4], 10))
  })
})

describe('forward propagation', () => {
  it('computes weighted sums and activations layer by layer', () => {
    const pass = forward(handMade, [1, 2])

    // hidden: [1*1 + 0*2 + 0.5, 0*1 - 1*2 + 0] = [1.5, -2]; relu -> [1.5, 0]
    expect(pass.weightedSums[0]).toEqual([1.5, -2])
    expect(pass.activations[1]).toEqual([1.5, 0])
    // output: 2*1.5 + 3*0 - 1 = 2; linear -> 2
    expect(pass.weightedSums[1]).toEqual([2])
    expect(pass.activations[2]).toEqual([2])
  })

  it('keeps the input as the first activations', () => {
    expect(forward(handMade, [1, 2]).activations[0]).toEqual([1, 2])
  })

  it('predict returns the output layer', () => {
    expect(predict(handMade, [1, 2])).toEqual([2])
  })

  it('uses the activation function the layer was created with', () => {
    const inputs = [0.4, -0.2]
    const relu = forward(makeNetwork('relu', [3]), inputs)
    const tanh = forward(makeNetwork('tanh', [3]), inputs)
    const [sums] = relu.weightedSums

    expect(relu.activations[1]).toEqual(sums.map(activations.relu.apply))
    expect(tanh.activations[1]).toEqual(tanh.weightedSums[0].map(Math.tanh))
  })

  it('gives an output in (0, 1) with the sigmoid output layer', () => {
    const [output] = predict(makeNetwork('linear'), [50, -50])
    expect(output).toBeGreaterThanOrEqual(0)
    expect(output).toBeLessThanOrEqual(1)
  })
})

describe('loss', () => {
  it('is the mean squared error of a prediction', () => {
    expect(sampleLoss([0.5], [1])).toBe(0.25)
    expect(sampleLoss([1], [1])).toBe(0)
    expect(sampleLoss([0, 1], [1, 3])).toBe((1 + 4) / 2)
  })

  it('averages over all samples', () => {
    // the hand-made network answers 2 for input [1, 2]; for [0, 0] it answers 2*0.5 - 1 = 0
    const data: Sample[] = [
      { inputs: [1, 2], targets: [1] }, // error 1 -> loss 1
      { inputs: [0, 0], targets: [0] }, // error 0 -> loss 0
    ]
    expect(datasetLoss(handMade, data)).toBe(0.5)
  })

  it('counts correct classifications by the 0.5 threshold', () => {
    const answers: Sample[] = [
      { inputs: [1, 2], targets: [1] }, // output 2 -> class 1, correct
      { inputs: [0, 0], targets: [1] }, // output 0 -> class 0, wrong
    ]
    expect(accuracy(handMade, answers)).toBe(0.5)
  })
})

describe('backpropagation', () => {
  it('matches the chain rule worked out by hand for a single sigmoid neuron', () => {
    const neuron: Network = {
      inputSize: 1,
      layers: [{ weights: [[0.5]], biases: [0], activation: 'sigmoid' }],
    }
    const gradients = backpropagate(neuron, [{ inputs: [2], targets: [1] }])

    const z = 0.5 * 2
    const a = 1 / (1 + Math.exp(-z))
    const delta = 2 * (a - 1) * a * (1 - a) // d(loss)/da * d(a)/dz
    expect(gradients.weights[0][0][0]).toBeCloseTo(delta * 2, 12) // dz/dw = input
    expect(gradients.biases[0][0]).toBeCloseTo(delta, 12) // dz/db = 1
    expect(delta).toBeLessThan(0) // output is below the target: raising the weight helps
  })

  it('has the same shape as the network', () => {
    const network = makeNetwork('tanh', [3, 2])
    const gradients = backpropagate(network, samples)

    expect(gradients.weights.map((w) => [w.length, w[0].length])).toEqual([
      [3, 2],
      [2, 3],
      [1, 2],
    ])
    expect(gradients.biases.map((b) => b.length)).toEqual([3, 2, 1])
  })

  // The strongest check there is: nudge each parameter a hair, see how the loss really moves,
  // and compare with what backpropagation claims.
  it.each<ActivationId>(['sigmoid', 'tanh', 'linear', 'relu'])(
    'agrees with finite differences of the loss (%s hidden layers)',
    (activation) => {
      const network = makeNetwork(activation)
      // Non-zero biases: with zero biases and a "dead" ReLU layer a weighted sum is exactly 0,
      // the one point where ReLU has a kink and finite differences mean nothing.
      network.layers.forEach((layer) => (layer.biases = layer.biases.map((_, j) => 0.1 + j / 10)))
      const gradients = backpropagate(network, samples)
      const h = 1e-6

      const lossWith = (l: number, edit: (layer: Network['layers'][number]) => void) => {
        const copy = structuredClone(network)
        edit(copy.layers[l])
        return datasetLoss(copy, samples)
      }
      const slope = (l: number, edit: (layer: Network['layers'][number], by: number) => void) =>
        (lossWith(l, (layer) => edit(layer, h)) - lossWith(l, (layer) => edit(layer, -h))) / (2 * h)

      network.layers.forEach((layer, l) => {
        layer.weights.forEach((row, j) =>
          row.forEach((_, i) => {
            const numeric = slope(l, (target, by) => (target.weights[j][i] += by))
            expect(gradients.weights[l][j][i]).toBeCloseTo(numeric, 6)
          }),
        )
        layer.biases.forEach((_, j) => {
          const numeric = slope(l, (target, by) => (target.biases[j] += by))
          expect(gradients.biases[l][j]).toBeCloseTo(numeric, 6)
        })
      })
    },
  )
})

describe('weight updates', () => {
  it('moves every parameter against its gradient, scaled by the learning rate', () => {
    const gradients = {
      weights: [
        [
          [1, -2],
          [0, 4],
        ],
        [[-1, 1]],
      ],
      biases: [[2, -2], [0.5]],
    }
    const updated = applyGradients(handMade, gradients, 0.1)

    expect(updated.layers[0].weights).toEqual([
      [1 - 0.1, 0 + 0.2],
      [0, -1 - 0.4],
    ])
    expect(updated.layers[0].biases).toEqual([0.5 - 0.2, 0 + 0.2])
    expect(updated.layers[1].weights).toEqual([[2 + 0.1, 3 - 0.1]])
    expect(updated.layers[1].biases).toEqual([-1 - 0.05])
  })

  it('does not change the old network', () => {
    const before = structuredClone(handMade)
    const gradients = backpropagate(handMade, samples)
    applyGradients(handMade, gradients, 0.5)
    trainEpoch(handMade, samples, 0.5)
    expect(handMade).toEqual(before)
  })

  it('leaves the network as it was when the learning rate is 0', () => {
    const network = makeNetwork('tanh')
    expect(trainEpoch(network, samples, 0)).toEqual(network)
  })

  it('lowers the loss for a small enough learning rate', () => {
    const network = makeNetwork('tanh')
    const trained = trainEpoch(network, samples, 0.1)
    expect(datasetLoss(trained, samples)).toBeLessThan(datasetLoss(network, samples))
  })
})

describe('learning XOR', () => {
  const { samples: xor } = createDataset('xor')

  function train(activation: ActivationId, epochs: number) {
    let network = makeNetwork(activation, [4], 1)
    const losses = [datasetLoss(network, xor)]
    for (let epoch = 0; epoch < epochs; epoch++) {
      network = trainEpoch(network, xor, 0.5)
      losses.push(datasetLoss(network, xor))
    }
    return { network, losses }
  }

  it('starts by guessing, then the loss falls and the network answers correctly', () => {
    const { network, losses } = train('tanh', 1000)

    expect(accuracy(makeNetwork('tanh', [4], 1), xor)).toBeLessThan(1) // untrained: wrong somewhere
    expect(losses[0]).toBeGreaterThan(0.2) // guessing 0.5 everywhere gives about 0.25
    expect(losses[losses.length - 1]).toBeLessThan(0.01)
    expect(losses[500]).toBeLessThan(losses[0]) // and it fell on the way, not only at the end

    expect(accuracy(network, xor)).toBe(1)
    for (const { inputs, targets } of xor) {
      expect(Math.round(predict(network, inputs)[0])).toBe(targets[0])
    }
  })

  it('cannot be learned with linear hidden layers: no straight line separates XOR', () => {
    const { network } = train('linear', 1000)
    expect(accuracy(network, xor)).toBeLessThan(1)
  })
})
