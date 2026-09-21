import { useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { forward, type Network } from '@/lib/neuralNetwork/neuralNetwork'
import {
  DIAGRAM_WIDTH,
  diagramHeight,
  layerSizes,
  layoutNeurons,
} from '@/lib/neuralNetwork/visualization'
import { NEGATIVE_COLOR, POSITIVE_COLOR, signColor, strength } from './colors'
import { Panel } from './Panel'

const NEURON_RADIUS = 20
/** Where along a connection its weight is written: staggered, so neighbouring labels rarely collide. */
const LABEL_POSITIONS = [0.3, 0.5, 0.7]

interface NetworkDiagramProps {
  network: Network
  /** The input the neurons show their values for. */
  probe: number[]
  format: (value: number) => string
}

/** Neurons, connections and their weights, drawn from the input on the left to the output on the right. */
export function NetworkDiagram({ network, probe, format }: NetworkDiagramProps) {
  const { t } = useTranslation()
  const [showWeights, setShowWeights] = useState(true)
  const checkboxId = useId()

  const pass = useMemo(() => forward(network, probe), [network, probe])
  const sizes = layerSizes(network)
  const positions = layoutNeurons(sizes)
  const lastLayer = sizes.length - 1

  const layerName = (layer: number) => {
    if (layer === 0) return t('neuralNetwork.diagram.input')
    if (layer === lastLayer) return t('neuralNetwork.diagram.output')
    return t('neuralNetwork.diagram.hidden', { n: layer })
  }
  const layerLongName = (layer: number) => {
    if (layer === 0) return t('neuralNetwork.diagram.inputLayer')
    if (layer === lastLayer) return t('neuralNetwork.diagram.outputLayer')
    return t('neuralNetwork.diagram.hiddenLayer', { n: layer })
  }

  return (
    <Panel
      title={t('neuralNetwork.diagram.title')}
      action={
        <label htmlFor={checkboxId} className="flex items-center gap-2 text-sm">
          <input
            id={checkboxId}
            type="checkbox"
            checked={showWeights}
            onChange={(event) => setShowWeights(event.target.checked)}
            className="size-4 accent-brand-600"
          />
          {t('neuralNetwork.diagram.showWeights')}
        </label>
      }
    >
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${DIAGRAM_WIDTH} ${diagramHeight(sizes)}`}
          role="group"
          aria-label={t('neuralNetwork.diagram.label')}
          className="mx-auto min-w-[36rem] text-slate-700 dark:text-slate-300"
        >
          {/* Layer names, with an arrow between them: the data flows this way. */}
          {positions.map((column, layer) => {
            const x = column[0].x
            const next = positions[layer + 1]?.[0].x
            return (
              <g key={layer}>
                <text
                  x={x}
                  y={20}
                  textAnchor="middle"
                  className="fill-current text-[12px] font-semibold"
                >
                  {layerName(layer)}
                </text>
                {next !== undefined && (
                  <path
                    d={`M ${x + 44} 16 H ${next - 44} m -6 -4 l 6 4 l -6 4`}
                    className="fill-none stroke-slate-400 dark:stroke-slate-500"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </g>
            )
          })}

          {/* Connections first, so the neurons sit on top of their ends. */}
          {network.layers.map((layer, l) =>
            layer.weights.map((incoming, j) =>
              incoming.map((weight, i) => {
                const from = positions[l][i]
                const to = positions[l + 1][j]
                const at = LABEL_POSITIONS[(i + j) % LABEL_POSITIONS.length]
                return (
                  <g key={`${l}-${j}-${i}`}>
                    <line
                      x1={from.x + NEURON_RADIUS}
                      y1={from.y}
                      x2={to.x - NEURON_RADIUS}
                      y2={to.y}
                      stroke={signColor(weight)}
                      strokeWidth={0.6 + strength(weight, 2.5) * 3.5}
                      strokeOpacity={0.12 + 0.88 * strength(weight, 2)}
                      strokeLinecap="round"
                    >
                      <title>{t('neuralNetwork.diagram.weight', { weight: format(weight) })}</title>
                    </line>
                    {showWeights && (
                      <text
                        x={from.x + (to.x - from.x) * at}
                        y={from.y + (to.y - from.y) * at}
                        textAnchor="middle"
                        dominantBaseline="central"
                        paintOrder="stroke"
                        strokeWidth={3}
                        strokeLinejoin="round"
                        className="fill-slate-600 stroke-white text-[10px] dark:fill-slate-300 dark:stroke-slate-900"
                      >
                        {format(weight)}
                      </text>
                    )}
                  </g>
                )
              }),
            ),
          )}

          {positions.map((column, layer) =>
            column.map((point, n) => {
              const value = pass.activations[layer][n]
              const bias = layer === 0 ? undefined : network.layers[layer - 1].biases[n]
              const label =
                bias === undefined
                  ? t('neuralNetwork.diagram.neuron', {
                      layer: layerLongName(layer),
                      n: n + 1,
                      value: format(value),
                    })
                  : t('neuralNetwork.diagram.neuronWithBias', {
                      layer: layerLongName(layer),
                      n: n + 1,
                      value: format(value),
                      bias: format(bias),
                    })
              return (
                <g key={`${layer}-${n}`} role="img" aria-label={label}>
                  <title>{label}</title>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={NEURON_RADIUS}
                    className="fill-white stroke-slate-300 dark:fill-slate-900 dark:stroke-slate-600"
                    strokeWidth={1.5}
                  />
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={NEURON_RADIUS}
                    fill={signColor(value)}
                    fillOpacity={0.15 + 0.85 * strength(value)}
                  />
                  <text
                    x={point.x}
                    y={point.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-slate-900 text-[11px] font-semibold dark:fill-white"
                  >
                    {format(value)}
                  </text>
                  {layer === 0 && (
                    <text
                      x={point.x - NEURON_RADIUS - 8}
                      y={point.y}
                      textAnchor="end"
                      dominantBaseline="central"
                      className="fill-current text-[13px] italic"
                    >
                      x{n === 0 ? '₁' : '₂'}
                    </text>
                  )}
                  {layer === lastLayer && (
                    <text
                      x={point.x + NEURON_RADIUS + 8}
                      y={point.y}
                      dominantBaseline="central"
                      className="fill-current text-[13px] italic"
                    >
                      ŷ
                    </text>
                  )}
                </g>
              )
            }),
          )}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-3 rounded-full"
            style={{ background: POSITIVE_COLOR }}
          />
          {t('neuralNetwork.diagram.positive')}
        </span>
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-3 rounded-full"
            style={{ background: NEGATIVE_COLOR }}
          />
          {t('neuralNetwork.diagram.negative')}
        </span>
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        {t('neuralNetwork.diagram.probe', { x1: format(probe[0]), x2: format(probe[1]) })}
      </p>
    </Panel>
  )
}
