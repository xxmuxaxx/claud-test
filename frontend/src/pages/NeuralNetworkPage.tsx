import { useTranslation } from 'react-i18next'
import { NeuralNetworkLab } from '@/components/neuralNetwork/NeuralNetworkLab'

export function NeuralNetworkPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t('neuralNetwork.title')}</h1>
        <p className="max-w-3xl text-slate-600 dark:text-slate-400">{t('neuralNetwork.intro')}</p>
      </header>
      <NeuralNetworkLab />
    </div>
  )
}
