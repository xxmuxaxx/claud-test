import { Counter } from '@/components/Counter'

export function HomePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Добро пожаловать</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Стартовый проект: React 19 + Vite + TypeScript + Tailwind CSS v4 + React Router +
          Zustand. Отредактируйте{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm dark:bg-slate-800">
            src/pages/HomePage.tsx
          </code>{' '}
          и сохраните, чтобы увидеть горячую перезагрузку.
        </p>
      </div>
      <Counter />
    </div>
  )
}
