/**
 * A small fully connected neural network (MLP), written for reading.
 *
 * One training epoch is four steps, and each is a function below:
 *
 *   1. Forward pass      `forward`          inputs -> layer after layer -> prediction
 *   2. Loss              `datasetLoss`      how far the predictions are from the targets
 *   3. Backpropagation   `backpropagate`    how much each weight and bias is to blame for the loss
 *   4. Gradient descent  `applyGradients`   nudge every weight a little against its blame
 *
 * `trainEpoch` runs 3 and 4 (backpropagation runs the forward pass itself). Networks are immutable:
 * every update returns a new network, which is what React state wants.
 */
import { activations, type ActivationId } from './activations'
import type { Random } from './random'

/** One training example: what goes in and what the network should answer. */
export interface Sample {
  inputs: number[]
  targets: number[]
}

/** One fully connected layer. `weights[j][i]` joins neuron `i` of the previous layer to neuron `j` here. */
export interface Layer {
  weights: number[][]
  biases: number[]
  activation: ActivationId
}

/** The input layer has no parameters, so `layers` holds only the hidden layers and the output layer. */
export interface Network {
  inputSize: number
  layers: Layer[]
}

export interface NetworkShape {
  inputSize: number
  /** Neurons in each hidden layer, e.g. `[4, 4]` is two hidden layers of four. */
  hiddenSizes: number[]
  outputSize: number
  hiddenActivation: ActivationId
  outputActivation: ActivationId
}

/** Everything a forward pass computes: the backpropagation reuses it, and the UI draws it. */
export interface ForwardPass {
  /** `activations[0]` is the input, `activations[l + 1]` is the output of `layers[l]`. */
  activations: number[][]
  /** Weighted sums (before the activation function) of each layer; `weightedSums[l]` is for `layers[l]`. */
  weightedSums: number[][]
}

/** How the loss changes with every parameter. Same shape as the layers of the network. */
export interface Gradients {
  weights: number[][][]
  biases: number[][]
}

// ---------------------------------------------------------------------------------------------
// Creating a network
// ---------------------------------------------------------------------------------------------

/** Small random starting weights, zero biases. Random weights are what makes neurons differ. */
export function createNetwork(shape: NetworkShape, random: Random): Network {
  const sizes = [shape.inputSize, ...shape.hiddenSizes, shape.outputSize]
  const layers = sizes.slice(1).map((size, index): Layer => {
    const isOutput = index === sizes.length - 2
    const activation = isOutput ? shape.outputActivation : shape.hiddenActivation
    const limit = initialWeightLimit(sizes[index], size, activation)
    return {
      weights: Array.from({ length: size }, () =>
        Array.from({ length: sizes[index] }, () => (random() * 2 - 1) * limit),
      ),
      biases: new Array<number>(size).fill(0),
      activation,
    }
  })
  return { inputSize: shape.inputSize, layers }
}

/** Glorot ("Xavier") initialisation: the more connections, the smaller each weight. ReLU gets a bit more. */
function initialWeightLimit(fanIn: number, fanOut: number, activation: ActivationId): number {
  const limit = Math.sqrt(6 / (fanIn + fanOut))
  return activation === 'relu' ? limit * Math.SQRT2 : limit
}

// ---------------------------------------------------------------------------------------------
// 1. Forward pass
// ---------------------------------------------------------------------------------------------

const dot = (a: number[], b: number[]) => a.reduce((sum, value, i) => sum + value * b[i], 0)

/** Sends `inputs` through the network, remembering every intermediate value. */
export function forward(network: Network, inputs: number[]): ForwardPass {
  const layerActivations = [inputs]
  const weightedSums: number[][] = []

  for (const layer of network.layers) {
    const previous = layerActivations[layerActivations.length - 1]
    // Each neuron: the sum of (weight x incoming value), plus its bias...
    const sums = layer.weights.map((weights, j) => dot(weights, previous) + layer.biases[j])
    // ...then squeezed through the activation function.
    weightedSums.push(sums)
    layerActivations.push(sums.map(activations[layer.activation].apply))
  }
  return { activations: layerActivations, weightedSums }
}

/** The network's answer for `inputs`. */
export function predict(network: Network, inputs: number[]): number[] {
  const { activations: all } = forward(network, inputs)
  return all[all.length - 1]
}

// ---------------------------------------------------------------------------------------------
// 2. Loss
// ---------------------------------------------------------------------------------------------

/** Mean squared error of one prediction: the average of (prediction - target)^2. 0 is a perfect answer. */
export function sampleLoss(predictions: number[], targets: number[]): number {
  const squaredErrors = predictions.map((prediction, i) => (prediction - targets[i]) ** 2)
  return squaredErrors.reduce((sum, error) => sum + error, 0) / predictions.length
}

/** The loss of the whole network: the mean loss over all samples. This is the number to push down. */
export function datasetLoss(network: Network, samples: Sample[]): number {
  const losses = samples.map((sample) =>
    sampleLoss(predict(network, sample.inputs), sample.targets),
  )
  return losses.reduce((sum, loss) => sum + loss, 0) / samples.length
}

/** Share of samples the network classifies correctly (an output of 0.5 or more means "class 1"). */
export function accuracy(network: Network, samples: Sample[]): number {
  const correct = samples.filter((sample) => {
    const [output] = predict(network, sample.inputs)
    return output >= 0.5 === sample.targets[0] >= 0.5
  })
  return correct.length / samples.length
}

// ---------------------------------------------------------------------------------------------
// 3. Backpropagation
// ---------------------------------------------------------------------------------------------

/**
 * The gradients of the loss for one sample, by the chain rule, working from the output backwards.
 *
 * A neuron's "delta" is how much the loss changes when its weighted sum changes. Once the deltas are
 * known, a weight's gradient is `delta x the value that weight multiplied`, and a bias's is `delta`.
 */
function sampleGradients(network: Network, sample: Sample): Gradients {
  const pass = forward(network, sample.inputs)
  const lastLayer = network.layers.length - 1
  const deltas: number[][] = new Array(network.layers.length)

  // The output layer: d(loss)/d(output) times d(output)/d(weighted sum).
  const outputs = pass.activations[lastLayer + 1]
  const outputSlope = activations[network.layers[lastLayer].activation].derivative
  deltas[lastLayer] = outputs.map((output, j) => {
    const lossSlope = (2 * (output - sample.targets[j])) / outputs.length // derivative of sampleLoss
    return lossSlope * outputSlope(pass.weightedSums[lastLayer][j])
  })

  // Hidden layers, back to front: every neuron collects the blame of the neurons it feeds,
  // weighted by the connections between them.
  for (let l = lastLayer - 1; l >= 0; l--) {
    const next = network.layers[l + 1]
    const slope = activations[network.layers[l].activation].derivative
    deltas[l] = pass.weightedSums[l].map((sum, i) => {
      const blame = next.weights.reduce(
        (total, weights, j) => total + weights[i] * deltas[l + 1][j],
        0,
      )
      return blame * slope(sum)
    })
  }

  return {
    // pass.activations[l] is what layer `l` received, i.e. what each of its weights multiplied.
    weights: deltas.map((layerDeltas, l) =>
      layerDeltas.map((delta) => pass.activations[l].map((input) => delta * input)),
    ),
    biases: deltas,
  }
}

/** The gradients of `datasetLoss`: the per-sample gradients averaged. */
export function backpropagate(network: Network, samples: Sample[]): Gradients {
  const perSample = samples.map((sample) => sampleGradients(network, sample))
  const average = (pick: (gradients: Gradients) => number) =>
    perSample.reduce((sum, gradients) => sum + pick(gradients), 0) / samples.length

  return {
    weights: network.layers.map((layer, l) =>
      layer.weights.map((row, j) => row.map((_, i) => average((g) => g.weights[l][j][i]))),
    ),
    biases: network.layers.map((layer, l) =>
      layer.biases.map((_, j) => average((g) => g.biases[l][j])),
    ),
  }
}

// ---------------------------------------------------------------------------------------------
// 4. Gradient descent
// ---------------------------------------------------------------------------------------------

/**
 * Moves every parameter a step against its gradient: `new = old - learningRate x gradient`.
 * A gradient says where the loss grows, so going the other way makes it smaller.
 */
export function applyGradients(
  network: Network,
  gradients: Gradients,
  learningRate: number,
): Network {
  return {
    ...network,
    layers: network.layers.map((layer, l) => ({
      ...layer,
      weights: layer.weights.map((row, j) =>
        row.map((weight, i) => weight - learningRate * gradients.weights[l][j][i]),
      ),
      biases: layer.biases.map((bias, j) => bias - learningRate * gradients.biases[l][j]),
    })),
  }
}

/** One epoch: one pass over all samples, one weight update. */
export function trainEpoch(network: Network, samples: Sample[], learningRate: number): Network {
  return applyGradients(network, backpropagate(network, samples), learningRate)
}
