import { useTranslation } from 'react-i18next'
import type { TrainingSession, TrainingSettings } from '@/lib/neuralNetwork/trainingSession'

interface MetricsProps {
  session: TrainingSession
  training: TrainingSettings
  formatLoss: (value: number) => string
}

/** The numbers to watch: epoch, loss, learning rate and how many samples are classified correctly. */
export function Metrics({ session, training, formatLoss }: MetricsProps) {
  const { t, i18n } = useTranslation()
  const percent = new Intl.NumberFormat(i18n.language, { style: 'percent' })

  const items = [
    [t('neuralNetwork.metrics.epoch'), `${session.epoch} / ${training.maxEpochs}`],
    [t('neuralNetwork.metrics.loss'), formatLoss(session.loss)],
    [t('neuralNetwork.metrics.learningRate'), training.learningRate.toLocaleString(i18n.language)],
    [t('neuralNetwork.metrics.accuracy'), percent.format(session.accuracy)],
  ]

  return (
    <dl
      role="group"
      aria-label={t('neuralNetwork.metrics.label')}
      className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4"
    >
      {items.map(([name, value]) => (
        <div key={name}>
          <dt className="text-xs text-slate-500 dark:text-slate-400">{name}</dt>
          <dd className="text-xl font-semibold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
