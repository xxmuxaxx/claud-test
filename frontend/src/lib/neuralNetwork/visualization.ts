/** Geometry for the drawings: where neurons go, how a plane maps to pixels, what a network says where. */
import type { Bounds } from './datasets'
import { predict, type Network } from './neuralNetwork'

export interface Point {
  x: number
  y: number
}

// ---------------------------------------------------------------------------------------------
// Network diagram
// ---------------------------------------------------------------------------------------------

export const DIAGRAM_WIDTH = 760
export const DIAGRAM_HEADER_HEIGHT = 44
const SIDE_MARGIN = 80
const NEURON_SPACING = 62
const VERTICAL_PADDING = 24

/** Total height of the diagram: room for the header and for the tallest layer. */
export function diagramHeight(layerSizes: number[]): number {
  return DIAGRAM_HEADER_HEIGHT + Math.max(...layerSizes) * NEURON_SPACING + VERTICAL_PADDING
}

/**
 * Centres of all neurons: `positions[layer][neuron]`. Layers are evenly spread from left to right
 * (data flows this way), and each layer is centred vertically.
 */
export function layoutNeurons(layerSizes: number[]): Point[][] {
  const height = diagramHeight(layerSizes)
  const centerY = DIAGRAM_HEADER_HEIGHT + (height - DIAGRAM_HEADER_HEIGHT) / 2
  const columnGap = (DIAGRAM_WIDTH - 2 * SIDE_MARGIN) / (layerSizes.length - 1)

  return layerSizes.map((size, layer) =>
    Array.from({ length: size }, (_, neuron) => ({
      x: SIDE_MARGIN + layer * columnGap,
      y: centerY + (neuron - (size - 1) / 2) * NEURON_SPACING,
    })),
  )
}

/** The neuron counts of every layer of a network, input layer first. */
export function layerSizes(network: Network): number[] {
  return [network.inputSize, ...network.layers.map((layer) => layer.weights.length)]
}

// ---------------------------------------------------------------------------------------------
// Decision boundary
// ---------------------------------------------------------------------------------------------

/**
 * What the network answers on a `resolution` x `resolution` grid covering `bounds` in both
 * directions: `values[row][column]`, row 0 at the top (the largest x2), column 0 at the left.
 * Each cell is asked at its centre.
 */
export function sampleDecisionGrid(
  network: Network,
  bounds: Bounds,
  resolution: number,
): number[][] {
  const at = (index: number) =>
    bounds.min + ((index + 0.5) / resolution) * (bounds.max - bounds.min)
  return Array.from({ length: resolution }, (_, row) =>
    Array.from({ length: resolution }, (_, column) => {
      const x1 = at(column)
      const x2 = at(resolution - 1 - row)
      return predict(network, [x1, x2])[0]
    }),
  )
}

/** Where a point of the plane is drawn in a square of `size` pixels (x2 grows upwards). */
export function toPixels(point: number[], bounds: Bounds, size: number): Point {
  const span = bounds.max - bounds.min
  return {
    x: ((point[0] - bounds.min) / span) * size,
    y: (1 - (point[1] - bounds.min) / span) * size,
  }
}

/** The opposite of `toPixels`, for clicks: `fx` and `fy` are 0..1 across the square, from its top left. */
export function fromFractions(fx: number, fy: number, bounds: Bounds): number[] {
  const span = bounds.max - bounds.min
  return [bounds.min + fx * span, bounds.min + (1 - fy) * span]
}
