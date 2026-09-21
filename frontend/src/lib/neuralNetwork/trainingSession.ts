import type { ActivationId } from './activations'
import { createDataset, type Dataset, type DatasetId } from './datasets'
import { accuracy, createNetwork, datasetLoss, trainEpoch, type Network } from './neuralNetwork'
import type { Random } from './random'

export const MAX_HIDDEN_LAYERS = 4
export const MAX_NEURONS_PER_LAYER = 8

/** Choices that change what the network is. Changing any of them creates a new network. */
export interface ModelSettings {
  datasetId: DatasetId
  /** Neurons in each hidden layer. */
  hiddenLayers: number[]
  /** The activation of the hidden layers. The output layer is always a sigmoid: an answer in (0, 1). */
  activation: ActivationId
}

/** Choices about the training itself. They can change while the network is training. */
export interface TrainingSettings {
  learningRate: number
  /** Training is over after this many epochs. */
  maxEpochs: number
  /** Epochs per iteration: what one tick of the training loop, or one press of "Step", does. */
  epochsPerStep: number
}

export interface LossPoint {
  epoch: number
  loss: number
}

/** A network together with the data it learns from and how far the learning has got. */
export interface TrainingSession {
  dataset: Dataset
  network: Network
  epoch: number
  loss: number
  /** Share of samples classified correctly, 0..1. */
  accuracy: number
  /** The loss after every iteration, for the chart. Starts with the untrained network at epoch 0. */
  history: LossPoint[]
}

/** A fresh, untrained network for the chosen settings. */
export function createSession(model: ModelSettings, random: Random): TrainingSession {
  const dataset = createDataset(model.datasetId)
  const network = createNetwork(
    {
      inputSize: 2,
      hiddenSizes: model.hiddenLayers,
      outputSize: 1,
      hiddenActivation: model.activation,
      outputActivation: 'sigmoid',
    },
    random,
  )
  const loss = datasetLoss(network, dataset.samples)
  return {
    dataset,
    network,
    epoch: 0,
    loss,
    accuracy: accuracy(network, dataset.samples),
    history: [{ epoch: 0, loss }],
  }
}

export function isFinished(session: TrainingSession, settings: TrainingSettings): boolean {
  return session.epoch >= settings.maxEpochs
}

/** One iteration: `epochsPerStep` epochs of training (fewer if `maxEpochs` comes first). */
export function runIteration(
  session: TrainingSession,
  settings: TrainingSettings,
): TrainingSession {
  const epochs = Math.min(settings.epochsPerStep, settings.maxEpochs - session.epoch)
  if (epochs <= 0) return session

  let network = session.network
  for (let i = 0; i < epochs; i++) {
    network = trainEpoch(network, session.dataset.samples, settings.learningRate)
  }

  const epoch = session.epoch + epochs
  const loss = datasetLoss(network, session.dataset.samples)
  return {
    ...session,
    network,
    epoch,
    loss,
    accuracy: accuracy(network, session.dataset.samples),
    history: [...session.history, { epoch, loss }],
  }
}

/** At most `limit` points of a long history, evenly picked and always ending with the last one. */
export function downsample<T>(points: T[], limit: number): T[] {
  if (points.length <= limit) return points
  const stride = (points.length - 1) / (limit - 1)
  return Array.from({ length: limit }, (_, i) => points[Math.round(i * stride)])
}
