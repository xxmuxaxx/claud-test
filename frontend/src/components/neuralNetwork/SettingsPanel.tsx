import { useId, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Stepper } from '@/components/ui/Stepper'
import { fieldClass } from '@/components/ui/fieldClass'
import { activationIds, type ActivationId } from '@/lib/neuralNetwork/activations'
import { datasetIds, type DatasetId } from '@/lib/neuralNetwork/datasets'
import {
  MAX_HIDDEN_LAYERS,
  MAX_NEURONS_PER_LAYER,
  type ModelSettings,
  type TrainingSettings,
} from '@/lib/neuralNetwork/trainingSession'
import { Panel } from './Panel'

const learningRates = [0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 0.5, 1, 2, 5]
const epochOptions = [100, 500, 1000, 2000, 5000, 10000]
const stepSizes = [1, 2, 5, 10, 25, 50, 100]

/** A labelled `<select>` of numbers or ids. */
function SelectField<T extends string | number>({
  label,
  value,
  options,
  onChange,
  note,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  note?: ReactNode
}) {
  const noteId = useId()
  return (
    <div>
      <label className="block space-y-1">
        <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
        <select
          className={fieldClass}
          value={value}
          aria-describedby={note ? noteId : undefined}
          onChange={(event) => {
            const chosen = options.find((option) => String(option.value) === event.target.value)
            if (chosen) onChange(chosen.value)
          }}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {note && (
        <p id={noteId} className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {note}
        </p>
      )}
    </div>
  )
}

interface SettingsPanelProps {
  model: ModelSettings
  training: TrainingSettings
  onModelChange: (changes: Partial<ModelSettings>) => void
  onTrainingChange: (changes: Partial<TrainingSettings>) => void
}

/**
 * Left: what the network is (changing any of it builds a new network). Below: how it is trained
 * (safe to change while it trains, so the effect of e.g. the learning rate can be watched).
 */
export function SettingsPanel({
  model,
  training,
  onModelChange,
  onTrainingChange,
}: SettingsPanelProps) {
  const { t, i18n } = useTranslation()
  const formatNumber = (value: number) => value.toLocaleString(i18n.language)

  const setLayerCount = (count: number) => {
    const last = model.hiddenLayers[model.hiddenLayers.length - 1] ?? 4
    onModelChange({
      hiddenLayers:
        count < model.hiddenLayers.length
          ? model.hiddenLayers.slice(0, count)
          : [...model.hiddenLayers, ...Array<number>(count - model.hiddenLayers.length).fill(last)],
    })
  }
  const setNeurons = (layer: number, count: number) =>
    onModelChange({ hiddenLayers: model.hiddenLayers.map((n, i) => (i === layer ? count : n)) })

  return (
    <Panel title={t('neuralNetwork.settings.title')} className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">{t('neuralNetwork.settings.model')}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('neuralNetwork.settings.modelNote')}
          </p>
        </div>

        <SelectField<DatasetId>
          label={t('neuralNetwork.settings.dataset')}
          value={model.datasetId}
          options={datasetIds.map((id) => ({
            value: id,
            label: t(`neuralNetwork.datasets.${id}`),
          }))}
          onChange={(datasetId) => onModelChange({ datasetId })}
        />

        <Stepper
          label={t('neuralNetwork.settings.hiddenLayers')}
          value={model.hiddenLayers.length}
          min={1}
          max={MAX_HIDDEN_LAYERS}
          onChange={setLayerCount}
        />
        {model.hiddenLayers.map((neurons, layer) => (
          <Stepper
            key={layer}
            label={t('neuralNetwork.settings.neurons', { layer: layer + 1 })}
            value={neurons}
            min={1}
            max={MAX_NEURONS_PER_LAYER}
            onChange={(count) => setNeurons(layer, count)}
          />
        ))}

        <SelectField<ActivationId>
          label={t('neuralNetwork.settings.activation')}
          value={model.activation}
          options={activationIds.map((id) => ({
            value: id,
            label: t(`neuralNetwork.activations.${id}`),
          }))}
          onChange={(activation) => onModelChange({ activation })}
          note={t('neuralNetwork.settings.activationNote')}
        />
      </div>

      <div className="space-y-4 border-t border-slate-200 pt-5 dark:border-slate-800">
        <div>
          <h3 className="font-semibold">{t('neuralNetwork.settings.training')}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('neuralNetwork.settings.trainingNote')}
          </p>
        </div>

        <SelectField<number>
          label={t('neuralNetwork.settings.learningRate')}
          value={training.learningRate}
          options={learningRates.map((rate) => ({ value: rate, label: formatNumber(rate) }))}
          onChange={(learningRate) => onTrainingChange({ learningRate })}
        />
        <SelectField<number>
          label={t('neuralNetwork.settings.epochs')}
          value={training.maxEpochs}
          options={epochOptions.map((epochs) => ({ value: epochs, label: formatNumber(epochs) }))}
          onChange={(maxEpochs) => onTrainingChange({ maxEpochs })}
        />
        <SelectField<number>
          label={t('neuralNetwork.settings.epochsPerStep')}
          value={training.epochsPerStep}
          options={stepSizes.map((size) => ({ value: size, label: formatNumber(size) }))}
          onChange={(epochsPerStep) => onTrainingChange({ epochsPerStep })}
          note={t('neuralNetwork.settings.epochsPerStepNote')}
        />
      </div>
    </Panel>
  )
}
