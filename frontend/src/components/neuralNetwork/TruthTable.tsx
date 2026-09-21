import { useTranslation } from 'react-i18next'
import type { Dataset } from '@/lib/neuralNetwork/datasets'
import { predict, type Network } from '@/lib/neuralNetwork/neuralNetwork'
import { cn } from '@/lib/cn'

interface TruthTableProps {
  dataset: Dataset
  network: Network
  probe: number[]
  onProbe: (point: number[]) => void
  format: (value: number) => string
}

/** For the logic datasets: every row with what is expected and what the network answers right now. */
export function TruthTable({ dataset, network, probe, onProbe, format }: TruthTableProps) {
  const { t } = useTranslation()

  return (
    <table aria-label={t('neuralNetwork.table.label')} className="mt-4 w-full text-sm tabular-nums">
      <thead>
        <tr className="text-left text-xs text-slate-500 dark:text-slate-400">
          <th className="px-2 py-1 font-medium">x₁</th>
          <th className="px-2 py-1 font-medium">x₂</th>
          <th className="px-2 py-1 font-medium">{t('neuralNetwork.table.expected')}</th>
          <th className="px-2 py-1 font-medium">{t('neuralNetwork.table.answer')}</th>
          <th className="px-2 py-1 font-medium">{t('neuralNetwork.table.correct')}</th>
        </tr>
      </thead>
      <tbody>
        {dataset.samples.map((sample) => {
          const [answer] = predict(network, sample.inputs)
          const isCorrect = answer >= 0.5 === sample.targets[0] >= 0.5
          const selected = sample.inputs.every((value, i) => value === probe[i])
          return (
            <tr
              key={sample.inputs.join()}
              tabIndex={0}
              onClick={() => onProbe(sample.inputs)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onProbe(sample.inputs)
                }
              }}
              aria-current={selected || undefined}
              className={cn(
                'cursor-pointer border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60',
                selected &&
                  'bg-brand-50 hover:bg-brand-50 dark:bg-brand-900/30 dark:hover:bg-brand-900/30',
              )}
            >
              <td className="px-2 py-1.5">{sample.inputs[0]}</td>
              <td className="px-2 py-1.5">{sample.inputs[1]}</td>
              <td className="px-2 py-1.5">{sample.targets[0]}</td>
              <td className="px-2 py-1.5">{format(answer)}</td>
              <td
                className={cn(
                  'px-2 py-1.5 font-medium',
                  isCorrect
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400',
                )}
              >
                {isCorrect ? t('neuralNetwork.table.yes') : t('neuralNetwork.table.no')}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
