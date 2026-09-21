import { useMemo, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { Dataset } from '@/lib/neuralNetwork/datasets'
import type { Network } from '@/lib/neuralNetwork/neuralNetwork'
import { fromFractions, sampleDecisionGrid, toPixels } from '@/lib/neuralNetwork/visualization'
import { NEGATIVE_COLOR, POSITIVE_COLOR } from './colors'
import { Panel } from './Panel'
import { TruthTable } from './TruthTable'

const SIZE = 320
/** The plane is asked about at this many cells per side: fine enough to look smooth, cheap to redraw. */
const RESOLUTION = 40
const CELL = SIZE / RESOLUTION

interface DecisionBoundaryProps {
  dataset: Dataset
  network: Network
  probe: number[]
  onProbe: (point: number[]) => void
  format: (value: number) => string
}

/**
 * What the network thinks of every point of the plane: blue where it answers "class 1", orange where
 * it answers "class 0", faint near the border between them. The training points are drawn on top.
 * Clicking picks the point whose neuron values the network diagram shows.
 */
export function DecisionBoundary({
  dataset,
  network,
  probe,
  onProbe,
  format,
}: DecisionBoundaryProps) {
  const { t } = useTranslation()
  const { bounds } = dataset
  const grid = useMemo(() => sampleDecisionGrid(network, bounds, RESOLUTION), [network, bounds])
  const pointRadius = dataset.kind === 'logic' ? 8 : 4.5

  const pickPoint = (event: MouseEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    if (box.width === 0 || box.height === 0) return
    const fx = (event.clientX - box.left) / box.width
    const fy = (event.clientY - box.top) / box.height
    onProbe(fromFractions(fx, fy, bounds))
  }

  const probeAt = toPixels(probe, bounds, SIZE)

  return (
    <Panel title={t('neuralNetwork.boundary.title')}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={t('neuralNetwork.boundary.label')}
        onClick={pickPoint}
        className="mx-auto block w-full max-w-sm cursor-crosshair rounded-lg border border-slate-200 dark:border-slate-700"
      >
        <g shapeRendering="crispEdges">
          {grid.map((row, r) =>
            row.map((value, c) => (
              <rect
                key={`${r}-${c}`}
                x={c * CELL}
                y={r * CELL}
                width={CELL}
                height={CELL}
                fill={value >= 0.5 ? POSITIVE_COLOR : NEGATIVE_COLOR}
                fillOpacity={Math.abs(value - 0.5) * 1.2}
              />
            )),
          )}
        </g>

        {dataset.samples.map((sample, index) => {
          const { x, y } = toPixels(sample.inputs, bounds, SIZE)
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r={pointRadius}
              fill={sample.targets[0] >= 0.5 ? POSITIVE_COLOR : NEGATIVE_COLOR}
              strokeWidth={1.5}
              className="stroke-white dark:stroke-slate-900"
            />
          )
        })}

        <circle
          cx={probeAt.x}
          cy={probeAt.y}
          r={pointRadius + 5}
          fill="none"
          strokeWidth={2}
          strokeDasharray="4 3"
          className="stroke-slate-900 dark:stroke-white"
        >
          <title>{t('neuralNetwork.boundary.probe')}</title>
        </circle>
      </svg>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-3 rounded-full"
            style={{ background: NEGATIVE_COLOR }}
          />
          {t('neuralNetwork.boundary.class0')}
        </span>
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-3 rounded-full"
            style={{ background: POSITIVE_COLOR }}
          />
          {t('neuralNetwork.boundary.class1')}
        </span>
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-3 rounded-full border-2 border-dashed border-slate-900 dark:border-white"
          />
          {t('neuralNetwork.boundary.probe')}
        </span>
      </div>
      <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
        {t('neuralNetwork.boundary.hint')}
      </p>
      {dataset.kind === 'logic' && (
        <TruthTable
          dataset={dataset}
          network={network}
          probe={probe}
          onProbe={onProbe}
          format={format}
        />
      )}
    </Panel>
  )
}
