import { useTranslation } from 'react-i18next'
import { downsample, type LossPoint } from '@/lib/neuralNetwork/trainingSession'
import { Panel } from './Panel'

const WIDTH = 400
const HEIGHT = 220
const PLOT = { left: 48, right: 12, top: 24, bottom: 34 }
/** A long training has thousands of points; the eye cannot tell 400 from 4000. */
const MAX_POINTS = 400

interface LossChartProps {
  history: LossPoint[]
  /** The horizontal axis runs to here, so the curve visibly fills the chart as training goes on. */
  maxEpochs: number
  format: (value: number) => string
}

/** The loss after every iteration: it should fall. */
export function LossChart({ history, maxEpochs, format }: LossChartProps) {
  const { t } = useTranslation()

  const lastEpoch = history[history.length - 1].epoch
  const epochSpan = Math.max(maxEpochs, lastEpoch, 1)
  const highestLoss = Math.max(...history.map((point) => point.loss), 1e-9)

  const plotWidth = WIDTH - PLOT.left - PLOT.right
  const plotHeight = HEIGHT - PLOT.top - PLOT.bottom
  const x = (epoch: number) => PLOT.left + (epoch / epochSpan) * plotWidth
  const y = (loss: number) => PLOT.top + (1 - loss / highestLoss) * plotHeight

  const line = downsample(history, MAX_POINTS)
    .map((point) => `${x(point.epoch).toFixed(1)},${y(point.loss).toFixed(1)}`)
    .join(' ')

  return (
    <Panel title={t('neuralNetwork.chart.title')}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={t('neuralNetwork.chart.label')}
        className="w-full text-slate-600 dark:text-slate-400"
      >
        {/* Axes */}
        <path
          d={`M ${PLOT.left} ${PLOT.top} V ${PLOT.top + plotHeight} H ${PLOT.left + plotWidth}`}
          className="fill-none stroke-slate-300 dark:stroke-slate-600"
          strokeWidth={1.5}
        />
        {/* A guide line at the top, so the scale of the curve is easy to read. */}
        <line
          x1={PLOT.left}
          x2={PLOT.left + plotWidth}
          y1={PLOT.top}
          y2={PLOT.top}
          className="stroke-slate-200 dark:stroke-slate-800"
          strokeDasharray="3 4"
        />

        <polyline
          points={line}
          className="fill-none stroke-brand-600 dark:stroke-brand-400"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Labels */}
        <g className="fill-current text-[11px]">
          <text x={PLOT.left - 6} y={PLOT.top} textAnchor="end" dominantBaseline="central">
            {format(highestLoss)}
          </text>
          <text
            x={PLOT.left - 6}
            y={PLOT.top + plotHeight}
            textAnchor="end"
            dominantBaseline="central"
          >
            {format(0)}
          </text>
          <text x={PLOT.left} y={HEIGHT - 16} textAnchor="middle">
            0
          </text>
          <text x={PLOT.left + plotWidth} y={HEIGHT - 16} textAnchor="end">
            {epochSpan}
          </text>
          <text
            x={PLOT.left + plotWidth / 2}
            y={HEIGHT - 3}
            textAnchor="middle"
            className="font-medium"
          >
            {t('neuralNetwork.chart.epoch')}
          </text>
          <text x={PLOT.left} y={8} className="font-medium">
            {t('neuralNetwork.chart.loss')}
          </text>
        </g>
      </svg>
    </Panel>
  )
}
