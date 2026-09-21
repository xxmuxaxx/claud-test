import { useCallback, useEffect, useReducer } from 'react'
import { createRandom } from '@/lib/neuralNetwork/random'
import {
  createSession,
  isFinished,
  runIteration,
  type ModelSettings,
  type TrainingSession,
  type TrainingSettings,
} from '@/lib/neuralNetwork/trainingSession'

/** How often the training loop runs: one iteration (a few epochs) per tick, about 30 times a second. */
const TICK_MS = 33

export type TrainingStatus = 'ready' | 'training' | 'paused' | 'finished'

interface LabState {
  model: ModelSettings
  training: TrainingSettings
  session: TrainingSession
  running: boolean
  /** A point on the plane whose activations the network diagram shows. */
  probe: number[]
}

// The reducer must stay pure (React may run it twice), so the seed for new weights arrives in the action.
type Action =
  | { type: 'start' }
  | { type: 'pause' }
  | { type: 'step' }
  | { type: 'tick' }
  | { type: 'reset'; seed: number }
  | { type: 'configureModel'; changes: Partial<ModelSettings>; seed: number }
  | { type: 'configureTraining'; changes: Partial<TrainingSettings> }
  | { type: 'probe'; point: number[] }

const initialModel: ModelSettings = { datasetId: 'xor', hiddenLayers: [4], activation: 'tanh' }
const initialTraining: TrainingSettings = { learningRate: 0.3, maxEpochs: 2000, epochsPerStep: 2 }

/** The first sample is a natural first thing to look at. */
const firstProbe = (session: TrainingSession) => session.dataset.samples[0].inputs

function createState(model: ModelSettings, training: TrainingSettings, seed: number): LabState {
  const session = createSession(model, createRandom(seed))
  return { model, training, session, running: false, probe: firstProbe(session) }
}

function reducer(state: LabState, action: Action): LabState {
  switch (action.type) {
    case 'start':
      return isFinished(state.session, state.training) ? state : { ...state, running: true }
    case 'pause':
      return { ...state, running: false }
    case 'step':
      return { ...state, session: runIteration(state.session, state.training), running: false }
    case 'tick': {
      const session = runIteration(state.session, state.training)
      return { ...state, session, running: state.running && !isFinished(session, state.training) }
    }
    case 'reset':
      return createState(state.model, state.training, action.seed)
    case 'configureModel':
      // A different architecture, activation or dataset is a different network: start over.
      return createState({ ...state.model, ...action.changes }, state.training, action.seed)
    case 'configureTraining': {
      const training = { ...state.training, ...action.changes }
      return {
        ...state,
        training,
        running: state.running && !isFinished(state.session, training),
      }
    }
    case 'probe':
      return { ...state, probe: action.point }
  }
}

const newSeed = () => Math.floor(Math.random() * 2 ** 32)

/** The state of the neural network lab plus its training loop: a `setInterval` that runs only while training. */
export function useNeuralNetworkLab() {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    createState(initialModel, initialTraining, newSeed()),
  )
  const { session, training, running } = state

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => dispatch({ type: 'tick' }), TICK_MS)
    return () => window.clearInterval(id)
  }, [running])

  const status: TrainingStatus = running
    ? 'training'
    : isFinished(session, training)
      ? 'finished'
      : session.epoch > 0
        ? 'paused'
        : 'ready'

  return {
    model: state.model,
    training,
    session,
    probe: state.probe,
    status,
    start: useCallback(() => dispatch({ type: 'start' }), []),
    pause: useCallback(() => dispatch({ type: 'pause' }), []),
    step: useCallback(() => dispatch({ type: 'step' }), []),
    reset: useCallback(() => dispatch({ type: 'reset', seed: newSeed() }), []),
    configureModel: useCallback(
      (changes: Partial<ModelSettings>) =>
        dispatch({ type: 'configureModel', changes, seed: newSeed() }),
      [],
    ),
    configureTraining: useCallback(
      (changes: Partial<TrainingSettings>) => dispatch({ type: 'configureTraining', changes }),
      [],
    ),
    setProbe: useCallback((point: number[]) => dispatch({ type: 'probe', point }), []),
  }
}
