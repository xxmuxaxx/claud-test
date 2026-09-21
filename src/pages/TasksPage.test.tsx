import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TasksPage } from './TasksPage'
import { TASKS_STORAGE_KEY } from '@/services/localStorageTaskRepository'
import { useTasksStore } from '@/store/useTasksStore'
import type { Task } from '@/types/task'

function seed(tasks: Task[]) {
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks))
}

async function renderPage(tasks: Task[] = []) {
  seed(tasks)
  const user = userEvent.setup()
  render(<TasksPage />)
  await screen.findByRole('heading', { name: 'Список дел' })
  // Wait for the async load from storage to finish.
  await screen.findByText(tasks.length === 0 ? 'Пока нет дел' : /Выполнено:/)
  return user
}

const titles = () =>
  screen.queryAllByRole('checkbox').map((checkbox) => checkbox.getAttribute('aria-label'))

const sample: Task[] = [
  { id: '1', title: 'Купить молоко', completed: false, priority: 'low', dueDate: '2030-01-10' },
  { id: '2', title: 'Написать отчёт', completed: true, priority: 'high' },
  { id: '3', title: 'Позвонить маме', completed: false, priority: 'high', dueDate: '2030-01-05' },
]

describe('TasksPage', () => {
  beforeEach(() => {
    localStorage.clear()
    useTasksStore.setState({ tasks: [], status: 'idle' })
  })

  describe('empty state', () => {
    it('invites to create the first task', async () => {
      const user = await renderPage()

      expect(screen.getByText('Создайте первое дело, чтобы начать.')).toBeInTheDocument()
      expect(screen.queryByPlaceholderText('Поиск дел...')).not.toBeInTheDocument()

      const emptyState = screen.getByText('Пока нет дел').parentElement!.parentElement!
      await user.click(within(emptyState).getByRole('button', { name: 'Добавить дело' }))
      expect(screen.getByRole('dialog', { name: 'Новое дело' })).toBeInTheDocument()
    })
  })

  describe('creating', () => {
    it('adds a task from the form to the list and to storage', async () => {
      const user = await renderPage()
      await user.click(screen.getAllByRole('button', { name: 'Добавить дело' })[0])

      const dialog = screen.getByRole('dialog', { name: 'Новое дело' })
      await user.type(within(dialog).getByLabelText('Название'), 'Сходить в магазин')
      await user.type(within(dialog).getByLabelText('Описание'), 'Хлеб и сыр')
      await user.selectOptions(within(dialog).getByLabelText('Приоритет'), 'high')
      await user.type(within(dialog).getByLabelText('Дата выполнения'), '2030-05-20')
      await user.click(within(dialog).getByRole('button', { name: 'Создать' }))

      expect(await screen.findByRole('checkbox', { name: 'Сходить в магазин' })).not.toBeChecked()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.getByText('Хлеб и сыр')).toBeInTheDocument()
      expect(within(screen.getByRole('list')).getByText('Высокий')).toBeInTheDocument()
      expect(screen.getByText('Срок: 20 мая 2030 г.')).toBeInTheDocument()
      expect(JSON.parse(localStorage.getItem(TASKS_STORAGE_KEY)!)).toHaveLength(1)
    })

    it('requires a title', async () => {
      const user = await renderPage()
      await user.click(screen.getAllByRole('button', { name: 'Добавить дело' })[0])

      const dialog = screen.getByRole('dialog')
      await user.type(within(dialog).getByLabelText('Название'), '   ')
      await user.click(within(dialog).getByRole('button', { name: 'Создать' }))

      expect(within(dialog).getByText('Введите название')).toBeInTheDocument()
      expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
    })

    it('closes the form with Cancel without creating anything', async () => {
      const user = await renderPage()
      await user.click(screen.getAllByRole('button', { name: 'Добавить дело' })[0])
      await user.type(screen.getByLabelText('Название'), 'Черновик')
      await user.click(screen.getByRole('button', { name: 'Отмена' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.getByText('Пока нет дел')).toBeInTheDocument()
    })
  })

  describe('editing', () => {
    it('opens the form with current values and saves changes', async () => {
      const user = await renderPage(sample)
      await user.click(screen.getByRole('button', { name: 'Редактировать: Купить молоко' }))

      const dialog = screen.getByRole('dialog', { name: 'Редактирование дела' })
      const title = within(dialog).getByLabelText('Название')
      expect(title).toHaveValue('Купить молоко')
      expect(within(dialog).getByLabelText('Приоритет')).toHaveValue('low')
      expect(within(dialog).getByLabelText('Дата выполнения')).toHaveValue('2030-01-10')

      await user.clear(title)
      await user.type(title, 'Купить кефир')
      await user.selectOptions(within(dialog).getByLabelText('Приоритет'), 'medium')
      await user.click(within(dialog).getByRole('button', { name: 'Сохранить' }))

      expect(await screen.findByRole('checkbox', { name: 'Купить кефир' })).toBeInTheDocument()
      expect(screen.queryByRole('checkbox', { name: 'Купить молоко' })).not.toBeInTheDocument()
      expect(within(screen.getByRole('list')).getByText('Средний')).toBeInTheDocument()
    })
  })

  describe('completing', () => {
    it('toggles a task between done (struck through) and active', async () => {
      const user = await renderPage(sample)
      const checkbox = screen.getByRole('checkbox', { name: 'Купить молоко' })
      const title = screen.getByText('Купить молоко')
      expect(title).not.toHaveClass('line-through')

      await user.click(checkbox)
      expect(checkbox).toBeChecked()
      expect(title).toHaveClass('line-through')
      expect(screen.getByText('Выполнено: 2 · Осталось: 1')).toBeInTheDocument()

      await user.click(checkbox)
      expect(checkbox).not.toBeChecked()
      expect(title).not.toHaveClass('line-through')
      expect(screen.getByText('Выполнено: 1 · Осталось: 2')).toBeInTheDocument()
    })
  })

  describe('deleting', () => {
    it('asks for confirmation and deletes on "Удалить"', async () => {
      const user = await renderPage(sample)
      await user.click(screen.getByRole('button', { name: 'Удалить: Купить молоко' }))

      const dialog = screen.getByRole('dialog', { name: 'Удалить дело?' })
      await user.click(within(dialog).getByRole('button', { name: 'Удалить' }))

      expect(screen.queryByRole('checkbox', { name: 'Купить молоко' })).not.toBeInTheDocument()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(titles()).toHaveLength(2)
    })

    it('keeps the task when the confirmation is cancelled', async () => {
      const user = await renderPage(sample)
      await user.click(screen.getByRole('button', { name: 'Удалить: Купить молоко' }))
      await user.click(
        within(screen.getByRole('dialog', { name: 'Удалить дело?' })).getByRole('button', {
          name: 'Отмена',
        }),
      )

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: 'Купить молоко' })).toBeInTheDocument()
    })
  })

  describe('search, filters and sorting', () => {
    it('searches by title in real time', async () => {
      const user = await renderPage(sample)
      const search = screen.getByPlaceholderText('Поиск дел...')

      await user.type(search, 'позв')
      expect(titles()).toEqual(['Позвонить маме'])

      await user.clear(search)
      expect(titles()).toHaveLength(3)

      await user.type(search, 'zzz')
      expect(screen.getByText('Ничего не найдено')).toBeInTheDocument()
    })

    it('filters by status and priority at the same time', async () => {
      const user = await renderPage(sample)

      await user.click(screen.getByRole('button', { name: 'Активные' }))
      expect(titles()).toEqual(['Позвонить маме', 'Купить молоко'])

      await user.selectOptions(screen.getByLabelText('Фильтр по приоритету'), 'high')
      expect(titles()).toEqual(['Позвонить маме'])

      await user.click(screen.getByRole('button', { name: 'Выполненные' }))
      expect(titles()).toEqual(['Написать отчёт'])

      await user.selectOptions(screen.getByLabelText('Фильтр по приоритету'), 'low')
      expect(screen.getByText('Ничего не найдено')).toBeInTheDocument()
    })

    it('sorts the list', async () => {
      const user = await renderPage(sample)
      const sort = screen.getByLabelText('Сортировка')

      expect(titles()).toEqual(['Позвонить маме', 'Написать отчёт', 'Купить молоко'])

      await user.selectOptions(sort, 'oldest')
      expect(titles()).toEqual(['Купить молоко', 'Написать отчёт', 'Позвонить маме'])

      await user.selectOptions(sort, 'priority')
      expect(titles()).toEqual(['Позвонить маме', 'Написать отчёт', 'Купить молоко'])

      await user.selectOptions(sort, 'dueDate')
      expect(titles()).toEqual(['Позвонить маме', 'Купить молоко', 'Написать отчёт'])
    })
  })

  describe('overdue tasks', () => {
    it('marks unfinished tasks with a passed due date as overdue', async () => {
      const user = await renderPage([
        { id: '1', title: 'Давно', completed: false, priority: 'low', dueDate: '2000-09-20' },
      ])

      expect(screen.getByText('Срок: 20 сентября 2000 г. · Просрочено')).toBeInTheDocument()

      await user.click(screen.getByRole('checkbox', { name: 'Давно' }))
      expect(screen.getByText('Срок: 20 сентября 2000 г.')).toBeInTheDocument()
    })
  })
})
