export type ActivationId = 'sigmoid' | 'relu' | 'tanh' | 'linear'

/** Shown in this order in the settings panel. */
export const activationIds: ActivationId[] = ['sigmoid', 'relu', 'tanh', 'linear']

export interface Activation {
  /** The neuron's output for the weighted sum `z`. */
  apply: (z: number) => number
  /** How fast the output changes when `z` changes (backpropagation needs it). */
  derivative: (z: number) => number
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z))

export const activations: Record<ActivationId, Activation> = {
  // Squashes any number into (0, 1). Derivative: s * (1 - s).
  sigmoid: {
    apply: sigmoid,
    derivative: (z) => sigmoid(z) * (1 - sigmoid(z)),
  },
  // "Rectified linear unit": passes positive numbers, blocks negative ones.
  relu: {
    apply: (z) => Math.max(0, z),
    derivative: (z) => (z > 0 ? 1 : 0),
  },
  // Like sigmoid, but the range is (-1, 1). Derivative: 1 - tanh².
  tanh: {
    apply: Math.tanh,
    derivative: (z) => 1 - Math.tanh(z) ** 2,
  },
  // No squashing at all: a network made only of these can only draw straight lines.
  linear: {
    apply: (z) => z,
    derivative: () => 1,
  },
}
