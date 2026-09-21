import { Pause, Play, RotateCcw, StepForward } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import type { TrainingStatus } from '@/hooks/useNeuralNetworkLab'
import { cn } from '@/lib/cn'

const statusDot: Record<TrainingStatus, string> = {
  ready: 'bg-slate-400',
  training: 'animate-pulse bg-emerald-500 motion-reduce:animate-none',
  paused: 'bg-amber-500',
  finished: 'bg-brand-500',
}

interface TrainingControlsProps {
  status: TrainingStatus
  onStart: () => void
  onPause: () => void
  onStep: () => void
  onReset: () => void
}

/** What the network is doing now, and the buttons that change it. */
export function TrainingControls({
  status,
  onStart,
  onPause,
  onStep,
  onReset,
}: TrainingControlsProps) {
  const { t } = useTranslation()
  const training = status === 'training'
  const finished = status === 'finished'

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <p role="status" className="flex items-center gap-2 text-sm font-medium">
        <span aria-hidden className={cn('size-2.5 rounded-full', statusDot[status])} />
        {t(`neuralNetwork.status.${status}`)}
      </p>

      <div
        role="group"
        aria-label={t('neuralNetwork.controls.label')}
        className="flex flex-wrap gap-2"
      >
        <Button onClick={onStart} disabled={training || finished}>
          <Play aria-hidden className="size-4" />
          {t('neuralNetwork.controls.start')}
        </Button>
        <Button variant="secondary" onClick={onPause} disabled={!training}>
          <Pause aria-hidden className="size-4" />
          {t('neuralNetwork.controls.pause')}
        </Button>
        <Button variant="secondary" onClick={onStep} disabled={training || finished}>
          <StepForward aria-hidden className="size-4" />
          {t('neuralNetwork.controls.step')}
        </Button>
        <Button variant="secondary" onClick={onReset}>
          <RotateCcw aria-hidden className="size-4" />
          {t('neuralNetwork.controls.reset')}
        </Button>
      </div>
    </div>
  )
}
