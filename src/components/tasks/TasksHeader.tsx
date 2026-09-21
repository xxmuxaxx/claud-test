import { Button } from '@/components/ui/Button'

interface TasksHeaderProps {
  completed: number
  active: number
  onAdd: () => void
}

export function TasksHeader({ completed, active, onAdd }: TasksHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Список дел</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Выполнено: {completed} · Осталось: {active}
        </p>
      </div>
      <Button onClick={onAdd} className="shrink-0">
        Добавить дело
      </Button>
    </div>
  )
}
