import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TasksPage } from './TasksPage'
import { DEFAULT_TASK_VIEW } from '@/lib/taskView'
import { useTasksStore } from '@/store/useTasksStore'
import { backend } from '@/test/fakeBackend'
import type { Task } from '@/types/task'

async function renderPage(tasks: Task[] = []) {
  backend.seedTasks(tasks)
  const user = userEvent.setup()
  render(<TasksPage />)
  await screen.findByRole('heading', { name: 'Список дел' })
  // Wait for the first response of the backend.
  await (tasks.length === 0
    ? screen.findByText('Пока нет дел')
    : screen.findByPlaceholderText('Поиск дел...'))
  return user
}

const titles = () =>
  screen.queryAllByRole('checkbox').map((checkbox) => checkbox.getAttribute('aria-label'))

/** The list is what the backend returned for the current search, filters and sorting. */
const expectTitles = (expected: string[]) => waitFor(() => expect(titles()).toEqual(expected))

const sample: Task[] = [
  { id: '1', title: 'Купить молоко', completed: false, priority: 'low', dueDate: '2030-01-10' },
  { id: '2', title: 'Написать отчёт', completed: true, priority: 'high' },
  { id: '3', title: 'Позвонить маме', completed: false, priority: 'high', dueDate: '2030-01-05' },
]

describe('TasksPage', () => {
  beforeEach(() => {
    useTasksStore.setState({
      tasks: [],
      stats: { total: 0, active: 0, completed: 0 },
      view: DEFAULT_TASK_VIEW,
      status: 'idle',
      refreshing: false,
      error: undefined,
    })
  })

  describe('loading', () => {
    it('shows a placeholder until the first response arrives', async () => {
      backend.seedTasks(sample)
      render(<TasksPage />)

      expect(screen.getByRole('status')).toHaveTextContent('Загрузка…')
      await screen.findByPlaceholderText('Поиск дел...')
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    it('keeps the save button busy until the backend answers', async () => {
      const user = await renderPage()
      const answer = backend.fetch.getMockImplementation()!
      let release = () => {}
      const held = new Promise<void>((resolve) => (release = resolve))
      backend.fetch.mockImplementation(async (...args) => {
        const [, init] = args
        if (init?.method === 'POST') await held
        return answer(...args)
      })

      await user.click(screen.getAllByRole('button', { name: 'Добавить дело' })[0])
      await user.type(screen.getByLabelText('Название'), 'Новое дело')
      await user.click(screen.getByRole('button', { name: 'Создать' }))

      expect(screen.getByRole('button', { name: 'Создать' })).toBeDisabled()
      release()
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    })
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
    it('adds a task from the form to the list and saves it on the backend', async () => {
      const user = await renderPage()
      await user.click(screen.getAllByRole('button', { name: 'Добавить дело' })[0])

      const dialog = screen.getByRole('dialog', { name: 'Новое дело' })
      await user.type(within(dialog).getByLabelText('Название'), 'Сходить в магазин')
      await user.type(within(dialog).getByLabelText('Описание'), 'Хлеб и сыр')
      await user.selectOptions(within(dialog).getByLabelText('Приоритет'), 'high')
      await user.type(within(dialog).getByLabelText('Дата выполнения'), '2030-05-20')
      await user.click(within(dialog).getByRole('button', { name: 'Создать' }))

      expect(await screen.findByRole('checkbox', { name: 'Сходить в магазин' })).not.toBeChecked()
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      expect(screen.getByText('Хлеб и сыр')).toBeInTheDocument()
      expect(within(screen.getByRole('list')).getByText('Высокий')).toBeInTheDocument()
      expect(screen.getByText('Срок: 20 мая 2030 г.')).toBeInTheDocument()
      expect(screen.getByText('Выполнено: 0 · Осталось: 1')).toBeInTheDocument()
      expect(backend.tasks).toHaveLength(1)
      expect(backend.tasks[0]).toMatchObject({
        title: 'Сходить в магазин',
        description: 'Хлеб и сыр',
        priority: 'high',
        dueDate: '2030-05-20',
        completed: false,
      })
    })

    it('requires a title', async () => {
      const user = await renderPage()
      await user.click(screen.getAllByRole('button', { name: 'Добавить дело' })[0])

      const dialog = screen.getByRole('dialog')
      await user.type(within(dialog).getByLabelText('Название'), '   ')
      await user.click(within(dialog).getByRole('button', { name: 'Создать' }))

      expect(within(dialog).getByText('Введите название')).toBeInTheDocument()
      expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
      expect(backend.count('POST')).toBe(0)
    })

    it('closes the form with Cancel without creating anything', async () => {
      const user = await renderPage()
      await user.click(screen.getAllByRole('button', { name: 'Добавить дело' })[0])
      await user.type(screen.getByLabelText('Название'), 'Черновик')
      await user.click(screen.getByRole('button', { name: 'Отмена' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.getByText('Пока нет дел')).toBeInTheDocument()
      expect(backend.tasks).toHaveLength(0)
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
      await waitFor(() =>
        expect(screen.queryByRole('checkbox', { name: 'Купить молоко' })).not.toBeInTheDocument(),
      )
      expect(within(screen.getByRole('list')).getByText('Средний')).toBeInTheDocument()
      expect(backend.tasks.find((task) => task.id === '1')).toMatchObject({
        title: 'Купить кефир',
        priority: 'medium',
      })
    })

    it('removes the description and the due date that were cleared in the form', async () => {
      const user = await renderPage([
        {
          id: '1',
          title: 'Задача',
          description: 'Текст',
          completed: false,
          priority: 'low',
          dueDate: '2030-01-10',
        },
      ])
      await user.click(screen.getByRole('button', { name: 'Редактировать: Задача' }))
      const dialog = screen.getByRole('dialog')
      await user.clear(within(dialog).getByLabelText('Описание'))
      await user.clear(within(dialog).getByLabelText('Дата выполнения'))
      await user.click(within(dialog).getByRole('button', { name: 'Сохранить' }))

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      expect(backend.tasks[0].description).toBeUndefined()
      expect(backend.tasks[0].dueDate).toBeUndefined()
      expect(screen.queryByText('Текст')).not.toBeInTheDocument()
    })
  })

  describe('completing', () => {
    it('toggles a task between done (struck through) and active', async () => {
      const user = await renderPage(sample)
      const checkbox = screen.getByRole('checkbox', { name: 'Купить молоко' })
      const title = screen.getByText('Купить молоко')
      expect(title).not.toHaveClass('line-through')

      await user.click(checkbox)
      await waitFor(() => expect(checkbox).toBeChecked())
      expect(title).toHaveClass('line-through')
      expect(await screen.findByText('Выполнено: 2 · Осталось: 1')).toBeInTheDocument()
      expect(backend.tasks.find((task) => task.id === '1')?.completed).toBe(true)

      await user.click(checkbox)
      await waitFor(() => expect(checkbox).not.toBeChecked())
      expect(title).not.toHaveClass('line-through')
      expect(await screen.findByText('Выполнено: 1 · Осталось: 2')).toBeInTheDocument()
    })
  })

  describe('deleting', () => {
    it('asks for confirmation and deletes on "Удалить"', async () => {
      const user = await renderPage(sample)
      await user.click(screen.getByRole('button', { name: 'Удалить: Купить молоко' }))

      const dialog = screen.getByRole('dialog', { name: 'Удалить дело?' })
      await user.click(within(dialog).getByRole('button', { name: 'Удалить' }))

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      expect(screen.queryByRole('checkbox', { name: 'Купить молоко' })).not.toBeInTheDocument()
      expect(titles()).toHaveLength(2)
      expect(backend.tasks.map((task) => task.id)).toEqual(['2', '3'])
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
      expect(backend.tasks).toHaveLength(3)
    })
  })

  describe('search, filters and sorting', () => {
    it('searches on the backend while typing', async () => {
      const user = await renderPage(sample)
      const search = screen.getByPlaceholderText('Поиск дел...')

      await user.type(search, 'позв')
      await expectTitles(['Позвонить маме'])
      // The backend got the search text; nothing was filtered in the browser.
      expect(backend.requests).toContain(
        `GET /tasks?search=${encodeURIComponent('позв')}&sort=createdAt&order=desc`,
      )

      await user.clear(search)
      await expectTitles(['Позвонить маме', 'Написать отчёт', 'Купить молоко'])

      await user.type(search, 'zzz')
      expect(await screen.findByText('Ничего не найдено')).toBeInTheDocument()
    })

    it('waits for a pause in typing instead of sending a request per keystroke', async () => {
      const user = await renderPage(sample)
      const before = backend.count('GET /tasks?')

      await user.type(screen.getByPlaceholderText('Поиск дел...'), 'позвонить')
      await expectTitles(['Позвонить маме'])

      // One request for the finished word, not one for each of its 9 letters.
      expect(backend.count('GET /tasks?') - before).toBeLessThanOrEqual(2)
    })

    it('also finds by description', async () => {
      const user = await renderPage([
        { id: '1', title: 'Задача', description: 'Купить хлеб', completed: false, priority: 'low' },
        { id: '2', title: 'Другая', completed: false, priority: 'low' },
      ])

      await user.type(screen.getByPlaceholderText('Поиск дел...'), 'хлеб')

      await expectTitles(['Задача'])
    })

    it('filters by status and priority at the same time', async () => {
      const user = await renderPage(sample)

      await user.click(screen.getByRole('button', { name: 'Активные' }))
      await expectTitles(['Позвонить маме', 'Купить молоко'])

      await user.selectOptions(screen.getByLabelText('Фильтр по приоритету'), 'high')
      await expectTitles(['Позвонить маме'])

      await user.click(screen.getByRole('button', { name: 'Выполненные' }))
      await expectTitles(['Написать отчёт'])

      await user.selectOptions(screen.getByLabelText('Фильтр по приоритету'), 'low')
      expect(await screen.findByText('Ничего не найдено')).toBeInTheDocument()
    })

    it('sorts the list', async () => {
      const user = await renderPage(sample)
      const sort = screen.getByLabelText('Сортировка')

      await expectTitles(['Позвонить маме', 'Написать отчёт', 'Купить молоко'])

      await user.selectOptions(sort, 'oldest')
      await expectTitles(['Купить молоко', 'Написать отчёт', 'Позвонить маме'])

      await user.selectOptions(sort, 'priority')
      await expectTitles(['Позвонить маме', 'Написать отчёт', 'Купить молоко'])

      await user.selectOptions(sort, 'dueDate')
      await expectTitles(['Позвонить маме', 'Купить молоко', 'Написать отчёт'])
    })

    it('keeps the search box and the counters when nothing matches', async () => {
      const user = await renderPage(sample)

      await user.type(screen.getByPlaceholderText('Поиск дел...'), 'zzz')

      expect(await screen.findByText('Ничего не найдено')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Поиск дел...')).toHaveValue('zzz')
      expect(screen.getByText('Выполнено: 1 · Осталось: 2')).toBeInTheDocument()
    })
  })

  describe('when the backend is unavailable', () => {
    it('says so with a retry button, and shows the tasks once it is back', async () => {
      backend.seedTasks(sample)
      backend.offline = true
      const user = userEvent.setup()
      render(<TasksPage />)

      const alert = await screen.findByRole('alert')
      expect(alert).toHaveTextContent('Не удаётся связаться с сервером')
      expect(screen.queryByPlaceholderText('Поиск дел...')).not.toBeInTheDocument()

      backend.offline = false
      await user.click(within(alert).getByRole('button', { name: 'Повторить' }))

      expect(await screen.findByPlaceholderText('Поиск дел...')).toBeInTheDocument()
      expect(titles()).toHaveLength(3)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('keeps the form open with the typed data when saving fails', async () => {
      const user = await renderPage(sample)
      await user.click(screen.getAllByRole('button', { name: 'Добавить дело' })[0])
      const dialog = screen.getByRole('dialog', { name: 'Новое дело' })
      await user.type(within(dialog).getByLabelText('Название'), 'Важное')

      backend.offline = true
      await user.click(within(dialog).getByRole('button', { name: 'Создать' }))

      expect(await within(dialog).findByRole('alert')).toHaveTextContent('Не удаётся связаться')
      expect(within(dialog).getByLabelText('Название')).toHaveValue('Важное')

      backend.offline = false
      await user.click(within(dialog).getByRole('button', { name: 'Создать' }))
      expect(await screen.findByRole('checkbox', { name: 'Важное' })).toBeInTheDocument()
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    })

    it('shows the error when a task cannot be deleted and keeps the task', async () => {
      const user = await renderPage(sample)
      await user.click(screen.getByRole('button', { name: 'Удалить: Купить молоко' }))
      const dialog = screen.getByRole('dialog', { name: 'Удалить дело?' })

      backend.offline = true
      await user.click(within(dialog).getByRole('button', { name: 'Удалить' }))

      expect(await within(dialog).findByRole('alert')).toBeInTheDocument()
      backend.offline = false
      await user.click(within(dialog).getByRole('button', { name: 'Отмена' }))
      expect(screen.getByRole('checkbox', { name: 'Купить молоко' })).toBeInTheDocument()
    })
  })

  describe('overdue tasks', () => {
    it('marks unfinished tasks with a passed due date as overdue', async () => {
      const user = await renderPage([
        { id: '1', title: 'Давно', completed: false, priority: 'low', dueDate: '2000-09-20' },
      ])

      expect(screen.getByText('Срок: 20 сентября 2000 г. · Просрочено')).toBeInTheDocument()

      await user.click(screen.getByRole('checkbox', { name: 'Давно' }))
      expect(await screen.findByText('Срок: 20 сентября 2000 г.')).toBeInTheDocument()
    })
  })
})
