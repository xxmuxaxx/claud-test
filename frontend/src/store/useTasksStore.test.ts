import { beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from '@/api/http'
import { DEFAULT_TASK_VIEW } from '@/lib/taskView'
import { backend } from '@/test/fakeBackend'
import { useTasksStore } from './useTasksStore'

const state = () => useTasksStore.getState()
const titles = () => state().tasks.map((task) => task.title)

describe('useTasksStore', () => {
  beforeEach(() => {
    useTasksStore.setState({
      tasks: [],
      stats: { total: 0, active: 0, completed: 0 },
      view: DEFAULT_TASK_VIEW,
      status: 'idle',
      error: undefined,
    })
  })

  it('loads the tasks and the counters from the backend', async () => {
    backend.seedTasks([
      { id: 'a', title: 'Первая', completed: false, priority: 'low' },
      { id: 'b', title: 'Вторая', completed: true, priority: 'high', dueDate: '2030-01-01' },
    ])

    await state().load(DEFAULT_TASK_VIEW)

    expect(state().status).toBe('ready')
    expect(titles()).toEqual(['Вторая', 'Первая']) // Newest first.
    expect(state().tasks[0]).toEqual({
      id: 'b',
      title: 'Вторая',
      completed: true,
      priority: 'high',
      dueDate: '2030-01-01',
      description: undefined,
    })
    expect(state().stats).toEqual({ total: 2, active: 1, completed: 1 })
  })

  it('sends search, filters and sorting to the backend instead of doing them locally', async () => {
    backend.seedTasks([
      { id: '1', title: 'Купить молоко', completed: false, priority: 'low' },
      { id: '2', title: 'Написать отчёт', completed: true, priority: 'high' },
      { id: '3', title: 'Купить билеты', completed: false, priority: 'high' },
    ])

    await state().load({ query: ' купить ', status: 'active', priority: 'high', sort: 'oldest' })

    expect(titles()).toEqual(['Купить билеты'])
    expect(backend.requests).toContain(
      `GET /tasks?search=${encodeURIComponent('купить')}&status=active&priority=high&sort=createdAt&order=asc`,
    )
    // The counters are not affected by the filters.
    expect(state().stats.total).toBe(3)
  })

  it('creates an active task', async () => {
    await state().load(DEFAULT_TASK_VIEW)
    await state().addTask({ title: 'Задача', priority: 'high' })

    expect(backend.tasks).toHaveLength(1)
    expect(state().tasks[0]).toMatchObject({ title: 'Задача', priority: 'high', completed: false })
    expect(state().tasks[0].id).toBeTruthy()
    expect(state().stats).toEqual({ total: 1, active: 1, completed: 0 })
  })

  it('edits a task, including clearing optional fields', async () => {
    await state().load(DEFAULT_TASK_VIEW)
    await state().addTask({
      title: 'Старое',
      description: 'Описание',
      priority: 'low',
      dueDate: '2030-01-01',
    })
    const { id } = state().tasks[0]

    await state().updateTask(id, { title: 'Новое', priority: 'medium' })

    expect(state().tasks[0]).toEqual({
      id,
      title: 'Новое',
      priority: 'medium',
      completed: false,
      description: undefined,
      dueDate: undefined,
    })
  })

  it('toggles completion back and forth and updates the counters', async () => {
    await state().load(DEFAULT_TASK_VIEW)
    await state().addTask({ title: 'Задача', priority: 'low' })
    const { id } = state().tasks[0]

    await state().toggleTask(id)
    expect(state().tasks[0].completed).toBe(true)
    expect(state().stats).toEqual({ total: 1, active: 0, completed: 1 })

    await state().toggleTask(id)
    expect(state().tasks[0].completed).toBe(false)
    expect(state().stats).toEqual({ total: 1, active: 1, completed: 0 })
  })

  it('removes a task', async () => {
    await state().load(DEFAULT_TASK_VIEW)
    await state().addTask({ title: 'Первая', priority: 'low' })
    await state().addTask({ title: 'Вторая', priority: 'low' })
    const second = state().tasks.find((task) => task.title === 'Вторая')!

    await state().removeTask(second.id)

    expect(titles()).toEqual(['Первая'])
    expect(backend.tasks).toHaveLength(1)
  })

  it('keeps the current view after a change: a completed task leaves the "active" list', async () => {
    backend.seedTasks([
      { id: 'a', title: 'Первая', completed: false, priority: 'low' },
      { id: 'b', title: 'Вторая', completed: false, priority: 'low' },
    ])
    await state().load({ ...DEFAULT_TASK_VIEW, status: 'active' })

    await state().toggleTask('a')

    expect(titles()).toEqual(['Вторая'])
    expect(state().stats).toEqual({ total: 2, active: 1, completed: 1 })
  })

  it('ignores a slow response that arrives after a newer request', async () => {
    backend.seedTasks([
      { id: '1', title: 'Молоко', completed: false, priority: 'low' },
      { id: '2', title: 'Хлеб', completed: false, priority: 'low' },
    ])
    const respond = backend.fetch.getMockImplementation()!
    let releaseSlow: () => void = () => {}
    const gate = new Promise<void>((resolve) => (releaseSlow = resolve))
    backend.fetch.mockImplementation(async (input, init) => {
      // The older query ("м") is the slow one.
      if (String(input).includes(`search=${encodeURIComponent('м')}`)) await gate
      return respond(input, init)
    })

    const slow = state().load({ ...DEFAULT_TASK_VIEW, query: 'м' })
    await state().load({ ...DEFAULT_TASK_VIEW, query: 'хл' })
    releaseSlow()
    await slow

    expect(titles()).toEqual(['Хлеб'])
    expect(state().view.query).toBe('хл')
  })

  it('reports an unreachable backend and recovers on the next load', async () => {
    backend.offline = true
    await state().load(DEFAULT_TASK_VIEW)

    expect(state().status).toBe('error')
    expect(state().error).toBeInstanceOf(ApiError)
    expect((state().error as ApiError).isNetworkError).toBe(true)

    backend.offline = false
    await state().load(DEFAULT_TASK_VIEW)
    expect(state().status).toBe('ready')
    expect(state().error).toBeUndefined()
  })

  it('lets a failed change propagate and leaves the list as it was', async () => {
    backend.seedTasks([{ id: 'a', title: 'Первая', completed: false, priority: 'low' }])
    await state().load(DEFAULT_TASK_VIEW)

    backend.offline = true
    await expect(state().removeTask('a')).rejects.toBeInstanceOf(ApiError)

    expect(titles()).toEqual(['Первая'])
  })
})
