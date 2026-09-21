import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNeuralNetworkLab } from '@/hooks/useNeuralNetworkLab'
import { createNumberFormatter } from '@/lib/numbers'
import { DecisionBoundary } from './DecisionBoundary'
import { LossChart } from './LossChart'
import { Metrics } from './Metrics'
import { NetworkDiagram } from './NetworkDiagram'
import { Panel } from './Panel'
import { SettingsPanel } from './SettingsPanel'
import { TrainingControls } from './TrainingControls'

/** The whole lab: controls and metrics on top, settings on the left, the drawings on the right. */
export function NeuralNetworkLab() {
  const { t, i18n } = useTranslation()
  const lab = useNeuralNetworkLab()
  const { session, training } = lab

  const formatShort = useMemo(() => createNumberFormatter(i18n.language, 2), [i18n.language])
  const formatLoss = useMemo(() => createNumberFormatter(i18n.language, 4), [i18n.language])

  return (
    <div className="space-y-6">
      <Panel title={t('neuralNetwork.controls.label')} className="space-y-4">
        <TrainingControls
          status={lab.status}
          onStart={lab.start}
          onPause={lab.pause}
          onStep={lab.step}
          onReset={lab.reset}
        />
        <Metrics session={session} training={training} formatLoss={formatLoss} />
      </Panel>

      <div className="grid items-start gap-6 lg:grid-cols-[19rem_1fr]">
        <SettingsPanel
          model={lab.model}
          training={training}
          onModelChange={lab.configureModel}
          onTrainingChange={lab.configureTraining}
        />
        <div className="min-w-0 space-y-6">
          <NetworkDiagram network={session.network} probe={lab.probe} format={formatShort} />
          <div className="grid items-start gap-6 xl:grid-cols-2">
            <DecisionBoundary
              dataset={session.dataset}
              network={session.network}
              probe={lab.probe}
              onProbe={lab.setProbe}
              format={formatShort}
            />
            <LossChart
              history={session.history}
              maxEpochs={training.maxEpochs}
              format={formatLoss}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
